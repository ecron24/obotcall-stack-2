'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  type: 'individual' | 'company'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function NewInterventionPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients([])
    }
  }, [searchTerm, clients])

  const loadClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/clients`, {
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
        setClients(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClient = (clientId: string) => {
    // Rediriger vers le formulaire avec le client pré-sélectionné
    router.push(`/dashboard/interventions/new/form?client_id=${clientId}`)
  }

  const handleNewClient = () => {
    // Rediriger vers le formulaire avec mode création client
    router.push('/dashboard/interventions/new/form?new_client=true')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/interventions"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Retour
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle intervention</h1>
          <p className="mt-1 text-sm text-gray-500">
            Recherchez un client existant ou créez-en un nouveau
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🔍 Rechercher un client
        </label>
        <input
          type="text"
          placeholder="Nom, email, téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          autoFocus
        />
        <p className="mt-2 text-xs text-gray-500">
          Saisissez au moins 2 caractères pour rechercher
        </p>
      </div>

      {/* Résultats de recherche */}
      {searchTerm.length >= 2 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Résultats de recherche ({filteredClients.length})
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && filteredClients.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-600">Aucun client trouvé</p>
              <p className="text-sm text-gray-500 mt-1">
                Essayez une autre recherche ou créez un nouveau client
              </p>
            </div>
          )}

          {!loading && filteredClients.length > 0 && (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client.id)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          {client.email && (
                            <div className="flex items-center gap-1">
                              <span>📧</span>
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <span>📱</span>
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-1">
                              <span>📍</span>
                              <span>{client.address}, {client.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">
                      Sélectionner →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Séparateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 text-gray-500">OU</span>
        </div>
      </div>

      {/* Créer un nouveau client */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={handleNewClient}
          className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <div className="text-4xl">👤</div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 group-hover:text-blue-600">
              Créer un nouveau client
            </div>
            <div className="text-sm text-gray-600">
              Créer un client et son intervention en même temps
            </div>
          </div>
        </button>
      </div>

      {/* Clients récents (optionnel) */}
      {!searchTerm && clients.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Clients récents
          </h2>
          <div className="space-y-2">
            {clients.slice(0, 5).map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client.id)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                      {client.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-500">
                        {client.phone || client.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-blue-600 text-xs">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
