import { Hono } from 'hono'
import { supabase } from '../lib/supabase.js'

const properties = new Hono()

// GET /api/properties - Liste des propriétés
properties.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const { data, error } = await supabase
      .from('immo_app.properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ properties: data })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return c.json({ error: 'Failed to fetch properties' }, 500)
  }
})

// GET /api/properties/:id - Détail d'une propriété
properties.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { data, error } = await supabase
      .from('immo_app.properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return c.json({ error: 'Property not found' }, 404)

    return c.json({ property: data })
  } catch (error) {
    console.error('Error fetching property:', error)
    return c.json({ error: 'Failed to fetch property' }, 500)
  }
})

// POST /api/properties - Créer une propriété
properties.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  try {
    const { data, error } = await supabase
      .from('immo_app.properties')
      .insert({
        ...body,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error

    return c.json({ property: data }, 201)
  } catch (error) {
    console.error('Error creating property:', error)
    return c.json({ error: 'Failed to create property' }, 500)
  }
})

// PATCH /api/properties/:id - Modifier une propriété
properties.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    const { data, error } = await supabase
      .from('immo_app.properties')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json({ property: data })
  } catch (error) {
    console.error('Error updating property:', error)
    return c.json({ error: 'Failed to update property' }, 500)
  }
})

// DELETE /api/properties/:id - Supprimer une propriété
properties.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const { error } = await supabase
      .from('immo_app.properties')
      .delete()
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting property:', error)
    return c.json({ error: 'Failed to delete property' }, 500)
  }
})

export default properties
