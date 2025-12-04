'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InterventionTypeSelector, InterventionItems } from '@/components/business'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Intervention {
  id: string
  intervention_number: string
  scheduled_date: string
  status: string
  client_name?: string
  client_phone?: string
  client_address?: string
  description?: string
  intervention_type_id?: string
  technician_id?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function InterventionDetailPage(props: PageProps) {
  const params = use(props.params)
  const router = useRouter()
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIntervention()
  }, [params.id])

  const fetchIntervention = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/interventions/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error('Intervention non trouvée')
      }

      const data = await response.json()
      setIntervention(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!intervention) return

    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/interventions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(intervention)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      alert('✅ Intervention mise à jour avec succès')
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Erreur'))
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      scheduled: { label: 'Planifiée', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', className: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !intervention) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error || 'Intervention non trouvée'}</p>
        </div>
        <Link
          href="/dashboard/interventions"
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  const isReadonly = intervention.status === 'completed' || intervention.status === 'cancelled'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/interventions"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Retour à la liste
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Intervention #{intervention.intervention_number}
            </h1>
            {getStatusBadge(intervention.status)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Créée le {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR')}
          </p>
        </div>
        {!isReadonly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? '💾 Sauvegarde...' : '💾 Enregistrer'}
          </button>
        )}
      </div>

      {/* Type d'intervention */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Type d'intervention</h2>
        <InterventionTypeSelector
          value={intervention.intervention_type_id}
          onChange={(type) => {
            setIntervention(prev => prev ? ({
              ...prev,
              intervention_type_id: type.id
            }) : null)
          }}
          disabled={isReadonly}
        />
      </section>

      {/* Informations client */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du client
            </label>
            <input
              type="text"
              value={intervention.client_name || ''}
              onChange={(e) => setIntervention(prev => prev ? ({ ...prev, client_name: e.target.value }) : null)}
              disabled={isReadonly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="Nom et prénom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={intervention.client_phone || ''}
              onChange={(e) => setIntervention(prev => prev ? ({ ...prev, client_phone: e.target.value }) : null)}
              disabled={isReadonly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={intervention.client_address || ''}
              onChange={(e) => setIntervention(prev => prev ? ({ ...prev, client_address: e.target.value }) : null)}
              disabled={isReadonly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              placeholder="Adresse complète"
            />
          </div>
        </div>
      </section>

      {/* Planning */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Planning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure
            </label>
            <input
              type="datetime-local"
              value={intervention.scheduled_date?.slice(0, 16) || ''}
              onChange={(e) => setIntervention(prev => prev ? ({ ...prev, scheduled_date: e.target.value }) : null)}
              disabled={isReadonly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={intervention.status}
              onChange={(e) => setIntervention(prev => prev ? ({ ...prev, status: e.target.value }) : null)}
              disabled={isReadonly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            >
              <option value="pending">En attente</option>
              <option value="scheduled">Planifiée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>
      </section>

      {/* Détails et items */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <InterventionItems
          interventionId={params.id}
          readonly={isReadonly}
        />
      </section>

      {/* Description/Notes */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Notes</h2>
        <textarea
          value={intervention.description || ''}
          onChange={(e) => setIntervention(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
          disabled={isReadonly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          rows={4}
          placeholder="Notes internes ou observations..."
        />
      </section>
    </div>
  )
}
