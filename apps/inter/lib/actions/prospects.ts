'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Récupère un prospect par son ID
 */
export const getProspect = cache(async (id: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app_public')
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur récupération prospect:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching prospect:', error)
    return null
  }
})

/**
 * Récupère tous les prospects
 */
export const getProspects = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app_public')
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération prospects:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching prospects:', error)
    return []
  }
})
