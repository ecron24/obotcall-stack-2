import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const agents = new Hono()

// GET /api/agents - Liste des agents
agents.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const { data, error } = await supabase
      .from('agent_app.agents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ agents: data })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return c.json({ error: 'Failed to fetch agents' }, 500)
  }
})

// GET /api/agents/:id - Détail d'un agent
agents.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { data, error } = await supabase
      .from('agent_app.agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return c.json({ error: 'Agent not found' }, 404)

    return c.json({ agent: data })
  } catch (error) {
    console.error('Error fetching agent:', error)
    return c.json({ error: 'Failed to fetch agent' }, 500)
  }
})

// POST /api/agents - Créer un agent
agents.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  try {
    const { data, error } = await supabase
      .from('agent_app.agents')
      .insert({
        ...body,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ agent: data }, 201)
  } catch (error) {
    console.error('Error creating agent:', error)
    return c.json({ error: 'Failed to create agent' }, 500)
  }
})

// PATCH /api/agents/:id - Modifier un agent
agents.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    const { data, error } = await supabase
      .from('agent_app.agents')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json({ agent: data })
  } catch (error) {
    console.error('Error updating agent:', error)
    return c.json({ error: 'Failed to update agent' }, 500)
  }
})

// DELETE /api/agents/:id - Supprimer un agent
agents.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { error } = await supabase
      .from('agent_app.agents')
      .delete()
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return c.json({ error: 'Failed to delete agent' }, 500)
  }
})

export default agents
