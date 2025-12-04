'use client'

import { ProductCatalog } from '@/components/business'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalogue Produits</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos produits et services
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          ➕ Nouveau produit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <ProductCatalog
          onSelectProduct={(product) => {
            console.log('Product selected:', product)
            // TODO: Ouvrir modal d'édition
          }}
        />
      </div>
    </div>
  )
}
