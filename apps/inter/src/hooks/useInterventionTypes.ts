import { useState, useEffect } from 'react'
import type { InterventionType, InterventionTypeFilters } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useInterventionTypes(filters?: InterventionTypeFilters) {
  const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInterventionTypes()
  }, [filters?.business_type_id, filters?.is_active])

  const fetchInterventionTypes = async () => {
    try {
      setLoading(true)
      setError(null)

      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('access_token')

      // L'API filtre automatiquement par business_type_id du tenant authentifié
      // On n'envoie donc pas de paramètres query
      const url = `${API_URL}/api/intervention-types`

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // Récupérer le message d'erreur de l'API
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`
        console.error('API Error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setInterventionTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching intervention types:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    interventionTypes,
    loading,
    error,
    refetch: fetchInterventionTypes
  }
}

export function useInterventionType(id: string) {
  const [interventionType, setInterventionType] = useState<InterventionType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    fetchInterventionType()
  }, [id])

  const fetchInterventionType = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/intervention-types/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch intervention type')
      }

      const data = await response.json()
      setInterventionType(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching intervention type:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    interventionType,
    loading,
    error,
    refetch: fetchInterventionType
  }
}
