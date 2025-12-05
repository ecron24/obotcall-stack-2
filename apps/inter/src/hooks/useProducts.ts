import { useState, useEffect } from 'react'
import type { Product, ProductFilters, ProductCategory } from '@/types'
import { getProducts, getProduct as getProductAction, getProductCategories } from '@/lib/actions/products'

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

      // Appeler la Server Action
      const data = await getProducts(filters?.is_active)

      // Filtrer côté client pour les autres critères (à améliorer plus tard)
      let filteredData = data
      if (filters?.type) {
        filteredData = filteredData.filter(p => p.type === filters.type)
      }
      if (filters?.category_id) {
        filteredData = filteredData.filter(p => p.category_id === filters.category_id)
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(p =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        )
      }

      setProducts(filteredData as any)
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

      const data = await getProductAction(id)
      setProduct(data as any)
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

      const data = await getProductCategories()
      setCategories(data as any)
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
