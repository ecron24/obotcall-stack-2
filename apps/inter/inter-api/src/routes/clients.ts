import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { checkUsageLimit } from '../middleware/feature-flags.js'
import { query, queryOne } from '../lib/postgres.js'
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

    const offset = (page - 1) * per_page

    // Get total count
    const [{ count }] = await query<{ count: string }>(
      'SELECT COUNT(*) FROM inter_app.clients WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenant.id]
    )

    // Get paginated data
    const data = await query(
      `SELECT * FROM inter_app.clients
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
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

    const data = await queryOne(
      `SELECT c.*,
        json_agg(
          json_build_object(
            'id', i.id,
            'title', i.title,
            'status', i.status,
            'scheduled_at', i.scheduled_at
          )
        ) FILTER (WHERE i.id IS NOT NULL) as interventions
       FROM inter_app.clients c
       LEFT JOIN inter_app.interventions i ON i.client_id = c.id AND i.deleted_at IS NULL
       WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL
       GROUP BY c.id`,
      [id, tenant.id]
    )

    if (!data) {
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

    const fields = Object.keys(validated)
    const values = Object.values(validated)
    const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')

    const data = await queryOne(
      `INSERT INTO inter_app.clients (tenant_id, ${fields.join(', ')})
       VALUES ($1, ${placeholders})
       RETURNING *`,
      [tenant.id, ...values]
    )

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

    const fields = Object.keys(validated)
    const values = Object.values(validated)
    const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(', ')

    const data = await queryOne(
      `UPDATE inter_app.clients
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [id, tenant.id, ...values]
    )

    if (!data) {
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
    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM inter_app.interventions
       WHERE client_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenant.id]
    )

    const interventionCount = parseInt(count)
    if (interventionCount > 0) {
      return c.json({
        error: 'Validation Error',
        message: `Impossible de supprimer ce client car il a ${interventionCount} intervention(s) associée(s)`
      }, 400)
    }

    const data = await queryOne(
      `DELETE FROM inter_app.clients
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, tenant.id]
    )

    if (!data) {
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
