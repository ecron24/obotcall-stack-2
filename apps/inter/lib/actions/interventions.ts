'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Récupère une intervention par son ID (avec cache React)
 * Adapté pour le système multi-métiers
 */
export const getIntervention = cache(async (id: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app_public')
      .from('interventions')
      .select(`
        *,
        client:clients(*),
        technician:users(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur récupération intervention:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching intervention:', error)
    return null
  }
})

/**
 * Récupère toutes les interventions avec leurs relations
 */
export const getInterventions = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app_public')
      .from('interventions')
      .select(`
        *,
        client:clients(id, name, email, phone, type),
        technician:users(id, email, full_name)
      `)
      .order('scheduled_date', { ascending: false })

    if (error) {
      console.error('Erreur récupération interventions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching interventions:', error)
    return []
  }
})

/**
 * Récupère les interventions pour le calendrier
 * Filtré par dates début/fin
 */
export const getCalendarInterventions = cache(async (startDate: string, endDate: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app_public')
      .from('interventions')
      .select(`
        *,
        client:clients(id, name),
        technician:users(id, full_name)
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Erreur récupération calendrier:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching calendar interventions:', error)
    return []
  }
})
