'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Récupère une facture par son ID
 */
export const getInvoice = cache(async (id: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        intervention:interventions(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur récupération facture:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return null
  }
})

/**
 * Récupère toutes les factures
 */
export const getInvoices = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email),
        intervention:interventions(id, scheduled_date)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération factures:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
})
