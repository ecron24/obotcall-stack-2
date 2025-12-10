'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBusinessTypes, useTenant } from '@/hooks'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { BusinessType } from '@/types'

export default function BusinessTypeSettingsPage() {
  const router = useRouter()
  const { businessTypes, loading: loadingBusinessTypes } = useBusinessTypes()
  const { tenant, businessType: currentBusinessType } = useTenant()
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (currentBusinessType) {
      setSelectedBusinessType(currentBusinessType)
    }
  }, [currentBusinessType])

  const handleSave = async () => {
    if (!selectedBusinessType || !tenant) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un métier' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const supabase = createClient()

      // Mettre à jour le business_type_id du tenant
      const { error } = await supabase
        .from('tenants')
        .update({ business_type_id: selectedBusinessType.id })
        .eq('id', tenant.id)

      if (error) throw error

      // Mettre à jour le localStorage
      const updatedTenant = { ...tenant, business_type_id: selectedBusinessType.id }
      localStorage.setItem('tenant', JSON.stringify(updatedTenant))

      setMessage({
        type: 'success',
        text: `Métier changé avec succès ! La page va se recharger...`
      })

      // Recharger la page après 1.5s pour voir le changement
      setTimeout(() => {
        router.refresh()
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      console.error('Error updating business type:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Erreur lors de la mise à jour du métier'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loadingBusinessTypes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Type de métier</h1>
        <p className="text-muted-foreground mt-2">
          Choisissez le secteur d'activité de votre entreprise. Cela personnalisera votre expérience.
        </p>
      </div>

      {/* Message de feedback */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Métier actuel */}
      {currentBusinessType && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Métier actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentBusinessType.emoji}</span>
              <div>
                <p className="font-semibold text-lg">{currentBusinessType.name}</p>
                <p className="text-sm text-gray-600">Code: {currentBusinessType.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sélection du nouveau métier */}
      <Card>
        <CardHeader>
          <CardTitle>Changer de métier</CardTitle>
          <CardDescription>
            Sélectionnez un nouveau métier pour votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessTypes.map((business) => (
              <button
                key={business.id}
                onClick={() => setSelectedBusinessType(business)}
                disabled={saving}
                className={`
                  relative flex flex-col items-center p-6 rounded-lg border-2 transition-all
                  ${selectedBusinessType?.id === business.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-5xl mb-3">{business.emoji}</div>
                <h4 className="text-base font-semibold text-gray-900 text-center">
                  {business.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{business.code}</p>

                {selectedBusinessType?.id === business.id && (
                  <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedBusinessType && selectedBusinessType.id !== currentBusinessType?.id && (
                <p>
                  Vous allez passer de <strong>{currentBusinessType?.name}</strong> à{' '}
                  <strong>{selectedBusinessType.name}</strong>
                </p>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !selectedBusinessType ||
                selectedBusinessType.id === currentBusinessType?.id
              }
              className="min-w-[150px]"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Mode développement</p>
              <p>
                Cette page vous permet de changer facilement de métier pour tester les différentes
                configurations. En production, le métier sera défini lors de l'abonnement via Stripe
                et ne pourra pas être modifié depuis cette interface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
