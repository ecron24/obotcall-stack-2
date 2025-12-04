'use client'

import { useState } from 'react'
import { useInterventionTypes } from '@/hooks'
import type { InterventionType } from '@/types'

interface InterventionTypeSelectorProps {
  businessTypeId?: string
  value?: string
  onChange: (interventionType: InterventionType) => void
  disabled?: boolean
  className?: string
  multiple?: boolean
}

export function InterventionTypeSelector({
  businessTypeId,
  value,
  onChange,
  disabled = false,
  className = '',
  multiple = false
}: InterventionTypeSelectorProps) {
  const { interventionTypes, loading, error } = useInterventionTypes({
    business_type_id: businessTypeId,
    is_active: true
  })
  const [selectedId, setSelectedId] = useState<string>(value || '')

  const handleSelect = (interventionType: InterventionType) => {
    setSelectedId(interventionType.id)
    onChange(interventionType)
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

  if (interventionTypes.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Aucun type d'intervention disponible</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {interventionTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleSelect(type)}
            disabled={disabled}
            style={{
              borderColor: selectedId === type.id ? type.color || undefined : undefined
            }}
            className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
              ${selectedId === type.id
                ? 'bg-opacity-10 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {type.emoji && <div className="text-3xl mb-2">{type.emoji}</div>}
            <span className="text-sm font-medium text-center text-gray-900">
              {type.name}
            </span>
            {type.default_duration && (
              <span className="text-xs text-gray-500 mt-1">
                {type.default_duration} min
              </span>
            )}
            {selectedId === type.id && (
              <div
                className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full text-white text-xs"
                style={{ backgroundColor: type.color || '#000' }}
              >
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
