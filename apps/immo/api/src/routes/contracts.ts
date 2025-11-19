import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const contracts = new Hono()

// GET /api/contracts
contracts.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('immo_app.contracts')
      .select('*, properties(*)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ contracts: data })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return c.json({ error: 'Failed to fetch contracts' }, 500)
  }
})

// GET /api/contracts/:id
contracts.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { data, error } = await supabase
      .from('immo_app.contracts')
      .select('*, properties(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return c.json({ error: 'Contract not found' }, 404)

    return c.json({ contract: data })
  } catch (error) {
    console.error('Error fetching contract:', error)
    return c.json({ error: 'Failed to fetch contract' }, 500)
  }
})

// POST /api/contracts
contracts.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  try {
    const { data, error } = await supabase
      .from('immo_app.contracts')
      .insert({
        ...body,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ contract: data }, 201)
  } catch (error) {
    console.error('Error creating contract:', error)
    return c.json({ error: 'Failed to create contract' }, 500)
  }
})

export default contracts
