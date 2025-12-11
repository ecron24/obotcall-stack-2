import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { checkUsageLimit } from '../middleware/feature-flags.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createClientSchema, updateClientSchema, paginationSchema } from '../lib/validation.js'

const clients = new Hono()

/**
 * GET /api/clients
 * List all clients for tenant
 */
clients.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const queryParams = c.req.query()
    const { page, per_page } = paginationSchema.parse(queryParams)

    const from = (page - 1) * per_page
    const to = from + per_page - 1

    const { data, error, count } = await supabaseAdmin
      .schema('inter_app')
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('List clients error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des clients'
      }, 500)
    }

    return c.json({
      data: data || [],
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page)
      }
    })
  } catch (error) {
    console.error('List clients error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/clients/:id
 * Get single client with related interventions
 */
clients.get('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('clients')
      .select(`
        *,
        interventions:interventions(
          id,
          title,
          status,
          scheduled_at
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Get client error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Client non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get client error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/clients
 * Create new client
 */
clients.post('/', checkUsageLimit('clients'), async (c) => {
  try {
    const { tenant } = getAuth(c)
    const body = await c.req.json()
    const validated = createClientSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('clients')
      .insert({
        ...validated,
        tenant_id: tenant.id
      })
      .select()
      .single()

    if (error) {
      console.error('Create client error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création du client'
      }, 500)
    }

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Create client error:', error)
    if (error.name === 'ZodError') {
      return c.json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: error.errors
      }, 400)
    }
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * PATCH /api/clients/:id
 * Update client
 */
clients.patch('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateClientSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('clients')
      .update(validated)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Update client error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Client non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Update client error:', error)
    if (error.name === 'ZodError') {
      return c.json({
        error: 'Validation Error',
        message: 'Données invalides',
        details: error.errors
      }, 400)
    }
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * DELETE /api/clients/:id
 * Delete client (only if no related interventions)
 */
clients.delete('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    // Check if client has interventions
    const { count } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)

    if (count && count > 0) {
      return c.json({
        error: 'Validation Error',
        message: `Impossible de supprimer ce client car il a ${count} intervention(s) associée(s)`
      }, 400)
    }

    const { error } = await supabaseAdmin
      .schema('inter_app')
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)

    if (error) {
      console.error('Delete client error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Client non trouvé'
      }, 404)
    }

    return c.json({ message: 'Client supprimé avec succès' })
  } catch (error) {
    console.error('Delete client error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default clients
