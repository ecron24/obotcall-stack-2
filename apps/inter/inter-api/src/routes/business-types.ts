import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'

const businessTypes = new Hono()

/**
 * GET /api/business-types
 * List all active business types
 * Public endpoint (no auth required) - used during registration
 */
businessTypes.get('/', async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_types')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('List business types error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des types de métiers'
      }, 500)
    }

    return c.json(data || [])
  } catch (error) {
    console.error('List business types error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/business-types/:id
 * Get single business type
 */
businessTypes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const { data, error } = await supabaseAdmin
      .from('business_types')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Type de métier non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get business type error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/business-types/:code/by-code
 * Get business type by code
 */
businessTypes.get('/:code/by-code', async (c) => {
  try {
    const code = c.req.param('code')

    const { data, error } = await supabaseAdmin
      .from('business_types')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return c.json({
        error: 'Not Found',
        message: 'Type de métier non trouvé'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get business type by code error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default businessTypes
