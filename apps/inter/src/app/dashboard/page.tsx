'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Récupérer les infos utilisateur
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      }

      // Données par défaut (affichées immédiatement)
      const defaultStats = {
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

      setStats(defaultStats)
      setLoading(false)

      // Charger les statistiques réelles en arrière-plan
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 401) {
          router.push('/auth/login')
          return
        }

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (apiErr) {
        console.error('API stats error:', apiErr)
        // Garder les stats par défaut
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bienvenue {user?.email || 'utilisateur'}
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Interventions aujourd'hui */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.interventions.today}</p>
              <p className="text-xs text-gray-500 mt-1">Interventions</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        {/* Cette semaine */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cette semaine</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.interventions.week}</p>
              <p className="text-xs text-gray-500 mt-1">Interventions</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        {/* En cours */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.interventions.in_progress}</p>
              <p className="text-xs text-gray-500 mt-1">Interventions</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </div>

        {/* Planifiées */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Planifiées</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.interventions.scheduled}</p>
              <p className="text-xs text-gray-500 mt-1">À venir</p>
            </div>
            <div className="text-4xl">🗓️</div>
          </div>
        </div>
      </div>

      {/* Clients et Techniciens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Clients */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">👥 Clients</h2>
            <Link
              href="/dashboard/clients"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clients.total}</p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Clients actifs</p>
                <p className="text-2xl font-bold text-green-700">{stats.clients.active}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Nouveaux ce mois</p>
                <p className="text-2xl font-bold text-blue-700">{stats.clients.new_this_month}</p>
              </div>
              <div className="text-3xl">🆕</div>
            </div>
          </div>
        </div>

        {/* Card Techniciens */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">👷 Techniciens</h2>
            <Link
              href="/dashboard/technicians"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total techniciens</p>
                <p className="text-2xl font-bold text-gray-900">{stats.technicians.total}</p>
              </div>
              <div className="text-3xl">👨‍🔧</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-700">{stats.technicians.active}</p>
              </div>
              <div className="text-3xl">✔️</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Note moyenne</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {stats.technicians.avg_rating.toFixed(1)} ⭐
                </p>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/interventions/new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-4xl mb-2">➕</div>
            <span className="text-sm font-medium text-gray-700">Nouvelle intervention</span>
          </Link>
          <Link
            href="/dashboard/clients"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-4xl mb-2">👤</div>
            <span className="text-sm font-medium text-gray-700">Ajouter client</span>
          </Link>
          <Link
            href="/dashboard/calendrier"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-4xl mb-2">📅</div>
            <span className="text-sm font-medium text-gray-700">Voir calendrier</span>
          </Link>
          <Link
            href="/dashboard/factures"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-4xl mb-2">📄</div>
            <span className="text-sm font-medium text-gray-700">Créer facture</span>
          </Link>
        </div>
      </div>

      {/* Performance ce mois */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">📊 Performance ce mois</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.interventions.month}</p>
            <p className="text-sm text-indigo-100 mt-1">Interventions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.interventions.completed_this_month}</p>
            <p className="text-sm text-indigo-100 mt-1">Terminées</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.clients.new_this_month}</p>
            <p className="text-sm text-indigo-100 mt-1">Nouveaux clients</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {stats.interventions.completed_this_month > 0
                ? Math.round((stats.interventions.completed_this_month / stats.interventions.month) * 100)
                : 0}%
            </p>
            <p className="text-sm text-indigo-100 mt-1">Taux de complétion</p>
          </div>
        </div>
      </div>
    </div>
  )
}
