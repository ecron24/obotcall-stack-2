'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InterventionTypeSelector } from '@/components/business'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function NewInterventionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    intervention_type_id: '',
    client_name: '',
    client_phone: '',
    client_address: '',
    scheduled_date: '',
    description: '',
    status: 'pending'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.client_name || !formData.scheduled_date) {
      alert('⚠️ Veuillez remplir au moins le nom du client et la date')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/interventions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la création')
      }

      const intervention = await response.json()
      alert('✅ Intervention créée avec succès !')
      router.push(`/dashboard/interventions/${intervention.id}`)
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/interventions"
          className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
        >
          ← Retour à la liste
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle intervention</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez une nouvelle intervention
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type d'intervention */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Type d'intervention</h2>
          <InterventionTypeSelector
            value={formData.intervention_type_id}
            onChange={(type) => {
              setFormData(prev => ({
                ...prev,
                intervention_type_id: type.id
              }))
            }}
          />
        </section>

        {/* Informations client */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom et prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={formData.client_address}
                onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Date et heure <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut initial
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">En attente</option>
                <option value="scheduled">Planifiée</option>
              </select>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Notes, observations..."
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 bg-white rounded-lg shadow-sm p-6">
          <Link
            href="/dashboard/interventions"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? '⏳ Création...' : '✅ Créer l\'intervention'}
          </button>
        </div>
      </form>
    </div>
  )
}
