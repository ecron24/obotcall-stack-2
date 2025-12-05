'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'

/**
 * Récupère un produit par son ID
 */
export const getProduct = cache(async (id: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur récupération produit:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
})

/**
 * Récupère tous les produits
 */
export const getProducts = cache(async (isActive?: boolean) => {
  try {
    const supabase = createServerClient()

    let query = supabase
      .schema('inter_app')
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    // Filtrer par statut actif si spécifié
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur récupération produits:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
})

/**
 * Récupère les catégories de produits
 */
export const getProductCategories = cache(async () => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('product_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Erreur récupération catégories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching product categories:', error)
    return []
  }
})

/**
 * Récupère les produits par catégorie
 */
export const getProductsByCategory = cache(async (categoryId: string) => {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .schema('inter_app')
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erreur récupération produits par catégorie:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
})
