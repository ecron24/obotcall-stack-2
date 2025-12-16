'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface BusinessType {
  id: string
  code: string
  name: string
  emoji: string
  default_labor_rate: number
  default_travel_fee: number
  default_tax_rate: number
}

const INTER_API_URL = 'https://api.inter.app.obotcall.tech'

// Codes des métiers à afficher (dans l'ordre)
const ALLOWED_BUSINESS_CODES = [
  'pool_maintenance',    // Pisciniste
  'plumbing_hvac',       // Chauffagiste / Plomberie
  'electrician',         // Électricien
  'pest_control',        // Dératisation
  'auto_repair'          // Garagiste
]

export default function SelectBusinessPage() {
  const router = useRouter()
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBusinessTypes()
  }, [])

  const loadBusinessTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${INTER_API_URL}/api/business-types`)

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des métiers')
      }

      const data = await response.json()
      const allBusinessTypes = Array.isArray(data) ? data : []

      // Filtrer pour ne garder que les métiers autorisés
      const filteredBusinessTypes = allBusinessTypes
        .filter(bt => ALLOWED_BUSINESS_CODES.includes(bt.code))
        // Trier dans l'ordre des ALLOWED_BUSINESS_CODES
        .sort((a, b) => {
          return ALLOWED_BUSINESS_CODES.indexOf(a.code) - ALLOWED_BUSINESS_CODES.indexOf(b.code)
        })

      setBusinessTypes(filteredBusinessTypes)
    } catch (err: any) {
      console.error('Error loading business types:', err)
      setError(err.message || 'Impossible de charger les métiers')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBusiness = (business: BusinessType) => {
    // MODE DEV/TEST: Redirect directement vers signup au lieu de Stripe
    // En production, utiliser: router.push(`/tarifs?product=inter&business=${business.id}`)
    router.push(`/signup?product=inter&business=${business.id}`)
  }

  return (
    <div className="min-h-screen bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Choisissez votre secteur d'activité
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Inter-App s'adapte à votre métier. Sélectionnez votre secteur pour bénéficier
              d'une solution personnalisée avec des fonctionnalités adaptées.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto">
            <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-md">
              {error}
            </div>
            <div className="mt-4 text-center">
              <Button onClick={loadBusinessTypes} variant="outline">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Business Types Grid */}
        {!loading && !error && businessTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businessTypes.map((business) => (
              <Card
                key={business.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-500"
                onClick={() => handleSelectBusiness(business)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {business.emoji}
                  </div>
                  <CardTitle className="text-xl">{business.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm">
                      Choisir ce métier
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && businessTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun métier disponible pour le moment.</p>
            <Button onClick={() => router.push('/')} variant="outline" className="mt-4">
              Retour à l'accueil
            </Button>
          </div>
        )}

        {/* Info Section */}
        {!loading && !error && businessTypes.length > 0 && (
          <div className="mt-16 max-w-3xl mx-auto">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Pourquoi choisir son métier ?
                    </h3>
                    <p className="text-sm text-blue-800">
                      Inter-App personnalise entièrement votre expérience selon votre secteur : types d'interventions adaptés,
                      catalogue de produits spécifiques, tarifs par défaut, et bien plus encore. Vous pourrez toujours
                      personnaliser ces paramètres par la suite.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
