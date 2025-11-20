import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const workflows = new Hono()

// GET /api/workflows
workflows.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('agent_app.workflows')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ workflows: data })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return c.json({ error: 'Failed to fetch workflows' }, 500)
  }
})

// GET /api/workflows/:id
workflows.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { data, error } = await supabase
      .from('agent_app.workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return c.json({ error: 'Workflow not found' }, 404)

    return c.json({ workflow: data })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return c.json({ error: 'Failed to fetch workflow' }, 500)
  }
})

// POST /api/workflows
workflows.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  try {
    const { data, error } = await supabase
      .from('agent_app.workflows')
      .insert({
        ...body,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ workflow: data }, 201)
  } catch (error) {
    console.error('Error creating workflow:', error)
    return c.json({ error: 'Failed to create workflow' }, 500)
  }
})

export default workflows
