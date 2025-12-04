import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { z } from 'zod'

const products = new Hono()

// Validation schemas
const createProductSchema = z.object({
  category_id: z.string().uuid().optional(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['product', 'service', 'labor']),
  unit: z.string().default('unité'),
  unit_price_ht: z.number().min(0),
  tax_rate: z.number().min(0).max(100).default(20.00),
  has_stock: z.boolean().default(false),
  stock_quantity: z.number().int().default(0),
  stock_alert_threshold: z.number().int().optional(),
  supplier_name: z.string().optional(),
  supplier_reference: z.string().optional(),
})

const updateProductSchema = createProductSchema.partial()

/**
 * GET /api/products
 * List all products for tenant's business type
 */
products.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const query = c.req.query()

    // Get filters
    const type = query.type // Filter by type: product, service, labor
    const category_id = query.category_id // Filter by category
    const search = query.search // Search in name or code

    // Get tenant's business_type_id
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenant.id)
      .single()

    if (tenantError || !tenantData || !tenantData.business_type_id) {
      return c.json({
        error: 'Configuration Error',
        message: 'Le type de métier n\'est pas configuré pour ce tenant'
      }, 400)
    }

    // Build query
    let queryBuilder = supabaseAdmin
      .from('products')
      .select('*, category:product_categories(*)')
      .eq('business_type_id', tenantData.business_type_id)
      .eq('is_active', true)
      .order('name')

    // Apply filters
    if (type) {
      queryBuilder = queryBuilder.eq('type', type)
    }
    if (category_id) {
      queryBuilder = queryBuilder.eq('category_id', category_id)
    }
    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('List products error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des produits'
      }, 500)
    }

    return c.json(data || [])
  } catch (error) {
    console.error('List products error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/products/:id
 * Get single product
 */
products.get('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    // Get tenant's business_type_id
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenant.id)
      .single()

    if (!tenantData || !tenantData.business_type_id) {
      return c.json({
        error: 'Configuration Error',
        message: 'Le type de métier n\'est pas configuré'
      }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:product_categories(*)')
      .eq('id', id)
      .eq('business_type_id', tenantData.business_type_id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Produit non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/products
 * Create new product (Admin/Owner only)
 */
products.post('/', async (c) => {
  try {
    const { tenant, user } = getAuth(c)

    // Check user role
    if (!['owner', 'admin'].includes(user.role)) {
      return c.json({
        error: 'Forbidden',
        message: 'Vous n\'avez pas les permissions pour créer un produit'
      }, 403)
    }

    const body = await c.req.json()
    const validated = createProductSchema.parse(body)

    // Get tenant's business_type_id
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenant.id)
      .single()

    if (!tenantData || !tenantData.business_type_id) {
      return c.json({
        error: 'Configuration Error',
        message: 'Le type de métier n\'est pas configuré'
      }, 400)
    }

    // Check if code already exists
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('business_type_id', tenantData.business_type_id)
      .eq('code', validated.code)
      .single()

    if (existing) {
      return c.json({
        error: 'Conflict',
        message: 'Un produit avec ce code existe déjà'
      }, 409)
    }

    // Create product
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...validated,
        business_type_id: tenantData.business_type_id,
      })
      .select('*, category:product_categories(*)')
      .single()

    if (error) {
      console.error('Create product error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création du produit'
      }, 500)
    }

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Create product error:', error)

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
 * PATCH /api/products/:id
 * Update product (Admin/Owner only)
 */
products.patch('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    // Check user role
    if (!['owner', 'admin'].includes(user.role)) {
      return c.json({
        error: 'Forbidden',
        message: 'Vous n\'avez pas les permissions pour modifier un produit'
      }, 403)
    }

    const body = await c.req.json()
    const validated = updateProductSchema.parse(body)

    // Get tenant's business_type_id
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenant.id)
      .single()

    if (!tenantData || !tenantData.business_type_id) {
      return c.json({
        error: 'Configuration Error',
        message: 'Le type de métier n\'est pas configuré'
      }, 400)
    }

    // Check if code already exists (if changing code)
    if (validated.code) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('business_type_id', tenantData.business_type_id)
        .eq('code', validated.code)
        .neq('id', id)
        .single()

      if (existing) {
        return c.json({
          error: 'Conflict',
          message: 'Un produit avec ce code existe déjà'
        }, 409)
      }
    }

    // Update product
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(validated)
      .eq('id', id)
      .eq('business_type_id', tenantData.business_type_id)
      .select('*, category:product_categories(*)')
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Produit non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Update product error:', error)

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
 * DELETE /api/products/:id
 * Delete product (soft delete - set is_active to false)
 * Admin/Owner only
 */
products.delete('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    // Check user role
    if (!['owner', 'admin'].includes(user.role)) {
      return c.json({
        error: 'Forbidden',
        message: 'Vous n\'avez pas les permissions pour supprimer un produit'
      }, 403)
    }

    // Get tenant's business_type_id
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenant.id)
      .single()

    if (!tenantData || !tenantData.business_type_id) {
      return c.json({
        error: 'Configuration Error',
        message: 'Le type de métier n\'est pas configuré'
      }, 400)
    }

    // Soft delete
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('business_type_id', tenantData.business_type_id)
      .select()
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Produit non trouvé'
      }, 404)
    }

    return c.json({ message: 'Produit supprimé avec succès' })
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/products/categories
 * List product categories
 */
products.get('/categories/list', async (c) => {
  try {
    const { tenant } = getAuth(c)

    // Get tenant's business_type_id
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('business_type_id')
      .eq('id', tenant.id)
      .single()

    if (!tenantData || !tenantData.business_type_id) {
      return c.json({
        error: 'Configuration Error',
        message: 'Le type de métier n\'est pas configuré'
      }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .select('*')
      .eq('business_type_id', tenantData.business_type_id)
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('List categories error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des catégories'
      }, 500)
    }

    return c.json(data || [])
  } catch (error) {
    console.error('List categories error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default products
