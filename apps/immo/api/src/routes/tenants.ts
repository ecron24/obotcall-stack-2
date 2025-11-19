import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const tenants = new Hono()

// GET /api/tenants
tenants.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('immo_app.tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ tenants: data })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return c.json({ error: 'Failed to fetch tenants' }, 500)
  }
})

export default tenants
