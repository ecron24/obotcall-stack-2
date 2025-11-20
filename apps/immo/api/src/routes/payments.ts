import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const payments = new Hono()

// GET /api/payments
payments.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('immo_app.payments')
      .select('*, contracts(*)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ payments: data })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return c.json({ error: 'Failed to fetch payments' }, 500)
  }
})

export default payments
