'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCalendarInterventions } from '@/lib/actions/interventions'

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
  source?: 'local' | 'google' // Source de l'intervention
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function CalendrierPage() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<CalendarIntervention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form pour créer RDV
  const [rdvForm, setRdvForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heure_debut: '09:00',
    heure_fin: '10:00',
    client_name: '',
    telephone: '',
    email: '',
    adresse: '',
    intervention_types: [] as string[],
    technician: '',
    notes: ''
  })

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

      const data = await getCalendarInterventions(
        startDate.toISOString(),
        endDate.toISOString()
      )
      setInterventions(data as any || [])
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

  // Générer tous les jours du mois pour la grille
  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Premier jour du mois
    const firstDay = new Date(year, month, 1)
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0)

    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    const firstDayOfWeek = firstDay.getDay()
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Convertir pour que lundi = 0

    // Jours à afficher
    const days = []

    // Jours du mois précédent pour compléter la première semaine
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({ date: day, isCurrentMonth: false })
    }

    // Jours du mois actuel
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i)
      days.push({ date: day, isCurrentMonth: true })
    }

    // Jours du mois suivant pour compléter la dernière semaine
    const remainingDays = 42 - days.length // 6 semaines x 7 jours = 42
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i)
      days.push({ date: day, isCurrentMonth: false })
    }

    return days
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
      return interventionDate === dateStr
    })
  }

  const getMonthInterventions = () => {
    const startDate = getViewStartDate()
    const endDate = getViewEndDate()
    return interventions.filter(intervention => {
      const intDate = new Date(intervention.scheduled_date)
      return intDate >= startDate && intDate <= endDate
    })
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    })
  }

  const formatWeekRange = () => {
    const start = getViewStartDate()
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return `${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short' })}. - ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short' })}. ${end.getFullYear()}`
  }

  const navigatePrevious = () => {
    const date = new Date(currentDate)
    if (viewMode === 'week') {
      date.setDate(date.getDate() - 7)
    } else if (viewMode === 'month') {
      date.setMonth(date.getMonth() - 1)
    }
    setCurrentDate(date)
  }

  const navigateNext = () => {
    const date = new Date(currentDate)
    if (viewMode === 'week') {
      date.setDate(date.getDate() + 7)
    } else if (viewMode === 'month') {
      date.setMonth(date.getMonth() + 1)
    }
    setCurrentDate(date)
  }

  const handleCreateRDV = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // TODO: Créer l'événement Google Calendar
      // TODO: Créer l'intervention dans la base de données

      alert('RDV créé avec succès!')
      setShowCreateModal(false)
      fetchInterventions()
    } catch (err) {
      console.error('Error creating RDV:', err)
      alert('Erreur lors de la création du RDV')
    }
  }

  // Statistiques des interventions du mois
  const monthInterventions = getMonthInterventions()
  const localInterventions = monthInterventions.filter(i => i.source !== 'google')
  const googleInterventions = monthInterventions.filter(i => i.source === 'google')

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
        <div className="flex items-center gap-3">
          <div className="text-4xl">📅</div>
          <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            📅 Créer RDV
          </button>
          <Link
            href="/dashboard/interventions/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            🔧 Intervention
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h2 className="text-lg font-semibold">Interventions du mois</h2>
          <Link href="#" className="ml-2 text-sm text-blue-600 hover:underline">
            Vue calendrier complète
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900">{monthInterventions.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Créées ici</div>
            <div className="text-3xl font-bold text-green-600">{localInterventions.length}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Depuis Google</div>
            <div className="text-3xl font-bold text-purple-600">{googleInterventions.length}</div>
          </div>
        </div>
      </div>

      {/* Contrôles du calendrier */}
      <div className="bg-blue-900 rounded-lg shadow-sm p-4 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            ←
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold capitalize">
              {viewMode === 'month' ? formatMonthYear(currentDate) : formatWeekRange()}
            </h2>
          </div>

          <button
            onClick={navigateNext}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-white text-blue-900'
                : 'bg-blue-800 text-white hover:bg-blue-700'
            }`}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Vue Mois - Grille de calendrier */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7">
            {getMonthDays().map(({ date, isCurrentMonth }, idx) => {
              const isToday = date.toDateString() === new Date().toDateString()
              const dayInterventions = getInterventionsForDate(date)
              const hasBlueCircle = isToday || (idx === 39 && date.getDate() === 5) // Exemple: 5 décembre

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 border-r border-b ${
                    !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        !isCurrentMonth
                          ? 'text-gray-400'
                          : isToday
                          ? 'text-blue-600 font-bold'
                          : 'text-gray-900'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {hasBlueCircle && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayInterventions.slice(0, 2).map((intervention) => (
                      <div
                        key={intervention.id}
                        className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded truncate cursor-pointer hover:bg-blue-200"
                        onClick={() => router.push(`/dashboard/interventions/${intervention.id}`)}
                      >
                        {formatTime(intervention.scheduled_time_start)} {intervention.client_name}
                      </div>
                    ))}
                    {dayInterventions.length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayInterventions.length - 2} autre{dayInterventions.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vue Semaine - Liste des jours */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y">
            {getWeekDays().map((day, idx) => {
              const dayInterventions = getInterventionsForDate(day)
              const dayName = day.toLocaleDateString('fr-FR', { weekday: 'long' })
              const dayDate = `${day.getDate()} ${day.toLocaleDateString('fr-FR', { month: 'long' })}`

              return (
                <div key={idx} className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{dayName}</h3>
                    <p className="text-sm text-gray-500">{dayDate}</p>
                  </div>

                  {dayInterventions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Aucune intervention
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayInterventions.map((intervention) => (
                        <div
                          key={intervention.id}
                          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => router.push(`/dashboard/interventions/${intervention.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{intervention.client_name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {formatTime(intervention.scheduled_time_start)}
                                {intervention.scheduled_time_end && ` - ${formatTime(intervention.scheduled_time_end)}`}
                              </div>
                              {intervention.intervention_type && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {intervention.intervention_type}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Créer RDV */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    🔧 Créer une Intervention
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Piscine Delmas - Google Calendar</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form className="space-y-6">
                {/* Quand ? */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    📅 Quand ?
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de l'intervention
                      </label>
                      <input
                        type="date"
                        value={rdvForm.date}
                        onChange={(e) => setRdvForm({ ...rdvForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heure début
                        </label>
                        <input
                          type="time"
                          value={rdvForm.heure_debut}
                          onChange={(e) => setRdvForm({ ...rdvForm, heure_debut: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heure fin
                        </label>
                        <input
                          type="time"
                          value={rdvForm.heure_fin}
                          onChange={(e) => setRdvForm({ ...rdvForm, heure_fin: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    👤 Client
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du client <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="M. Dupont"
                        value={rdvForm.client_name}
                        onChange={(e) => setRdvForm({ ...rdvForm, client_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          placeholder="0612345678"
                          value={rdvForm.telephone}
                          onChange={(e) => setRdvForm({ ...rdvForm, telephone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="client@email.com"
                          value={rdvForm.email}
                          onChange={(e) => setRdvForm({ ...rdvForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse d'intervention
                      </label>
                      <input
                        type="text"
                        placeholder="10 Rue de la Piscine, 13001 Marseille"
                        value={rdvForm.adresse}
                        onChange={(e) => setRdvForm({ ...rdvForm, adresse: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Type d'intervention */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    🛠️ Type(s) d'intervention <span className="text-red-500">*</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    {['#entretien', '#reparation', '#installation', '#hivernage', '#remettage', '#diagnostic'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Technicien */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    👷 Technicien
                  </h3>

                  <select
                    value={rdvForm.technician}
                    onChange={(e) => setRdvForm({ ...rdvForm, technician: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un technicien</option>
                    <option value="stephane">Stéphane</option>
                    <option value="jean">Jean</option>
                    <option value="marie">Marie</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes / Instructions
                  </label>
                  <textarea
                    placeholder="Informations complémentaires..."
                    value={rdvForm.notes}
                    onChange={(e) => setRdvForm({ ...rdvForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Bouton créer */}
                <button
                  type="button"
                  onClick={handleCreateRDV}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                >
                  📅 Créer l'événement Google Calendar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
