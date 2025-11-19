import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const auth = new Hono()

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
