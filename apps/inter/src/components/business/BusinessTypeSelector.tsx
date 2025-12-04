'use client'

import { useState } from 'react'
import { useBusinessTypes } from '@/hooks'
import type { BusinessType } from '@/types'

interface BusinessTypeSelectorProps {
  value?: string
  onChange: (businessType: BusinessType) => void
  disabled?: boolean
  className?: string
}

export function BusinessTypeSelector({
  value,
  onChange,
  disabled = false,
  className = ''
}: BusinessTypeSelectorProps) {
  const { businessTypes, loading, error } = useBusinessTypes()
  const [selectedId, setSelectedId] = useState<string>(value || '')

  const handleSelect = (businessType: BusinessType) => {
    setSelectedId(businessType.id)
    onChange(businessType)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">Erreur: {error}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Choisissez votre type d'activité</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businessTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleSelect(type)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center p-6 rounded-lg border-2 transition-all
              ${selectedId === type.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-4xl mb-3">{type.emoji}</div>
            <h4 className="text-lg font-semibold text-gray-900">{type.name}</h4>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
              <span>Taux horaire: {type.default_labor_rate}€/h</span>
              <span>•</span>
              <span>Déplacement: {type.default_travel_fee}€</span>
            </div>
            {selectedId === type.id && (
              <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-primary rounded-full text-white">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
