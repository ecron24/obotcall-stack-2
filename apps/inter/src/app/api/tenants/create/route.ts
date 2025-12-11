import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client pour bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface CreateTenantRequest {
  company_name: string
  slug: string
  app_type: 'inter_app' | 'immo_app' | 'agent_app' | 'assist_app'
  country_code: string
  owner_user_id: string
  plan?: 'free' | 'starter' | 'pro' | 'enterprise'
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTenantRequest = await request.json()

    const {
      company_name,
      slug,
      app_type,
      country_code,
      owner_user_id,
      plan = 'free'
    } = body

    // Validation
    if (!company_name || !slug || !app_type || !country_code || !owner_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Vérifier que le slug est disponible
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 409 }
      )
    }

    // Vérifier que l'utilisateur existe
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', owner_user_id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Créer le tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: company_name,
        slug,
        app_type,
        country_code,
        is_active: true,
        created_by: owner_user_id
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      )
    }

    // Assigner l'utilisateur comme owner
    const { error: roleError } = await supabaseAdmin
      .from('user_tenant_roles')
      .insert({
        user_id: owner_user_id,
        tenant_id: tenant.id,
        role: 'owner',
        is_active: true,
        created_by: owner_user_id
      })

    if (roleError) {
      console.error('Error creating user role:', roleError)
      // Rollback: supprimer le tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { error: 'Failed to assign owner role' },
        { status: 500 }
      )
    }

    // Créer la subscription par défaut
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14) // 14 jours d'essai

    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan: plan === 'free' ? 'free' : 'starter',
        status: plan === 'free' ? 'active' : 'trialing',
        billing_cycle: 'monthly',
        trial_start: new Date().toISOString(),
        trial_end: trialEndDate.toISOString(),
        usage_limits: {
          max_users: plan === 'free' ? 2 : 10,
          max_storage_gb: plan === 'free' ? 1 : 10,
          max_api_calls_per_month: plan === 'free' ? 1000 : 10000
        },
        features: {}
      })

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      // Note: On continue quand même, la subscription peut être créée plus tard
    }

    // Initialiser les données par défaut pour inter_app
    if (app_type === 'inter_app') {
      await initializeInterAppDefaults(tenant.id)
    }

    return NextResponse.json({
      tenant,
      message: 'Tenant created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Initialise les données par défaut pour inter_app
 */
async function initializeInterAppDefaults(tenantId: string) {
  try {
    // Créer les company_settings par défaut
    await supabaseAdmin
      .schema('inter_app')
      .from('company_settings')
      .insert({
        tenant_id: tenantId,
        company_name: 'Ma société',
        email: '',
        phone: '',
        invoice_prefix: 'INV',
        invoice_footer_text: '',
        siret: '',
        tva_number: '',
        created_at: new Date().toISOString()
      })

    // Créer quelques product_categories par défaut
    const categories = [
      { name: 'Produits', description: 'Produits vendus', tenant_id: tenantId },
      { name: 'Services', description: 'Services fournis', tenant_id: tenantId },
      { name: 'Main d\'œuvre', description: 'Heures de travail', tenant_id: tenantId }
    ]

    await supabaseAdmin
      .schema('inter_app')
      .from('product_categories')
      .insert(categories)

    console.log(`✅ Initialized defaults for tenant ${tenantId}`)
  } catch (error) {
    console.error('Error initializing defaults:', error)
    // Ne pas faire échouer la création du tenant si l'initialisation échoue
  }
}
