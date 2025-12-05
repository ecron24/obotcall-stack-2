'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Récupère un client par son ID
 */
export const getClient = cache(async (id: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur récupération client:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching client:', error)
    return null
  }
})

/**
 * Récupère tous les clients
 */
export const getClients = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération clients:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
})

/**
 * Recherche de clients par nom, email ou téléphone
 */
export const searchClients = cache(async (query: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Erreur recherche clients:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error searching clients:', error)
    return []
  }
})
