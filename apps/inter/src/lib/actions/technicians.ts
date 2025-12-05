'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Récupère un technicien par son ID
 */
export const getTechnician = cache(async (id: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'technician')
      .single()

    if (error) {
      console.error('Erreur récupération technicien:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching technician:', error)
    return null
  }
})

/**
 * Récupère tous les techniciens
 */
export const getTechnicians = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('users')
      .select('*')
      .eq('role', 'technician')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération techniciens:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return []
  }
})

/**
 * Récupère les techniciens actifs
 */
export const getActiveTechnicians = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('users')
      .select('*')
      .eq('role', 'technician')
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Erreur récupération techniciens actifs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching active technicians:', error)
    return []
  }
})
