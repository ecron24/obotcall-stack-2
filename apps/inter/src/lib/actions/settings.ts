'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

export interface CompanySettings {
  id?: string
  // Informations de base
  name: string
  legal_name: string
  email: string
  phone: string
  website: string

  // Adresse
  address: string
  postal_code: string
  city: string
  country: string

  // Informations légales
  siret: string
  tva_number: string
  legal_form: 'SARL' | 'SAS' | 'SA' | 'EURL' | 'SASU' | 'SCI' | 'Auto-Entrepreneur' | 'Autre'
  share_capital?: number // Capital social (pour SARL, SAS, SA)
  rcs_number: string
  rcs_city: string

  // Paramètres de facturation
  invoice_prefix: string
  quote_prefix: string
  intervention_prefix: string
  payment_delay_days: number
  late_penalty_rate: number // Taux pénalités retard (%)
  recovery_fee: number // Indemnité forfaitaire de recouvrement (€)

  // Paramètres métier
  business_type_id?: string
  default_labor_rate: number
  default_tax_rate: number
  default_warranty: string

  // White Label
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  custom_domain?: string

  // Conditions et mentions
  invoice_footer_note: string // Note de bas de page facture
  legal_mentions: string // Mentions légales obligatoires
  terms_and_conditions?: string // CGV complètes (optionnel)

  // Meta
  created_at?: string
  updated_at?: string
}

export interface UserSettings {
  id: string
  email: string
  full_name: string
  role: string
  notifications_enabled: boolean
  language: string
  avatar_url?: string
}

// Récupérer les paramètres de l'entreprise
export const getCompanySettings = cache(async (): Promise<CompanySettings | null> => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('company_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching company settings:', error)
      return null
    }

    return data as CompanySettings
  } catch (error) {
    console.error('Error in getCompanySettings:', error)
    return null
  }
})

// Mettre à jour les paramètres de l'entreprise
export async function updateCompanySettings(settings: Partial<CompanySettings>) {
  try {
    const supabase = createServerClient()

    // Vérifier si des settings existent déjà
    const { data: existing } = await supabase
      .schema('inter_app')
      .from('company_settings')
      .select('id')
      .single()

    let result

    if (existing) {
      // Update
      result = await supabase
        .schema('inter_app')
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert
      result = await supabase
        .schema('inter_app')
        .from('company_settings')
        .insert({
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating company settings:', result.error)
      throw new Error('Erreur lors de la mise à jour des paramètres')
    }

    return result.data as CompanySettings
  } catch (error) {
    console.error('Error in updateCompanySettings:', error)
    throw error
  }
}

// Récupérer les paramètres utilisateur
export const getUserSettings = cache(async (): Promise<UserSettings | null> => {
  try {
    const supabase = createServerClient()

    // Récupérer l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Error fetching user:', authError)
      return null
    }

    // Récupérer les infos utilisateur
    const { data, error } = await supabase
      .schema('inter_app')
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user settings:', error)
      return null
    }

    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name || data.email,
      role: data.role || 'user',
      notifications_enabled: data.notifications_enabled ?? true,
      language: data.language || 'fr',
      avatar_url: data.avatar_url
    }
  } catch (error) {
    console.error('Error in getUserSettings:', error)
    return null
  }
})

// Mettre à jour les paramètres utilisateur
export async function updateUserSettings(settings: Partial<UserSettings>) {
  try {
    const supabase = createServerClient()

    // Récupérer l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié')
    }

    const { data, error } = await supabase
      .schema('inter_app')
      .from('users')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user settings:', error)
      throw new Error('Erreur lors de la mise à jour des paramètres utilisateur')
    }

    return data as UserSettings
  } catch (error) {
    console.error('Error in updateUserSettings:', error)
    throw error
  }
}
