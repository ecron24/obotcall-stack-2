import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const executions = new Hono()

// GET /api/executions
executions.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('agent_app.executions')
      .select('*, workflows(*), agents(*)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return c.json({ executions: data })
  } catch (error) {
    console.error('Error fetching executions:', error)
    return c.json({ error: 'Failed to fetch executions' }, 500)
  }
})

// GET /api/executions/:id
executions.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { data, error } = await supabase
      .from('agent_app.executions')
      .select('*, workflows(*), agents(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return c.json({ error: 'Execution not found' }, 404)

    return c.json({ execution: data })
  } catch (error) {
    console.error('Error fetching execution:', error)
    return c.json({ error: 'Failed to fetch execution' }, 500)
  }
})

export default executions
