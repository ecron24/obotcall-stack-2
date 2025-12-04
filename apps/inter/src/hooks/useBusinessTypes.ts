import { useState, useEffect } from 'react'
import type { BusinessType } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useBusinessTypes() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessTypes()
  }, [])

  const fetchBusinessTypes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/business-types`)

      if (!response.ok) {
        throw new Error('Failed to fetch business types')
      }

      const data = await response.json()
      setBusinessTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching business types:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    businessTypes,
    loading,
    error,
    refetch: fetchBusinessTypes
  }
}

export function useBusinessType(id: string) {
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    fetchBusinessType()
  }, [id])

  const fetchBusinessType = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/business-types/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch business type')
      }

      const data = await response.json()
      setBusinessType(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching business type:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    businessType,
    loading,
    error,
    refetch: fetchBusinessType
  }
}
