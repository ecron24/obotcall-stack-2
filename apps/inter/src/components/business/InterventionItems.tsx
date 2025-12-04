'use client'

import { useState } from 'react'
import { useInterventionItems } from '@/hooks'
import { ProductCatalog } from './ProductCatalog'
import type { Product, CreateInterventionItemInput } from '@/types'

interface InterventionItemsProps {
  interventionId: string
  readonly?: boolean
  className?: string
}

export function InterventionItems({
  interventionId,
  readonly = false,
  className = ''
}: InterventionItemsProps) {
  const {
    items,
    totals,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  } = useInterventionItems(interventionId)

  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleSelectProduct = async (product: Product) => {
    const newItem: CreateInterventionItemInput = {
      product_id: product.id,
      description: product.name,
      quantity: 1,
      unit_price_ht: product.unit_price_ht,
      tax_rate: product.tax_rate
    }

    try {
      await addItem(newItem)
      setShowProductCatalog(false)
    } catch (err) {
      console.error('Error adding item:', err)
    }
  }

  const handleAddManualItem = async () => {
    const newItem: CreateInterventionItemInput = {
      description: 'Nouvel élément',
      quantity: 1,
      unit_price_ht: 0,
      tax_rate: 20
    }

    try {
      const item = await addItem(newItem)
      setEditingItemId(item.id)
    } catch (err) {
      console.error('Error adding item:', err)
    }
  }

  const handleUpdateItem = async (itemId: string, field: string, value: any) => {
    try {
      await updateItem(itemId, { [field]: value })
    } catch (err) {
      console.error('Error updating item:', err)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Supprimer cet élément ?')) {
      try {
        await deleteItem(itemId)
      } catch (err) {
        console.error('Error deleting item:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Détails de l'intervention</h3>
        {!readonly && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowProductCatalog(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              📦 Ajouter un produit
            </button>
            <button
              onClick={handleAddManualItem}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ✏️ Saisie manuelle
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">Erreur: {error}</p>
        </div>
      )}

      {/* Liste des items */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          Aucun élément ajouté
        </div>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix unitaire HT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TVA
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total HT
                  </th>
                  {!readonly && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingItemId === item.id && !readonly ? (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          onBlur={() => setEditingItemId(null)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => !readonly && setEditingItemId(item.id)}
                          className={!readonly ? 'cursor-pointer' : ''}
                        >
                          {item.description}
                          {item.product && (
                            <div className="text-xs text-gray-500">
                              {item.product.code}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingItemId === item.id && !readonly ? (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value))}
                          onBlur={() => setEditingItemId(null)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => !readonly && setEditingItemId(item.id)} className={!readonly ? 'cursor-pointer' : ''}>
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingItemId === item.id && !readonly ? (
                        <input
                          type="number"
                          value={item.unit_price_ht}
                          onChange={(e) => handleUpdateItem(item.id, 'unit_price_ht', parseFloat(e.target.value))}
                          onBlur={() => setEditingItemId(null)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => !readonly && setEditingItemId(item.id)} className={!readonly ? 'cursor-pointer' : ''}>
                          {formatPrice(item.unit_price_ht)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {item.tax_rate}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPrice(item.total_ht)}
                    </td>
                    {!readonly && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total HT</span>
                <span className="font-semibold">{formatPrice(totals.subtotal_ht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA</span>
                <span className="font-semibold">{formatPrice(totals.total_tax)}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-bold">Total TTC</span>
                <span className="font-bold text-primary">{formatPrice(totals.total_ttc)}</span>
              </div>
              <div className="text-xs text-gray-500 text-right">
                {totals.items_count} élément{totals.items_count > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal catalogue produits */}
      {showProductCatalog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Catalogue de produits</h2>
              <button
                onClick={() => setShowProductCatalog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ProductCatalog
                onSelectProduct={handleSelectProduct}
                selectedProductIds={items.map(item => item.product_id).filter(Boolean) as string[]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
