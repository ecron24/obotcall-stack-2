import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { checkUsageLimit } from '../middleware/feature-flags.js'
import { query, queryOne } from '../lib/postgres.js'
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

    const offset = (page - 1) * per_page

    // Get total count
    const [{ count }] = await query<{ count: string }>(
      'SELECT COUNT(*) FROM inter_app.interventions WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenant.id]
    )

    // Get interventions with client and assigned user data
    const data = await query(
      `SELECT
        i.*,
        json_build_object(
          'id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'company_name', c.company_name,
          'email', c.email,
          'phone', c.phone
        ) as clients,
        CASE
          WHEN u.id IS NOT NULL THEN json_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email
          )
          ELSE NULL
        END as assigned_to
       FROM inter_app.interventions i
       LEFT JOIN inter_app.clients c ON c.id = i.client_id AND c.deleted_at IS NULL
       LEFT JOIN public.users u ON u.id = i.assigned_to_user_id
       WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenant.id, per_page, offset]
    )

    return c.json({
      data: data || [],
      pagination: {
        page,
        per_page,
        total: parseInt(count),
        total_pages: Math.ceil(parseInt(count) / per_page)
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

    const data = await queryOne(
      `SELECT
        i.*,
        json_build_object(
          'id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'company_name', c.company_name,
          'email', c.email,
          'phone', c.phone,
          'address_line1', c.address_line1,
          'postal_code', c.postal_code,
          'city', c.city
        ) as clients,
        CASE
          WHEN u_assigned.id IS NOT NULL THEN json_build_object(
            'id', u_assigned.id,
            'full_name', u_assigned.full_name,
            'email', u_assigned.email
          )
          ELSE NULL
        END as assigned_to,
        CASE
          WHEN u_created.id IS NOT NULL THEN json_build_object(
            'id', u_created.id,
            'full_name', u_created.full_name,
            'email', u_created.email
          )
          ELSE NULL
        END as created_by
       FROM inter_app.interventions i
       LEFT JOIN inter_app.clients c ON c.id = i.client_id AND c.deleted_at IS NULL
       LEFT JOIN public.users u_assigned ON u_assigned.id = i.assigned_to_user_id
       LEFT JOIN public.users u_created ON u_created.id = i.created_by_user_id
       WHERE i.id = $1 AND i.tenant_id = $2 AND i.deleted_at IS NULL`,
      [id, tenant.id]
    )

    if (!data) {
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

    // Verify client belongs to tenant
    const client = await queryOne(
      'SELECT id FROM inter_app.clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [validated.client_id, tenant.id]
    )

    if (!client) {
      return c.json({
        error: 'Validation Error',
        message: 'Client non trouvé ou n\'appartient pas à votre organisation'
      }, 400)
    }

    // If assigned_to_user_id is provided, verify user belongs to tenant
    if (validated.assigned_to_user_id) {
      const { data: assignedUser, error: userError } = await supabaseAdmin
        .from('user_tenant_roles')
        .select('user_id')
        .eq('user_id', validated.assigned_to_user_id)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .single()

      if (userError || !assignedUser) {
        return c.json({
          error: 'Validation Error',
          message: 'Utilisateur assigné non trouvé ou n\'appartient pas à votre organisation'
        }, 400)
      }
    }

    // Create intervention
    const fields = Object.keys(validated)
    const values = Object.values(validated)
    const placeholders = values.map((_, i) => `$${i + 3}`).join(', ')

    const data = await queryOne(
      `INSERT INTO inter_app.interventions (tenant_id, created_by_user_id, ${fields.join(', ')})
       VALUES ($1, $2, ${placeholders})
       RETURNING *`,
      [tenant.id, user.id, ...values]
    )

    // Increment intervention count for tenant (using supabaseAdmin for public.tenants)
    await supabaseAdmin
      .from('tenants')
      .update({ current_interventions_count: tenant.current_interventions_count + 1 })
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
    const { tenant } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateInterventionSchema.parse(body)

    // Check intervention exists and belongs to tenant
    const existing = await queryOne(
      'SELECT id FROM inter_app.interventions WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenant.id]
    )

    if (!existing) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    // If client_id is being updated, verify it belongs to tenant
    if (validated.client_id) {
      const client = await queryOne(
        'SELECT id FROM inter_app.clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
        [validated.client_id, tenant.id]
      )

      if (!client) {
        return c.json({
          error: 'Validation Error',
          message: 'Client non trouvé'
        }, 400)
      }
    }

    // Update intervention
    const fields = Object.keys(validated)
    const values = Object.values(validated)
    const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(', ')

    const data = await queryOne(
      `UPDATE inter_app.interventions
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [id, tenant.id, ...values]
    )

    if (!data) {
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
 * Delete intervention
 */
interventions.delete('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    const data = await queryOne(
      'DELETE FROM inter_app.interventions WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, tenant.id]
    )

    if (!data) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    // Decrement intervention count (using supabaseAdmin for public.tenants)
    await supabaseAdmin
      .from('tenants')
      .update({ current_interventions_count: Math.max(0, tenant.current_interventions_count - 1) })
      .eq('id', tenant.id)

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
