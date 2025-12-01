import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'
import { registerSchema, loginSchema } from '../lib/validation.js'
import { SubscriptionPlan, UserRole } from '../types/index.js'

const auth = new Hono()

/**
 * POST /api/auth/register
 * Register a new tenant with owner user
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    // Check if tenant slug is available
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', validated.tenant_slug)
      .single()

    if (existingTenant) {
      return c.json({
        error: 'Validation Error',
        message: 'Ce slug est déjà utilisé. Veuillez en choisir un autre.'
      }, 400)
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name: validated.full_name
      }
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      return c.json({
        error: 'Registration Failed',
        message: authError?.message || 'Impossible de créer le compte'
      }, 400)
    }

    // Create user record in public.users FIRST (before tenant)
    console.log('Creating user in public.users:', {
      id: authData.user.id,
      email: validated.email,
      full_name: validated.full_name
    })

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: validated.email,
        full_name: validated.full_name
      })
      .select()
      .single()

    console.log('User creation result:', {
      user,
      userError,
      hasUser: !!user,
      hasError: !!userError
    })

    if (userError || !user) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('User creation error:', userError)
      return c.json({
        error: 'Registration Failed',
        message: 'Impossible de créer l\'utilisateur',
        details: userError?.message || 'Unknown error'
      }, 500)
    }

    // Verify user was created
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    console.log('User verification:', { verifyUser, verifyError })

    // Create tenant AFTER user exists
    console.log('Creating tenant:', {
      slug: validated.tenant_slug,
      name: validated.tenant_name,
      app_type: 'inter_app',
      created_by: user.id
    })

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        slug: validated.tenant_slug,
        name: validated.tenant_name,
        app_type: 'inter_app',
        is_active: true,
        created_by: user.id
        // Removed country_code temporarily to avoid FK constraint
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      // Rollback: delete user and auth user
      await supabaseAdmin.from('users').delete().eq('id', user.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Tenant creation error:', tenantError)
      return c.json({
        error: 'Registration Failed',
        message: 'Impossible de créer l\'organisation'
      }, 500)
    }

    // Link user to tenant with owner role
    const { error: roleError } = await supabaseAdmin
      .from('user_tenant_roles')
      .insert({
        user_id: user.id,
        tenant_id: tenant.id,
        role: 'owner',
        created_by: user.id
      })

    if (roleError) {
      // Rollback: delete user, tenant and auth user
      await supabaseAdmin.from('users').delete().eq('id', user.id)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Role assignment error:', roleError)
      return c.json({
        error: 'Registration Failed',
        message: 'Impossible d\'assigner le rôle'
      }, 500)
    }

    // Sign in the user to get session tokens
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    })

    if (signInError || !signInData.session) {
      console.error('Auto sign-in error:', signInError)
      // Registration succeeded but auto sign-in failed, user can login manually
      return c.json({
        message: 'Inscription réussie. Veuillez vous connecter.',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: 'owner',
          tenant_id: tenant.id
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          app_type: tenant.app_type
        }
      }, 201)
    }

    return c.json({
      message: 'Inscription réussie',
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'owner',
        tenant_id: tenant.id
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        app_type: tenant.app_type
      }
    }, 201)
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error.name === 'ZodError') {
      return c.json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: error.errors
      }, 400)
    }
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
    const validated = loginSchema.parse(body)

    // Sign in with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    })

    if (error || !data.user) {
      return c.json({
        error: 'Authentication Failed',
        message: 'Email ou mot de passe incorrect'
      }, 401)
    }

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError || !user) {
      return c.json({
        error: 'Authentication Failed',
        message: 'Utilisateur non trouvé'
      }, 401)
    }

    // Get user's tenant and role
    const { data: userTenantRole, error: roleError } = await supabaseAdmin
      .from('user_tenant_roles')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (roleError || !userTenantRole) {
      return c.json({
        error: 'Authentication Failed',
        message: 'Aucun tenant actif trouvé pour cet utilisateur'
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
        role: userTenantRole.role,
        tenant_id: userTenantRole.tenant_id
      },
      tenant: userTenantRole.tenants
    })
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.name === 'ZodError') {
      return c.json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: error.errors
      }, 400)
    }
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue lors de la connexion'
    }, 500)
  }
})

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return c.json({
        error: 'Bad Request',
        message: 'Refresh token manquant'
      }, 400)
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token
    })

    if (error || !data.session) {
      return c.json({
        error: 'Refresh Failed',
        message: 'Token de rafraîchissement invalide'
      }, 401)
    }

    return c.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue lors du rafraîchissement du token'
    }, 500)
  }
})

/**
 * POST /api/auth/logout
 * Logout (revoke session)
 */
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ message: 'Déconnexion réussie' })
    }

    const token = authHeader.substring(7)
    await supabaseAdmin.auth.admin.signOut(token)

    return c.json({ message: 'Déconnexion réussie' })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ message: 'Déconnexion réussie' })
  }
})

export default auth
