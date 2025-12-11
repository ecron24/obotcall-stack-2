import { Hono } from 'hono'
import { getAuth } from '../middleware/auth.js'
import { requireFeature, checkUsageLimit } from '../middleware/feature-flags.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { z } from 'zod'

const invoices = new Hono()

// All invoice routes require Starter+ plan
invoices.use('/*', requireFeature('factures'))

// ============================================
// VALIDATION SCHEMAS
// ============================================

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20)
})

const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  intervention_ids: z.array(z.string().uuid()).optional().default([]),
  invoice_type: z.enum(['proforma', 'final']).default('proforma'),
  invoice_date: z.string().optional(),
  due_date: z.string().optional(),
  payment_terms: z.enum(['immediate', 'net_30', 'net_60', 'net_90']).default('net_30'),
  notes: z.string().optional(),
  internal_notes: z.string().optional()
})

const updateInvoiceSchema = createInvoiceSchema.partial()

const validateProformaSchema = z.object({
  user_id: z.string().uuid()
})

const convertToFinalSchema = z.object({
  user_id: z.string().uuid()
})

const sendInvoiceSchema = z.object({
  user_id: z.string().uuid(),
  emails: z.array(z.string().email()).min(1)
})

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/invoices
 * List all invoices for tenant with filters
 */
