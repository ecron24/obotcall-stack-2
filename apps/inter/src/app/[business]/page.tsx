'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useBusinessTypes } from '@/hooks'
import type { BusinessType } from '@/types'

export default function BusinessLandingPage() {
  const router = useRouter()
  const params = useParams()
  const { businessTypes, loading } = useBusinessTypes()
  const [business, setBusiness] = useState<BusinessType | null>(null)

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('access_token')
    if (token) {
      router.push('/dashboard')
      return
    }

    // Find business by slug (code)
    if (businessTypes.length > 0 && params.business) {
      const slug = params.business as string
      // Match by code or name slug
      const found = businessTypes.find(
        b => b.code.toLowerCase() === slug.toLowerCase() ||
             b.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
      )

      if (found) {
        setBusiness(found)
      } else {
        // Redirect to home if business not found
        router.push('/')
      }
    }
  }, [businessTypes, params.business, router])

  const handleGetStarted = () => {
    if (business) {
      router.push(`/auth/register?business=${business.id}`)
    }
  }

  if (loading || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Messages personnalisés par type de métier
  const businessMessages: Record<string, { subtitle: string; features: string[] }> = {
    'pisciniste': {
      subtitle: 'Simplifiez la gestion de vos interventions piscines, de la maintenance aux travaux',
      features: [
        'Gestion complète des piscines de vos clients',
        'Suivi des produits chimiques et équipements',
        'Planning des entretiens et hivernages',
        'Devis et factures adaptés aux piscinistes'
      ]
    },
    'plombier': {
      subtitle: 'Gérez vos interventions de plomberie efficacement, de l\'urgence à la rénovation',
      features: [
        'Gestion des interventions d\'urgence',
        'Catalogue de pièces et fournitures',
        'Planning optimisé par secteur',
        'Devis et factures pour travaux de plomberie'
      ]
    },
    'electricien': {
      subtitle: 'Organisez vos chantiers électriques, des petits dépannages aux grandes installations',
      features: [
        'Gestion des chantiers électriques',
        'Catalogue de matériel électrique',
        'Conformité et certifications',
        'Devis et factures adaptés aux électriciens'
      ]
    },
    'garagiste': {
      subtitle: 'Gérez votre garage automobile, de la mécanique à la carrosserie',
      features: [
        'Suivi des véhicules clients',
        'Gestion des pièces détachées',
        'Planning atelier et rendez-vous',
        'Devis et factures automobile'
      ]
    },
    'chauffagiste': {
      subtitle: 'Optimisez la gestion de vos installations de chauffage et climatisation',
      features: [
        'Gestion des installations chauffage/clim',
        'Suivi des contrats d\'entretien',
        'Planning des maintenances',
        'Devis et factures adaptés'
      ]
    }
  }

  const message = businessMessages[business.code.toLowerCase()] || {
    subtitle: `Simplifiez la gestion de votre activité de ${business.name.toLowerCase()}`,
    features: [
      'Gestion complète de vos interventions',
      'Suivi de vos clients et prospects',
      'Planning et organisation',
      'Devis et factures personnalisés'
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              I
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">Inter-App</div>
              <div className="text-xs text-gray-500">pour {business.name}s</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Se connecter
            </Link>
            <button
              onClick={handleGetStarted}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                <span className="text-2xl">{business.emoji}</span>
                Solution pour {business.name}s
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Inter-App pour
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {business.name}s
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {message.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Commencer gratuitement
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-semibold border-2 border-gray-200"
                >
                  Voir tous les métiers
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Fonctionnalités clés
              </h3>
              <ul className="space-y-4">
                {message.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Info */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tarifs adaptés aux {business.name}s
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-600 mb-2">Taux horaire par défaut</div>
                <div className="text-3xl font-bold text-gray-900">{business.default_labor_rate}€<span className="text-lg font-normal text-gray-600">/h</span></div>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-600 mb-2">Frais de déplacement</div>
                <div className="text-3xl font-bold text-gray-900">{business.default_travel_fee}€</div>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-sm font-semibold text-blue-600 mb-2">TVA</div>
                <div className="text-3xl font-bold text-blue-900">{business.default_tax_rate}%</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Tous ces paramètres sont personnalisables selon vos besoins
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à simplifier votre activité ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez les {business.name}s qui font confiance à Inter-App
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Commencer gratuitement
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4">
            <div className="text-xl font-bold text-white mb-2">Inter-App</div>
            <p className="text-sm">La solution pour {business.name}s</p>
          </div>
          <div className="text-sm">
            © 2024 Inter-App. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
