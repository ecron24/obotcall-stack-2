import { Context, Next } from 'hono'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - Missing token' }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401)
    }

    // Ajouter l'utilisateur au contexte
    c.set('user', user)
    c.set('userId', user.id)

    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
