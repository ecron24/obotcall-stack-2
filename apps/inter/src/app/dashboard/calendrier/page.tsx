'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CalendarIntervention {
  id: string
  intervention_number: string
  client_name: string
  technician_name?: string
  intervention_type?: string
  scheduled_date: string
  scheduled_time_start?: string
  scheduled_time_end?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  address?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function CalendrierPage() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<CalendarIntervention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [technicianFilter, setTechnicianFilter] = useState<string>('all')

  useEffect(() => {
    fetchInterventions()
  }, [currentDate, viewMode])

  const fetchInterventions = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const startDate = getViewStartDate()
      const endDate = getViewEndDate()

      const response = await fetch(
        `${API_URL}/api/interventions?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du calendrier')
      }

      const data = await response.json()
      setInterventions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Error fetching calendar:', err)
      setInterventions([])
    } finally {
      setLoading(false)
    }
  }

  const getViewStartDate = () => {
    const date = new Date(currentDate)
    if (viewMode === 'week') {
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(date.setDate(diff))
    } else if (viewMode === 'month') {
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return date
  }

  const getViewEndDate = () => {
    const date = new Date(currentDate)
    if (viewMode === 'week') {
      const startDate = getViewStartDate()
      return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (viewMode === 'month') {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0)
    }
    return new Date(date.getTime() + 24 * 60 * 60 * 1000)
  }

  const getWeekDays = () => {
    const days = []
    const startDate = getViewStartDate()
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  const getInterventionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return interventions.filter(intervention => {
      const interventionDate = intervention.scheduled_date.split('T')[0]
      const matchesDate = interventionDate === dateStr
      const matchesTech = technicianFilter === 'all' || intervention.technician_name === technicianFilter
      return matchesDate && matchesTech
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-gray-100 text-gray-500 border-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getPriorityIcon = (priority: string) => {
    const icons: Record<string, string> = {
      low: '🟢',
      normal: '🔵',
      high: '🟠',
      urgent: '🔴',
    }
    return icons[priority] || '🔵'
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDayHeader = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const navigatePrevious = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') {
      date.setDate(date.getDate() - 1)
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() - 7)
    } else if (viewMode === 'month') {
      date.setMonth(date.getMonth() - 1)
    }
    setCurrentDate(date)
  }

  const navigateNext = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') {
      date.setDate(date.getDate() + 1)
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() + 7)
    } else if (viewMode === 'month') {
      date.setMonth(date.getMonth() + 1)
    }
    setCurrentDate(date)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  const todayInterventions = getInterventionsForDate(new Date())
  const weekInterventions = interventions.filter(i => {
    const intDate = new Date(i.scheduled_date)
    const weekStart = getViewStartDate()
    const weekEnd = getViewEndDate()
    return intDate >= weekStart && intDate < weekEnd
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
          <p className="mt-1 text-sm text-gray-500">
            Planning des interventions
          </p>
        </div>
        <Link
          href="/dashboard/interventions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          ➕ Planifier intervention
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Aujourd'hui</div>
          <div className="text-2xl font-bold text-blue-600">{todayInterventions.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Cette semaine</div>
          <div className="text-2xl font-bold text-gray-900">{weekInterventions.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">En cours</div>
          <div className="text-2xl font-bold text-yellow-600">
            {interventions.filter(i => i.status === 'in_progress').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Planifiées</div>
          <div className="text-2xl font-bold text-green-600">
            {interventions.filter(i => i.status === 'scheduled').length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Précédent
            </button>
            <button
              onClick={navigateToday}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Aujourd'hui
            </button>
            <button
              onClick={navigateNext}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Suivant →
            </button>
          </div>

          {/* Current period */}
          <div className="text-lg font-semibold text-gray-900">
            {formatDate(currentDate)}
          </div>

          {/* View mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mois
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ API calendrier en développement - Fonctionnalité disponible prochainement
          </p>
        </div>
      )}

      {/* Calendar view - Week */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {getWeekDays().map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString()
              const dayInterventions = getInterventionsForDate(day)

              return (
                <div key={idx} className="bg-white min-h-[200px]">
                  <div
                    className={`p-2 text-center border-b ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-xs text-gray-600 uppercase">
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {dayInterventions.map((intervention) => (
                      <Link
                        key={intervention.id}
                        href={`/dashboard/interventions/${intervention.id}`}
                        className={`block p-2 rounded border text-xs hover:shadow-md transition-shadow ${getStatusColor(
                          intervention.status
                        )}`}
                      >
                        <div className="font-medium flex items-center gap-1">
                          {getPriorityIcon(intervention.priority)}
                          {formatTime(intervention.scheduled_time_start)}
                        </div>
                        <div className="truncate">{intervention.client_name}</div>
                        {intervention.intervention_type && (
                          <div className="text-xs opacity-75 truncate">
                            {intervention.intervention_type}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendar view - Day */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{formatDayHeader(currentDate)}</h2>
          <div className="space-y-2">
            {getInterventionsForDate(currentDate).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune intervention planifiée ce jour
              </div>
            ) : (
              getInterventionsForDate(currentDate).map((intervention) => (
                <Link
                  key={intervention.id}
                  href={`/dashboard/interventions/${intervention.id}`}
                  className={`block p-4 rounded-lg border-2 hover:shadow-md transition-shadow ${getStatusColor(
                    intervention.status
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(intervention.priority)}
                        <span className="font-semibold">
                          {formatTime(intervention.scheduled_time_start)}
                          {intervention.scheduled_time_end && ` - ${formatTime(intervention.scheduled_time_end)}`}
                        </span>
                        <span className="text-xs bg-white px-2 py-1 rounded">
                          #{intervention.intervention_number}
                        </span>
                      </div>
                      <div className="font-medium text-base">{intervention.client_name}</div>
                      {intervention.intervention_type && (
                        <div className="text-sm opacity-75">{intervention.intervention_type}</div>
                      )}
                      {intervention.address && (
                        <div className="text-sm mt-1">📍 {intervention.address}</div>
                      )}
                      {intervention.technician_name && (
                        <div className="text-sm mt-1">👷 {intervention.technician_name}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Calendar view - Month (simplified list) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {interventions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune intervention planifiée ce mois
              </div>
            ) : (
              <div className="space-y-2">
                {interventions.map((intervention) => (
                  <Link
                    key={intervention.id}
                    href={`/dashboard/interventions/${intervention.id}`}
                    className={`block p-3 rounded-lg border hover:shadow-md transition-shadow ${getStatusColor(
                      intervention.status
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                        <div className="text-sm">
                          {getPriorityIcon(intervention.priority)} {intervention.client_name}
                        </div>
                        {intervention.scheduled_time_start && (
                          <div className="text-xs text-gray-600">
                            {formatTime(intervention.scheduled_time_start)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs">#{intervention.intervention_number}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