invoices.get('/', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const queryParams = c.req.query()
    const { page, per_page } = paginationSchema.parse(queryParams)

    // Optional filters
    const invoice_type = queryParams.invoice_type as 'proforma' | 'final' | undefined
    const status = queryParams.status

    const from = (page - 1) * per_page
    const to = from + per_page - 1

    let query = supabaseAdmin
      .schema('inter_app')
      .from('invoices')
      .select(`
        *,
        client:clients(
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (invoice_type) {
      query = query.eq('invoice_type', invoice_type)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error('List invoices error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la récupération des factures'
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
    console.error('List invoices error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * GET /api/invoices/:id
 * Get single invoice with items
 */
invoices.get('/:id', async (c) => {
  try {
    const { tenant } = getAuth(c)
    const id = c.req.param('id')

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('invoices')
      .select(`
        *,
        client:clients(
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone,
          address_line1,
          address_line2,
          postal_code,
          city
        ),
        invoice_items:invoice_items(
          id,
          product_id,
          description,
          quantity,
          unit,
          unit_price_ht,
          tva_rate,
          subtotal_ht,
          tva_amount,
          total_ttc,
          display_order,
          product:products(
            id,
            name,
            sku,
            unit
          )
        ),
        proforma_validated_by_user:users!invoices_proforma_validated_by_fkey(
          id,
          full_name,
          email
        ),
        converted_to_final_by_user:users!invoices_converted_to_final_by_fkey(
          id,
          full_name,
          email
        ),
        sent_by_user:users!invoices_sent_by_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      console.error('Get invoice error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Facture non trouvée'
      }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Get invoice error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/invoices
 * Create new invoice (proforma or final)
 */
invoices.post('/', checkUsageLimit('invoices'), async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const body = await c.req.json()
    const validated = createInvoiceSchema.parse(body)

    // Get client info for billing
    const { data: client, error: clientError } = await supabaseAdmin
      .schema('inter_app')
      .from('clients')
      .select('*')
      .eq('id', validated.client_id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single()

    if (clientError || !client) {
      return c.json({
        error: 'Not Found',
        message: 'Client non trouvé'
      }, 404)
    }

    // Calculate due date if not provided
    const invoice_date = validated.invoice_date || new Date().toISOString().split('T')[0]
    let due_date = validated.due_date

    if (!due_date) {
      const days = {
        immediate: 0,
        net_30: 30,
        net_60: 60,
        net_90: 90
      }[validated.payment_terms]

      const date = new Date(invoice_date)
      date.setDate(date.getDate() + days)
      due_date = date.toISOString().split('T')[0]
    }

    // Prepare invoice data
    const invoiceData = {
      tenant_id: tenant.id,
      client_id: validated.client_id,
      intervention_ids: validated.intervention_ids,
      invoice_type: validated.invoice_type,
      invoice_date,
      due_date,
      payment_terms: validated.payment_terms,
      notes: validated.notes,
      internal_notes: validated.internal_notes,

      // Billing info from client
      billing_name: client.company_name || `${client.first_name} ${client.last_name}`,
      billing_address_line1: client.address_line1 || '',
      billing_address_line2: client.address_line2,
      billing_postal_code: client.postal_code || '',
      billing_city: client.city || '',
      billing_country_code: 'FR',

      // Initial values
      status: 'draft',
      subtotal_ht: 0,
      total_tax: 0,
      total_ttc: 0,

      created_by: user.id
    }

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      console.error('Create invoice error:', error)
      return c.json({
        error: 'Database Error',
        message: 'Erreur lors de la création de la facture'
      }, 500)
    }

    return c.json(data, 201)
  } catch (error: any) {
    console.error('Create invoice error:', error)
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
 * PATCH /api/invoices/:id
 * Update invoice
 */
invoices.patch('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = updateInvoiceSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .schema('inter_app')
      .from('invoices')
      .update({
        ...validated,
        updated_by: user.id
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error || !data) {
      console.error('Update invoice error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Facture non trouvée'
      }, 404)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Update invoice error:', error)
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
 * POST /api/invoices/:id/validate
 * Validate proforma invoice
 */
invoices.post('/:id/validate', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    // Call SQL function
    const { data, error } = await supabaseAdmin.rpc('validate_proforma_invoice', {
      p_invoice_id: id,
      p_user_id: user.id
    })

    if (error) {
      console.error('Validate proforma error:', error)
      return c.json({
        error: 'Validation Error',
        message: error.message || 'Erreur lors de la validation'
      }, 400)
    }

    return c.json(data)
  } catch (error) {
    console.error('Validate proforma error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/invoices/:id/convert-to-final
 * Convert proforma to final invoice
 */
invoices.post('/:id/convert-to-final', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    // Call SQL function
    const { data, error } = await supabaseAdmin.rpc('convert_proforma_to_final', {
      p_invoice_id: id,
      p_user_id: user.id
    })

    if (error) {
      console.error('Convert to final error:', error)
      return c.json({
        error: 'Conversion Error',
        message: error.message || 'Erreur lors de la conversion'
      }, 400)
    }

    return c.json(data)
  } catch (error) {
    console.error('Convert to final error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

/**
 * POST /api/invoices/:id/send
 * Mark invoice as sent
 */
invoices.post('/:id/send', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')
    const body = await c.req.json()
    const { emails } = sendInvoiceSchema.parse(body)

    // Call SQL function
    const { data, error } = await supabaseAdmin.rpc('mark_invoice_sent', {
      p_invoice_id: id,
      p_user_id: user.id,
      p_sent_to_emails: emails
    })

    if (error) {
      console.error('Send invoice error:', error)
      return c.json({
        error: 'Send Error',
        message: error.message || 'Erreur lors de l\'envoi'
      }, 400)
    }

    return c.json(data)
  } catch (error: any) {
    console.error('Send invoice error:', error)
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
 * DELETE /api/invoices/:id
 * Delete invoice (soft delete)
 */
invoices.delete('/:id', async (c) => {
  try {
    const { tenant, user } = getAuth(c)
    const id = c.req.param('id')

    const { error } = await supabaseAdmin
      .schema('inter_app')
      .from('invoices')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)

    if (error) {
      console.error('Delete invoice error:', error)
      return c.json({
        error: 'Not Found',
        message: 'Facture non trouvée'
      }, 404)
    }

    return c.json({ message: 'Facture supprimée avec succès' })
  } catch (error) {
    console.error('Delete invoice error:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Une erreur est survenue'
    }, 500)
  }
})

export default invoices
