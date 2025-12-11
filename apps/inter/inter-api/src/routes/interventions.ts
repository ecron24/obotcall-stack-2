import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { checkUsageLimit } from '../middleware/feature-flags.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { createInterventionSchema, updateInterventionSchema, paginationSchema } from '../lib/validation.js'

const interventions = new Hono()

/**
 * GET /api/interventions
 * List all interventions for tenant
 */
interventions.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const queryParams = c.req.query()
    const { page, per_page } = paginationSchema.parse(queryParams)

    const from = (page - 1) * per_page
    const to = from + per_page - 1

    const { data, error, count } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .select(`
        *,
        clients:clients(
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        ),
        assigned_to:users!interventions_assigned_to_user_id_fkey(
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('List interventions error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des interventions'
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
    console.error('List interventions error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/interventions/:id
 * Get single intervention
 */
interventions.get('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .select(`
        *,
        clients:clients(
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone,
          address_line1,
          postal_code,
          city
        ),
        assigned_to:users!interventions_assigned_to_user_id_fkey(
          id,
          full_name,
          email
        ),
        created_by_user:users!interventions_created_by_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Get intervention error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get intervention error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/interventions
 * Create new intervention
 */
interventions.post('/', checkUsageLimit('interventions'), async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const body = await c.req.json()
    const validated = createInterventionSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .insert({
        ...validated,
        tenant_id: tenant.id,
        created_by: user.id
      })
      .select(`
        *,
        clients:clients(*)
      `)
      .single()

    if (error) {
      console.error('Create intervention error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création de l\'intervention'
      }, 500)
    }

    // Increment intervention count for tenant
    await supabaseAdmin
      .from('tenants')
      .update({
        current_interventions_count: (tenant.current_interventions_count || 0) + 1
      })
      .eq('id', tenant.id)

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Create intervention error:', error)
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
 * PATCH /api/interventions/:id
 * Update intervention
 */
interventions.patch('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateInterventionSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .update({
        ...validated,
        updated_by: user.id
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Update intervention error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Update intervention error:', error)
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
 * DELETE /api/interventions/:id
 * Delete intervention (soft delete)
 */
interventions.delete('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    const { error } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)

    if (error) {
      console.error('Delete intervention error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    return c.json({ message: 'Intervention supprimée avec succès' })
  } catch (error) {
    console.error('Delete intervention error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default interventions
