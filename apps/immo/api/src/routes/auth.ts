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

    // Call PostgreSQL function to create tenant, user and role
    // This function uses SECURITY DEFINER to bypass RLS securely
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .rpc('register_user_and_tenant', {
        p_user_id: authData.user.id,
        p_email: validated.email,
        p_full_name: validated.full_name,
        p_tenant_name: validated.tenant_name,
        p_tenant_slug: validated.tenant_slug,
        p_app_type: 'immo_app'
      })

    if (registrationError || !registrationData) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Registration function error:', registrationError)
      return c.json({
        error: 'Registration Failed',
        message: 'Impossible de créer l\'organisation',
        details: registrationError?.message
      }, 500)
    }

    // Extract data from function result
    const user = registrationData.user
    const tenant = registrationData.tenant
    const userRole = registrationData.role

    // Create session to get access token
    const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    })

    if (sessionError || !session.session) {
      console.error('Session creation error:', sessionError)
      // Registration succeeded but no session - user will need to login manually
      return c.json({
        message: 'Inscription réussie',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: userRole.role
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name
        }
      }, 201)
    }

    return c.json({
      message: 'Inscription réussie',
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: userRole.role
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name
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
      console.error('Auth sign in error:', error)
      return c.json({
        error: 'Authentication Failed',
        message: 'Email ou mot de passe incorrect',
        details: error?.message
      }, 401)
    }

    console.log('Auth successful, user ID:', data.user.id)

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError || !user) {
      console.error('User lookup error:', userError)
      console.log('Looking for user ID:', data.user.id)
      return c.json({
        error: 'Authentication Failed',
        message: 'Utilisateur non trouvé dans la base de données',
        details: userError?.message,
        userId: data.user.id
      }, 401)
    }

    // Get user's tenant role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_tenant_roles')
      .select('*, tenants(*)')
      .eq('user_id', data.user.id)
      .eq('is_active', true)
      .single()

    if (roleError || !userRole) {
      console.error('Role lookup error:', roleError)
      console.log('Looking for active role for user ID:', data.user.id)
      return c.json({
        error: 'Authentication Failed',
        message: 'Aucun rôle actif trouvé pour cet utilisateur',
        details: roleError?.message,
        userId: data.user.id
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
        role: userRole.role,
        tenant_id: userRole.tenant_id
      },
      tenant: userRole.tenants
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

/**
 * POST /api/auth/validate
 * Validate authentication token
 */
auth.post('/validate', async (c) => {
  const { token } = await c.req.json()

  if (!token) {
    return c.json({ error: 'Token required' }, 400)
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    return c.json({ valid: true, user })
  } catch (error) {
    return c.json({ error: 'Validation failed' }, 500)
  }
})

export default auth
