'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

type DashboardStats = {
  interventions: {
    today: number
    week: number
    month: number
    in_progress: number
    scheduled: number
    completed_this_month: number
  }
  clients: {
    total: number
    active: number
    new_this_month: number
  }
  technicians: {
    total: number
    active: number
    avg_rating: number
  }
}

/**
 * Récupère les statistiques du dashboard
 * Adapté pour le système multi-métiers
 */
export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  try {
    const supabase = createServerClient()

    // Dates de référence
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1) // Lundi
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Récupérer toutes les interventions
    const { data: interventions } = await supabase
      .schema('inter_app')
      .from('interventions')
      .select('*')

    // Récupérer tous les clients
    const { data: clients } = await supabase
      .schema('inter_app')
      .from('clients')
      .select('*')

    // Récupérer tous les techniciens
    const { data: technicians } = await supabase
      .schema('inter_app')
      .from('users')
      .select('*')
      .eq('role', 'technician')

    // Calculer les stats d'interventions
    const interventionsArray = interventions || []

    const todayInterventions = interventionsArray.filter(i => {
      const intDate = new Date(i.scheduled_date)
      return intDate >= today && intDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    })

    const weekInterventions = interventionsArray.filter(i => {
      const intDate = new Date(i.scheduled_date)
      return intDate >= weekStart
    })

    const monthInterventions = interventionsArray.filter(i => {
      const intDate = new Date(i.scheduled_date)
      return intDate >= monthStart
    })

    const inProgressInterventions = interventionsArray.filter(i => i.status === 'in_progress')
    const scheduledInterventions = interventionsArray.filter(i => i.status === 'scheduled')
    const completedThisMonth = monthInterventions.filter(i => i.status === 'completed')

    // Calculer les stats clients
    const clientsArray = clients || []
    const totalClients = clientsArray.length
    const activeClients = clientsArray.filter(c => {
      // Un client est actif s'il a eu une intervention dans les 6 derniers mois
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      return interventionsArray.some(i => {
        const intDate = new Date(i.scheduled_date)
        return i.client_id === c.id && intDate >= sixMonthsAgo
      })
    }).length

    const newClientsThisMonth = clientsArray.filter(c => {
      const createdDate = new Date(c.created_at)
      return createdDate >= monthStart
    }).length

    // Calculer les stats techniciens
    const techniciansArray = technicians || []
    const totalTechnicians = techniciansArray.length
    const activeTechnicians = techniciansArray.filter(t => t.is_active !== false).length

    // Note moyenne (à implémenter quand vous aurez un système de notation)
    const avgRating = 4.5

    return {
      interventions: {
        today: todayInterventions.length,
        week: weekInterventions.length,
        month: monthInterventions.length,
        in_progress: inProgressInterventions.length,
        scheduled: scheduledInterventions.length,
        completed_this_month: completedThisMonth.length
      },
      clients: {
        total: totalClients,
        active: activeClients,
        new_this_month: newClientsThisMonth
      },
      technicians: {
        total: totalTechnicians,
        active: activeTechnicians,
        avg_rating: avgRating
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)

    // Retourner des stats par défaut en cas d'erreur
    return {
      interventions: {
        today: 0,
        week: 0,
        month: 0,
        in_progress: 0,
        scheduled: 0,
        completed_this_month: 0
      },
      clients: {
        total: 0,
        active: 0,
        new_this_month: 0
      },
      technicians: {
        total: 0,
        active: 0,
        avg_rating: 0
      }
    }
  }
})
