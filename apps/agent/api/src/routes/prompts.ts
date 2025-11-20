import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const prompts = new Hono()

// GET /api/prompts
prompts.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('agent_app.prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ prompts: data })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return c.json({ error: 'Failed to fetch prompts' }, 500)
  }
})

export default prompts
