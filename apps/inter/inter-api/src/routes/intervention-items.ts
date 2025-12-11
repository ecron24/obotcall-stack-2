import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { z } from 'zod'

const interventionItems = new Hono()

// Validation schemas
const createInterventionItemSchema = z.object({
  intervention_id: z.string().uuid(),
  product_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().default('unité'),
  unit_price_ht: z.number().min(0),
  tax_rate: z.number().min(0).max(100).default(20.00),
  display_order: z.number().int().default(0),
})

const updateInterventionItemSchema = createInterventionItemSchema.partial().omit({ intervention_id: true })

const bulkCreateSchema = z.object({
  items: z.array(createInterventionItemSchema)
})

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
    const { data: intervention } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .select('id')
      .eq('id', interventionId)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (!intervention) {
      return c.json({
        error: 'Not Found',
        message: 'Intervention non trouvée'
      }, 404)
    }

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .select(`
        *,
        product:products(
          id,
          name,
          sku,
          unit,
          unit_price_ht,
          tax_rate
        )
      `)
      .eq('intervention_id', interventionId)
      .is('deleted_at', null)
      .order('display_order')

    if (error) {
      console.error('List intervention items error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des items'
      }, 500)
    }

    return c.json({ data: data || [] })
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

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .select(`
        *,
        intervention:interventions!inner(tenant_id),
        product:products(*)
      `)
      .eq('id', id)
      .eq('intervention.tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Get intervention item error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
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
    const { data: intervention } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .select('id, status')
      .eq('id', validated.intervention_id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
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

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .insert(validated)
      .select()
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
 * POST /api/intervention-items/bulk
 * Create multiple items at once
 */
interventionItems.post('/bulk', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const body = await c.req.json()
    const { items } = bulkCreateSchema.parse(body)

    if (items.length === 0) {
      return c.json({
        error: 'Validation Error',
        message: 'Au moins un item est requis'
      }, 400)
    }

    const interventionId = items[0].intervention_id

    // Verify all items are for the same intervention
    const allSameIntervention = items.every((item: any) => item.intervention_id === interventionId)
    if (!allSameIntervention) {
      return c.json({
        error: 'Validation Error',
        message: 'Tous les items doivent appartenir à la même intervention'
      }, 400)
    }

    // Verify intervention belongs to tenant
    const { data: intervention } = await supabaseAdmin
      .schema('inter_app')
      .from('interventions')
      .select('id, status')
      .eq('id', interventionId)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
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

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .insert(items)
      .select()

    if (error) {
      console.error('Bulk create intervention items error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création des items'
      }, 500)
    }

    return c.json({ data: data || [] }, 201)
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

    // First verify ownership
    const { data: item } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .select(`
        id,
        intervention:interventions!inner(tenant_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!item || item.intervention.tenant_id !== tenant.id) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .update(validated)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Update intervention item error:', error)
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

    // First verify ownership
    const { data: item } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .select(`
        id,
        intervention:interventions!inner(tenant_id)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!item || item.intervention.tenant_id !== tenant.id) {
      return c.json({
        error: 'Not Found',
        message: 'Item non trouvé'
      }, 404)
    }

    const { error } = await supabaseAdmin
      .schema('inter_app')
      .from('intervention_items')
      .delete()
      .eq('id', id)
      .is('deleted_at', null)

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

export default interventionItems
