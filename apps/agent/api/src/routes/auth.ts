import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const auth = new Hono()

/**
 * POST /api/auth/register
 * Register a new tenant with owner user
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, full_name, tenant_name, tenant_slug } = body

    // Basic validation
    if (!email || !password || !full_name || !tenant_name || !tenant_slug) {
      return c.json({
        error: 'Validation Error',
        message: 'Tous les champs sont requis'
      }, 400)
    }

    // Check if tenant slug is available
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenant_slug)
      .single()

    if (existingTenant) {
      return c.json({
        error: 'Validation Error',
        message: 'Ce slug est déjà utilisé. Veuillez en choisir un autre.'
      }, 400)
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      return c.json({
        error: 'Registration Failed',
        message: authError?.message || 'Impossible de créer le compte'
      }, 400)
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        slug: tenant_slug,
        name: tenant_name,
        subscription_plan: 'free',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('Tenant creation error:', tenantError)
      return c.json({
        error: 'Registration Failed',
        message: 'Impossible de créer l\'organisation'
      }, 500)
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email,
        full_name,
        role: 'owner',
        is_active: true,
        email_verified: true
      })
      .select()
      .single()

    if (userError || !user) {
      // Rollback: delete tenant and auth user
      await supabase.from('tenants').delete().eq('id', tenant.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error('User creation error:', userError)
      return c.json({
        error: 'Registration Failed',
        message: 'Impossible de créer l\'utilisateur'
      }, 500)
    }

    // Create session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return c.json({
      message: 'Inscription réussie',
      access_token: sessionData?.session?.access_token,
      refresh_token: sessionData?.session?.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        subscription_plan: tenant.subscription_plan
      }
    }, 201)
  } catch (error: any) {
    console.error('Registration error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue lors de l\'inscription'
    }, 500)
  }
})

/**
 * POST /api/auth/login
 * Login with email and password
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    if (!email || !password) {
      return c.json({
        error: 'Validation Error',
        message: 'Email et mot de passe requis'
      }, 400)
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      return c.json({
        error: 'Authentication Failed',
        message: 'Email ou mot de passe incorrect'
      }, 401)
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', data.user.id)
      .single()

    if (userError || !user) {
      return c.json({
        error: 'Authentication Failed',
        message: 'Utilisateur non trouvé'
      }, 401)
    }

    return c.json({
      message: 'Connexion réussie',
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tenant_id: user.tenant_id
      },
      tenant: user.tenants
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue lors de la connexion'
    }, 500)
  }
})

// Validation du token (utilisé par le frontend)
auth.post('/validate', async (c) => {
  const { token } = await c.req.json()

  if (!token) {
    return c.json({ error: 'Token required' }, 400)
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    return c.json({ valid: true, user })
  } catch (error) {
    return c.json({ error: 'Validation failed' }, 500)
  }
})

export default auth
