import { useState, useEffect, useCallback } from 'react'
import type {
  InterventionItem,
  InterventionTotals,
  CreateInterventionItemInput,
  UpdateInterventionItemInput
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useInterventionItems(interventionId: string) {
  const [items, setItems] = useState<InterventionItem[]>([])
  const [totals, setTotals] = useState<InterventionTotals>({
    subtotal_ht: 0,
    total_tax: 0,
    total_ttc: 0,
    items_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (interventionId) {
      fetchItems()
    }
  }, [interventionId])

  // Recalculer les totaux quand les items changent
  useEffect(() => {
    calculateTotals()
  }, [items])

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${API_URL}/api/intervention-items?intervention_id=${interventionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch intervention items')
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching intervention items:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const subtotal_ht = items.reduce((sum, item) => sum + item.total_ht, 0)
    const total_tax = items.reduce((sum, item) => sum + item.total_tax, 0)
    const total_ttc = items.reduce((sum, item) => sum + item.total_ttc, 0)

    setTotals({
      subtotal_ht: Math.round(subtotal_ht * 100) / 100,
      total_tax: Math.round(total_tax * 100) / 100,
      total_ttc: Math.round(total_ttc * 100) / 100,
      items_count: items.length
    })
  }

  const addItem = useCallback(async (input: CreateInterventionItemInput) => {
    try {
      setError(null)

      const response = await fetch(`${API_URL}/api/intervention-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intervention_id: interventionId,
          ...input
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      const newItem = await response.json()
      setItems(prev => [...prev, newItem])
      return newItem
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [interventionId])

  const addItems = useCallback(async (inputs: CreateInterventionItemInput[]) => {
    try {
      setError(null)

      const response = await fetch(`${API_URL}/api/intervention-items/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intervention_id: interventionId,
          items: inputs
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add items')
      }

      const newItems = await response.json()
      setItems(prev => [...prev, ...newItems])
      return newItems
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [interventionId])

  const updateItem = useCallback(async (itemId: string, input: UpdateInterventionItemInput) => {
    try {
      setError(null)

      const response = await fetch(`${API_URL}/api/intervention-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      const updatedItem = await response.json()
      setItems(prev => prev.map(item =>
        item.id === itemId ? updatedItem : item
      ))
      return updatedItem
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      setError(null)

      const response = await fetch(`${API_URL}/api/intervention-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      setItems(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  return {
    items,
    totals,
    loading,
    error,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    refetch: fetchItems
  }
}
