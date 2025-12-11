'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProducts } from '@/hooks'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'

interface StockMovement {
  id: string
  tenant_id: string
  product_id: string
  movement_type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'loss' | 'transfer' | 'intervention'
  quantity: number
  unit_cost?: number
  reference?: string
  intervention_id?: string
  notes?: string
  created_by: string
  created_at: string
  product?: {
    id: string
    name: string
    code?: string
    unit: string
    stock_quantity: number
  }
  intervention?: {
    id: string
    title: string
  }
}

interface Product {
  id: string
  name: string
  code?: string
  stock_quantity: number
  unit: string
}

export default function StockPage() {
  const router = useRouter()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [productFilter, setProductFilter] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState('')
  const [interventionFilter, setInterventionFilter] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'purchase' as StockMovement['movement_type'],
    quantity: 0,
    unit_cost: 0,
    reference: '',
    notes: ''
  })

  const { products } = useProducts({ is_active: true })

  useEffect(() => {
    fetchMovements()
  }, [productFilter, movementTypeFilter, interventionFilter])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const params = new URLSearchParams({
        page: '1',
        per_page: '100'
      })

      if (productFilter) params.append('product_id', productFilter)
      if (movementTypeFilter) params.append('movement_type', movementTypeFilter)
      if (interventionFilter) params.append('intervention_id', interventionFilter)

      const response = await fetch(`${API_URL}/api/stock-movements?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des mouvements de stock')
      }

      const data = await response.json()
      setMovements(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Error fetching stock movements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || formData.quantity <= 0) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setActionLoading(true)
      const token = localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/stock-movements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la création du mouvement')
      }

      setShowAddForm(false)
      setFormData({
        product_id: '',
        movement_type: 'purchase',
        quantity: 0,
        unit_cost: 0,
        reference: '',
        notes: ''
      })
      await fetchMovements()
      alert('✅ Mouvement de stock créé avec succès')
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const getMovementTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      purchase: { label: '📥 Achat', className: 'bg-green-100 text-green-800' },
      sale: { label: '📤 Vente', className: 'bg-blue-100 text-blue-800' },
      return: { label: '↩️ Retour', className: 'bg-yellow-100 text-yellow-800' },
      adjustment: { label: '⚖️ Ajustement', className: 'bg-purple-100 text-purple-800' },
      loss: { label: '❌ Perte', className: 'bg-red-100 text-red-800' },
      transfer: { label: '🔄 Transfert', className: 'bg-indigo-100 text-indigo-800' },
      intervention: { label: '🔧 Intervention', className: 'bg-orange-100 text-orange-800' },
    }
    const badge = badges[type] || { label: type, className: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Calculate total stock value
  const totalStockValue = products.reduce((sum, product) => {
    return sum + (product.stock_quantity || 0) * (product.unit_price_ht || 0)
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivez vos mouvements de stock et inventaire
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {showAddForm ? '❌ Annuler' : '➕ Nouveau mouvement'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Produits en stock</div>
          <div className="text-2xl font-bold text-gray-900">
            {products.filter(p => (p.stock_quantity || 0) > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Valeur totale stock</div>
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(totalStockValue)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Mouvements ce mois</div>
          <div className="text-2xl font-bold text-blue-600">
            {movements.filter(m => {
              const date = new Date(m.created_at)
              const now = new Date()
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
            }).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Produits en rupture</div>
          <div className="text-2xl font-bold text-red-600">
            {products.filter(p => p.has_stock && (p.stock_quantity || 0) <= 0).length}
          </div>
        </div>
      </div>

      {/* Add Movement Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Nouveau mouvement de stock</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product */}
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Produit *
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  required
                  value={formData.product_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un produit</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.code ? `${product.code} - ` : ''}{product.name} (Stock: {product.stock_quantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type */}
              <div>
                <label htmlFor="movement_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de mouvement *
                </label>
                <select
                  id="movement_type"
                  name="movement_type"
                  required
                  value={formData.movement_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="purchase">📥 Achat</option>
                  <option value="sale">📤 Vente</option>
                  <option value="return">↩️ Retour</option>
                  <option value="adjustment">⚖️ Ajustement</option>
                  <option value="loss">❌ Perte</option>
                  <option value="transfer">🔄 Transfert</option>
                  <option value="intervention">🔧 Intervention</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité * (+ pour entrée, - pour sortie)
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  required
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Unit Cost */}
              <div>
                <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-2">
                  Coût unitaire
                </label>
                <input
                  type="number"
                  id="unit_cost"
                  name="unit_cost"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reference */}
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                  Référence
                </label>
                <input
                  type="text"
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="N° bon de commande, facture..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Création...' : 'Créer le mouvement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par produit
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les produits</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.code ? `${product.code} - ` : ''}{product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par type
            </label>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="purchase">📥 Achat</option>
              <option value="sale">📤 Vente</option>
              <option value="return">↩️ Retour</option>
              <option value="adjustment">⚖️ Ajustement</option>
              <option value="loss">❌ Perte</option>
              <option value="transfer">🔄 Transfert</option>
              <option value="intervention">🔧 Intervention</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setProductFilter('')
                setMovementTypeFilter('')
                setInterventionFilter('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Réinitialiser filtres
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Movements List */}
      {movements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-6xl mb-4 block">📦</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun mouvement de stock
          </h3>
          <p className="text-gray-500 mb-6">
            Commencez par ajouter un mouvement de stock
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              ➕ Nouveau mouvement
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.product?.name || '-'}
                      {movement.product?.code && (
                        <div className="text-xs text-gray-500">{movement.product.code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMovementTypeBadge(movement.movement_type)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                      movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.product?.unit || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {movement.unit_cost ? formatPrice(movement.unit_cost) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.reference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Summary by Product */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📊 Résumé stock par produit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock actuel
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix unit. HT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.filter(p => p.has_stock).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.name}
                    {product.code && (
                      <div className="text-xs text-gray-500">{product.code}</div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                    (product.stock_quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.stock_quantity || 0} {product.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatPrice(product.unit_price_ht || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {formatPrice((product.stock_quantity || 0) * (product.unit_price_ht || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
