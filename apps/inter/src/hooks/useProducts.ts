import { useState, useEffect } from 'react'
import type { Product, ProductFilters, ProductCategory } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [filters?.type, filters?.category_id, filters?.search, filters?.is_active])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Construire les params de query
      const params = new URLSearchParams()
      if (filters?.type) params.set('type', filters.type)
      if (filters?.category_id) params.set('category_id', filters.category_id)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.is_active !== undefined) params.set('is_active', String(filters.is_active))

      const queryString = params.toString()
      const url = `${API_URL}/api/products${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  }
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/products/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/products/categories/list`, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}
