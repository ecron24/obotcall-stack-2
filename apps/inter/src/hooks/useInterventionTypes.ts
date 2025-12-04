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

      // Construire les params de query
      const params = new URLSearchParams()
      if (filters?.business_type_id) {
        params.set('business_type_id', filters.business_type_id)
      }
      if (filters?.is_active !== undefined) {
        params.set('is_active', String(filters.is_active))
      }

      const queryString = params.toString()
      const url = `${API_URL}/api/intervention-types${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // Ajoutez ici le header d'auth si nécessaire
          // 'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch intervention types')
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

      const response = await fetch(`${API_URL}/api/intervention-types/${id}`, {
        headers: {
          'Content-Type': 'application/json',
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
