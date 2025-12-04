import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

const interventionTypes = new Hono()

/**
 * GET /api/intervention-types
 * List all intervention types for tenant's business type
 */
interventionTypes.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)

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

    // Get intervention types for this business type
    const { data, error } = await supabaseAdmin
      .from('intervention_types')
      .select('*')
      .eq('business_type_id', tenantData.business_type_id)
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('List intervention types error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des types d\'interventions'
      }, 500)
    }

    return c.json(data || [])
  } catch (error) {
    console.error('List intervention types error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/intervention-types/:id
 * Get single intervention type
 */
interventionTypes.get('/:id', async (c) => {
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

    // Get intervention type
    const { data, error } = await supabaseAdmin
      .from('intervention_types')
      .select('*')
      .eq('id', id)
      .eq('business_type_id', tenantData.business_type_id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Type d\'intervention non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get intervention type error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/intervention-types/by-business/:businessTypeId
 * Get intervention types by business type ID (for public use)
 */
interventionTypes.get('/by-business/:businessTypeId', async (c) => {
  try {
    const businessTypeId = c.req.param('businessTypeId')

    const { data, error } = await supabaseAdmin
      .from('intervention_types')
      .select('*')
      .eq('business_type_id', businessTypeId)
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('List intervention types by business error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des types d\'interventions'
      }, 500)
    }

    return c.json(data || [])
  } catch (error) {
    console.error('List intervention types by business error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default interventionTypes
