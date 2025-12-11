'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'

interface Client {
  id: string
  first_name: string
  last_name: string
  company_name?: string
  email: string
}

export default function NewFacturePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: '30 jours',
    notes: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/clients?page=1&per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/factures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la création de la facture')
      }

      router.push('/dashboard/factures')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/factures"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Retour aux factures
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Nouvelle facture</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div className="md:col-span-2">
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                id="client_id"
                name="client_id"
                required
                value={formData.client_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || `${client.first_name} ${client.last_name}`} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Numéro de facture */}
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-2">
                N° de facture *
              </label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                required
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="FAC-2024-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date d'émission */}
            <div>
              <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-2">
                Date d'émission *
              </label>
              <input
                type="date"
                id="issue_date"
                name="issue_date"
                required
                value={formData.issue_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date d'échéance */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Date d'échéance *
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                required
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Conditions de paiement */}
            <div>
              <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-2">
                Conditions de paiement
              </label>
              <select
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="À réception">À réception</option>
                <option value="15 jours">15 jours</option>
                <option value="30 jours">30 jours</option>
                <option value="45 jours">45 jours</option>
                <option value="60 jours">60 jours</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notes additionnelles pour la facture..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/dashboard/factures"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            💡 <strong>Note :</strong> Vous pourrez ajouter les lignes de la facture après sa création.
          </p>
        </div>
      </div>
    </div>
  )
}
