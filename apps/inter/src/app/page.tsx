'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBusinessTypes } from '@/hooks'
import type { BusinessType } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const { businessTypes, loading } = useBusinessTypes()
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null)

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleBusinessSelect = (business: BusinessType) => {
    setSelectedBusiness(business)
    // Redirect to registration with business pre-selected
    router.push(`/auth/register?business=${business.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              I
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">Inter-App</div>
              <div className="text-xs text-gray-500">Gestion multi-métiers</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          La solution de gestion
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            adaptée à votre métier
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
          Interventions, devis, factures, planning... Tout ce dont vous avez besoin pour gérer votre activité professionnelle, personnalisé selon votre secteur d'activité.
        </p>

        {/* Business Type Selector */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Choisissez votre secteur d'activité
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {businessTypes.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleBusinessSelect(business)}
                  className="group relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {business.emoji}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {business.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span>💰</span>
                      <span>{business.default_labor_rate}€/h</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span>🚗</span>
                      <span>{business.default_travel_fee}€</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="inline-flex items-center gap-2 text-blue-600 font-semibold">
                      Commencer
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interventions</h3>
              <p className="text-gray-600">
                Gérez vos interventions, suivez leur statut et organisez le travail de vos équipes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Devis & Factures</h3>
              <p className="text-gray-600">
                Créez des devis professionnels et générez vos factures en quelques clics
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Planning</h3>
              <p className="text-gray-600">
                Organisez votre emploi du temps et celui de vos techniciens efficacement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines de professionnels qui font confiance à Inter-App
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Commencer gratuitement
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <div className="text-xl font-bold text-white mb-2">Inter-App</div>
            <p className="text-sm">La solution de gestion multi-métiers</p>
          </div>
          <div className="text-sm">
            © 2024 Inter-App. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
