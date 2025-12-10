import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { query, queryOne } from '../lib/postgres.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { z } from 'zod'

const interventionItems = new Hono()

// Validation schemas
const createInterventionItemSchema = z.object({
  intervention_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().default('unité'),
  unit_price_ht: z.number().min(0),
  tax_rate: z.number().min(0).max(100).default(20.00),
  display_order: z.number().int().default(0),
})

const updateInterventionItemSchema = createInterventionItemSchema.partial().omit({ intervention_id: true })

/**
 * GET /api/intervention-items
 * List all intervention items for a specific intervention
 */
interventionItems.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const interventionId = c.req.query('intervention_id')

    if (!interventionId) {
      return c.json({
        error: 'Validation Error',
        message: 'intervention_id est requis'
      }, 400)
    }

    // Verify intervention belongs to tenant (using pg)
    const intervention = await queryOne(
      'SELECT id FROM inter_app.interventions WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [interventionId, tenant.id]
    )

    if (!intervention) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    // Get intervention items with products (join with public.products)
    const data = await query(
      `SELECT
        ii.*,
        CASE
          WHEN p.id IS NOT NULL THEN json_build_object(
            'id', p.id,
            'name', p.name,
            'sku', p.sku,
            'unit', p.unit,
            'unit_price_ht', p.unit_price_ht,
            'tax_rate', p.tax_rate
          )
          ELSE NULL
        END as product
       FROM inter_app.intervention_items ii
       LEFT JOIN public.products p ON p.id = ii.product_id
       WHERE ii.intervention_id = $1 AND ii.deleted_at IS NULL
       ORDER BY ii.display_order`,
      [interventionId]
    )

    return c.json(data || [])
  } catch (error) {
    console.error('List intervention items error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/intervention-items/:id
 * Get single intervention item
 */
interventionItems.get('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    // Get item with intervention check and product
    const data = await queryOne(
      `SELECT
        ii.*,
        i.tenant_id,
        CASE
          WHEN p.id IS NOT NULL THEN json_build_object(
            'id', p.id,
            'name', p.name,
            'sku', p.sku,
            'unit', p.unit,
            'unit_price_ht', p.unit_price_ht,
            'tax_rate', p.tax_rate
          )
          ELSE NULL
        END as product
       FROM inter_app.intervention_items ii
       INNER JOIN inter_app.interventions i ON i.id = ii.intervention_id AND i.deleted_at IS NULL
       LEFT JOIN public.products p ON p.id = ii.product_id
       WHERE ii.id = $1 AND ii.deleted_at IS NULL`,
      [id]
    )

    if (!data) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    // Check tenant ownership
    if (data.tenant_id !== tenant.id) {
      return c.json({
        error: 'Forbidden',
        message: 'Accès non autorisé'
      }, 403)
    }

    // Remove tenant_id from response
    const { tenant_id, ...responseData } = data
    return c.json(responseData)
  } catch (error) {
    console.error('Get intervention item error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/intervention-items
 * Create new intervention item
 */
interventionItems.post('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const body = await c.req.json()
    const validated = createInterventionItemSchema.parse(body)

    // Verify intervention belongs to tenant
    const intervention = await queryOne<{ id: string; status: string }>(
      'SELECT id, status FROM inter_app.interventions WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [validated.intervention_id, tenant.id]
    )

    if (!intervention) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    // Check if intervention is editable
    if (intervention.status === 'cancelled') {
      return c.json({
        error: 'Validation Error',
        message: 'Impossible d\'ajouter des items à une intervention annulée'
      }, 400)
    }

    // If product_id is provided, verify it exists and get details (using Supabase for public.products)
    if (validated.product_id) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('name, unit, unit_price_ht, tax_rate')
        .eq('id', validated.product_id)
        .single()

      if (product) {
        // Auto-fill from product if not provided
        if (!validated.description) {
          validated.description = product.name
        }
        if (!validated.unit_price_ht) {
          validated.unit_price_ht = Number(product.unit_price_ht)
        }
        if (!validated.tax_rate) {
          validated.tax_rate = Number(product.tax_rate)
        }
        if (!validated.unit) {
          validated.unit = product.unit
        }
      }
    }

    // Create item
    const fields = Object.keys(validated)
    const values = Object.values(validated)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

    const data = await queryOne(
      `INSERT INTO inter_app.intervention_items (${fields.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      values
    )

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Create intervention item error:', error)

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
 * PATCH /api/intervention-items/:id
 * Update intervention item
 */
interventionItems.patch('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateInterventionItemSchema.parse(body)

    // Get item and verify ownership
    const existingItem = await queryOne<{ intervention_id: string; tenant_id: string; status: string }>(
      `SELECT ii.intervention_id, i.tenant_id, i.status
       FROM inter_app.intervention_items ii
       INNER JOIN inter_app.interventions i ON i.id = ii.intervention_id AND i.deleted_at IS NULL
       WHERE ii.id = $1 AND ii.deleted_at IS NULL`,
      [id]
    )

    if (!existingItem || existingItem.tenant_id !== tenant.id) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    // Check if intervention is editable
    if (existingItem.status === 'cancelled') {
      return c.json({
        error: 'Validation Error',
        message: 'Impossible de modifier les items d\'une intervention annulée'
      }, 400)
    }

    // Update item
    const fields = Object.keys(validated)
    const values = Object.values(validated)
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')

    const data = await queryOne(
      `UPDATE inter_app.intervention_items
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id, ...values]
    )

    if (!data) {
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la mise à jour de l\'item'
      }, 500)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Update intervention item error:', error)

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
 * DELETE /api/intervention-items/:id
 * Delete intervention item
 */
interventionItems.delete('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    // Get item and verify ownership
    const existingItem = await queryOne<{ intervention_id: string; tenant_id: string; status: string }>(
      `SELECT ii.intervention_id, i.tenant_id, i.status
       FROM inter_app.intervention_items ii
       INNER JOIN inter_app.interventions i ON i.id = ii.intervention_id AND i.deleted_at IS NULL
       WHERE ii.id = $1 AND ii.deleted_at IS NULL`,
      [id]
    )

    if (!existingItem || existingItem.tenant_id !== tenant.id) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    // Check if intervention is editable
    if (existingItem.status === 'cancelled') {
      return c.json({
        error: 'Validation Error',
        message: 'Impossible de supprimer les items d\'une intervention annulée'
      }, 400)
    }

    // Delete item
    const deleted = await queryOne(
      'DELETE FROM inter_app.intervention_items WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    )

    if (!deleted) {
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la suppression de l\'item'
      }, 500)
    }

    return c.json({ message: 'Item supprimé avec succès' })
  } catch (error) {
    console.error('Delete intervention item error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/intervention-items/bulk
 * Create multiple intervention items at once
 */
interventionItems.post('/bulk', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const body = await c.req.json()

    if (!Array.isArray(body.items)) {
      return c.json({
        error: 'Validation Error',
        message: 'Le champ items doit être un tableau'
      }, 400)
    }

    const interventionId = body.intervention_id

    // Verify intervention belongs to tenant
    const intervention = await queryOne<{ id: string; status: string }>(
      'SELECT id, status FROM inter_app.interventions WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [interventionId, tenant.id]
    )

    if (!intervention) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    if (intervention.status === 'cancelled') {
      return c.json({
        error: 'Validation Error',
        message: 'Impossible d\'ajouter des items à une intervention annulée'
      }, 400)
    }

    // Validate and prepare all items
    const validatedItems = body.items.map((item: any, index: number) => {
      const validated = createInterventionItemSchema.parse({
        ...item,
        intervention_id: interventionId,
        display_order: item.display_order ?? index,
      })
      return validated
    })

    // Bulk insert using PostgreSQL - prepare values
    const allValues: any[] = []
    const valueGroups: string[] = []
    const fields = Object.keys(validatedItems[0])

    validatedItems.forEach((item, itemIndex) => {
      const itemValues = Object.values(item)
      const placeholders = itemValues.map((_, valIndex) => {
        const paramIndex = allValues.length + 1
        allValues.push(itemValues[valIndex])
        return `$${paramIndex}`
      }).join(', ')
      valueGroups.push(`(${placeholders})`)
    })

    const data = await query(
      `INSERT INTO inter_app.intervention_items (${fields.join(', ')})
       VALUES ${valueGroups.join(', ')}
       RETURNING *`,
      allValues
    )

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Bulk create intervention items error:', error)

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

export default interventionItems
