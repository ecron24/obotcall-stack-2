import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { requireFeature } from '../middleware/feature-flags.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { z } from 'zod'

const stockMovements = new Hono()

// Stock management requires Pro+ plan
stockMovements.use('/*', requireFeature('stock_management'))

// ============================================
// VALIDATION SCHEMAS
// ============================================

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20)
})

const movementTypeEnum = z.enum([
  'purchase',      // Achat
  'sale',          // Vente
  'return',        // Retour
  'adjustment',    // Ajustement inventaire
  'loss',          // Perte/casse
  'transfer',      // Transfert
  'intervention'   // Utilisé dans intervention
])

const createMovementSchema = z.object({
  product_id: z.string().uuid(),
  intervention_id: z.string().uuid().optional().nullable(),
  movement_type: movementTypeEnum,
  quantity: z.number().refine(val => val !== 0, { message: 'Quantity cannot be zero' }),
  unit_cost: z.number().nonnegative().optional().nullable(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  reference_number: z.string().optional().nullable()
})

const updateMovementSchema = createMovementSchema.partial().omit({
  product_id: true,
  intervention_id: true
})

const recordUsageSchema = z.object({
  intervention_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_cost: z.number().nonnegative()
})

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/stock-movements
 * List all stock movements for tenant with filters
 */
stockMovements.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const queryParams = c.req.query()
    const { page, per_page } = paginationSchema.parse(queryParams)

    // Optional filters
    const product_id = queryParams.product_id
    const intervention_id = queryParams.intervention_id
    const movement_type = queryParams.movement_type

    const from = (page - 1) * per_page
    const to = from + per_page - 1

    let query = supabaseAdmin
      .schema('inter_app')
      .from('stock_movements')
      .select(`
        *,
        product:products(
          id,
          name,
          sku,
          unit
        ),
        intervention:interventions(
          id,
          title,
          scheduled_at
        ),
        created_by_user:users!stock_movements_created_by_fkey(
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (product_id) {
      query = query.eq('product_id', product_id)
    }
    if (intervention_id) {
      query = query.eq('intervention_id', intervention_id)
    }
    if (movement_type) {
      query = query.eq('movement_type', movement_type)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error('List stock movements error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des mouvements de stock'
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
    console.error('List stock movements error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/stock-movements/product/:product_id/stock
 * Get current stock for a product
 */
stockMovements.get('/product/:product_id/stock', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const product_id = c.req.param('product_id')

    // Call SQL function
    const { data, error } = await supabaseAdmin.rpc('get_product_stock', {
      p_product_id: product_id,
      p_tenant_id: tenant.id
    })

    if (error) {
      console.error('Get product stock error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors du calcul du stock'
      }, 500)
    }

    return c.json({
      product_id,
      current_stock: data || 0
    })
  } catch (error) {
    console.error('Get product stock error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/stock-movements/:id
 * Get single stock movement
 */
stockMovements.get('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('stock_movements')
      .select(`
        *,
        product:products(*),
        intervention:interventions(*),
        created_by_user:users!stock_movements_created_by_fkey(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      console.error('Get stock movement error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Mouvement de stock non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get stock movement error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/stock-movements
 * Create new stock movement
 */
stockMovements.post('/', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const body = await c.req.json()
    const validated = createMovementSchema.parse(body)

    // Verify product exists and belongs to accessible scope
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, tenant_id')
      .eq('id', validated.product_id)
      .single()

    if (!product) {
      return c.json({
        error: 'Not Found',
        message: 'Produit non trouvé'
      }, 404)
    }

    // If intervention_id is provided, verify it belongs to tenant
    if (validated.intervention_id) {
      const { data: intervention } = await supabaseAdmin
        .schema('inter_app')
        .from('interventions')
        .select('id')
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
    }

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('stock_movements')
      .insert({
        ...validated,
        tenant_id: tenant.id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Create stock movement error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création du mouvement de stock'
      }, 500)
    }

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Create stock movement error:', error)
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
 * POST /api/stock-movements/record-usage
 * Record product usage in intervention (shortcut)
 */
stockMovements.post('/record-usage', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const body = await c.req.json()
    const validated = recordUsageSchema.parse(body)

    // Call SQL function
    const { data, error } = await supabaseAdmin.rpc('record_product_usage_in_intervention', {
      p_tenant_id: tenant.id,
      p_intervention_id: validated.intervention_id,
      p_product_id: validated.product_id,
      p_quantity: validated.quantity,
      p_unit_cost: validated.unit_cost,
      p_created_by: user.id
    })

    if (error) {
      console.error('Record product usage error:', error)
      return c.json({
        error: 'Database Error',
        message: error.message || 'Erreur lors de l\'enregistrement'
      }, 500)
    }

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Record product usage error:', error)
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
 * PATCH /api/stock-movements/:id
 * Update stock movement (limited fields)
 */
stockMovements.patch('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateMovementSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('stock_movements')
      .update(validated)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error || !data) {
      console.error('Update stock movement error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Mouvement de stock non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Update stock movement error:', error)
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
 * DELETE /api/stock-movements/:id
 * Delete stock movement (soft delete)
 */
stockMovements.delete('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    const { error } = await supabaseAdmin
      .schema('inter_app')
      .from('stock_movements')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)

    if (error) {
      console.error('Delete stock movement error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Mouvement de stock non trouvé'
      }, 404)
    }

    return c.json({ message: 'Mouvement de stock supprimé avec succès' })
  } catch (error) {
    console.error('Delete stock movement error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default stockMovements
