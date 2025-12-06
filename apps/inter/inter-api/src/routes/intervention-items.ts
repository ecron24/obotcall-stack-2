import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
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

    // Verify intervention belongs to tenant
    const { data: intervention, error: interventionError } = await supabaseAdmin
      .from('interventions')
      .select('id')
      .eq('id', interventionId)
      .eq('tenant_id', tenant.id)
      .single()

    if (interventionError || !intervention) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    // Get intervention items
    const { data, error } = await supabaseAdmin
      .from('intervention_items')
      .select('*, product:products(*)')
      .eq('intervention_id', interventionId)
      .order('display_order')

    if (error) {
      console.error('List intervention items error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des items'
      }, 500)
    }

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

    // Get item with intervention check
    const { data, error } = await supabaseAdmin
      .from('intervention_items')
      .select('*, product:products(*), intervention:interventions!inner(tenant_id)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    // Check tenant ownership
    if (data.intervention.tenant_id !== tenant.id) {
      return c.json({
        error: 'Forbidden',
        message: 'Accès non autorisé'
      }, 403)
    }

    return c.json(data)
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
    const { data: intervention, error: interventionError } = await supabaseAdmin
      .from('interventions')
      .select('id, status')
      .eq('id', validated.intervention_id)
      .eq('tenant_id', tenant.id)
      .single()

    if (interventionError || !intervention) {
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

    // If product_id is provided, verify it exists and get details
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
    const { data, error } = await supabaseAdmin
      .from('intervention_items')
      .insert(validated)
      .select('*, product:products(*)')
      .single()

    if (error) {
      console.error('Create intervention item error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création de l\'item'
      }, 500)
    }

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
    const { data: existingItem } = await supabaseAdmin
      .from('intervention_items')
      .select('intervention_id, intervention:interventions!inner(tenant_id, status)')
      .eq('id', id)
      .single() as any

    if (!existingItem || existingItem.intervention.tenant_id !== tenant.id) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    // Check if intervention is editable
    if (existingItem.intervention.status === 'cancelled') {
      return c.json({
        error: 'Validation Error',
        message: 'Impossible de modifier les items d\'une intervention annulée'
      }, 400)
    }

    // Update item
    const { data, error } = await supabaseAdmin
      .from('intervention_items')
      .update(validated)
      .eq('id', id)
      .select('*, product:products(*)')
      .single()

    if (error || !data) {
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
    const { data: existingItem } = await supabaseAdmin
      .from('intervention_items')
      .select('intervention_id, intervention:interventions!inner(tenant_id, status)')
      .eq('id', id)
      .single() as any

    if (!existingItem || existingItem.intervention.tenant_id !== tenant.id) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    // Check if intervention is editable
    if (existingItem.intervention.status === 'cancelled') {
      return c.json({
        error: 'Validation Error',
        message: 'Impossible de supprimer les items d\'une intervention annulée'
      }, 400)
    }

    // Delete item
    const { error } = await supabaseAdmin
      .from('intervention_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete intervention item error:', error)
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
    const { data: intervention } = await supabaseAdmin
      .from('interventions')
      .select('id, status')
      .eq('id', interventionId)
      .eq('tenant_id', tenant.id)
      .single()

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

    // Bulk insert
    const { data, error } = await supabaseAdmin
      .from('intervention_items')
      .insert(validatedItems)
      .select('*, product:products(*)')

    if (error) {
      console.error('Bulk create intervention items error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création des items'
      }, 500)
    }

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
