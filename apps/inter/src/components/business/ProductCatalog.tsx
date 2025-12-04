'use client'

import { useState, useMemo } from 'react'
import { useProducts, useProductCategories } from '@/hooks'
import type { Product, ProductType } from '@/types'

interface ProductCatalogProps {
  onSelectProduct: (product: Product) => void
  selectedProductIds?: string[]
  className?: string
}

export function ProductCatalog({
  onSelectProduct,
  selectedProductIds = [],
  className = ''
}: ProductCatalogProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProductType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { products, loading, error } = useProducts({
    search,
    type: typeFilter || undefined,
    category_id: categoryFilter || undefined,
    is_active: true
  })

  const { categories } = useProductCategories()

  const productTypes: { value: ProductType; label: string; emoji: string }[] = [
    { value: 'product', label: 'Produits', emoji: '📦' },
    { value: 'service', label: 'Services', emoji: '🔧' },
    { value: 'labor', label: 'Main d\'oeuvre', emoji: '👷' }
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getProductTypeLabel = (type: ProductType) => {
    return productTypes.find(t => t.value === type)?.label || type
  }

  const getProductTypeEmoji = (type: ProductType) => {
    return productTypes.find(t => t.value === type)?.emoji || ''
  }

  if (loading && !products.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Filtres */}
      <div className="mb-6 space-y-4">
        {/* Recherche */}
        <div>
          <input
            type="text"
            placeholder="Rechercher un produit ou service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Filtres Type et Catégorie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre par type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ProductType | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Tous les types</option>
              {productTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">Erreur: {error}</p>
        </div>
      )}

      {/* Liste des produits */}
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun produit trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className={`
                text-left p-4 rounded-lg border-2 transition-all
                ${selectedProductIds.includes(product.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
                cursor-pointer
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getProductTypeEmoji(product.type)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    {product.code && (
                      <p className="text-xs text-gray-500">{product.code}</p>
                    )}
                  </div>
                </div>
                {selectedProductIds.includes(product.id) && (
                  <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full text-white text-xs">
                    ✓
                  </div>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(product.unit_price_ht)}
                  </div>
                  <div className="text-xs text-gray-500">
                    HT / {product.unit}
                  </div>
                </div>

                {product.has_stock && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    product.stock_quantity > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Stock: {product.stock_quantity}
                  </div>
                )}
              </div>

              {product.category && (
                <div className="mt-2 text-xs text-gray-500">
                  {product.category.name}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
