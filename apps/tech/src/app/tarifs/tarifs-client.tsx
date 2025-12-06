'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

interface BusinessType {
  id: string
  name: string
  emoji: string
}

export function TarifsClient() {
  const searchParams = useSearchParams()
  const product = searchParams.get('product')
  const businessId = searchParams.get('business')
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)

  useEffect(() => {
    // Load business type if business ID is provided
    if (businessId) {
      fetch(`https://api.inter.app.obotcall.tech/api/business-types/${businessId}`)
        .then(res => res.json())
        .then(data => setBusinessType(data))
        .catch(err => console.error('Error loading business type:', err))
    }
  }, [businessId])

  const handleSelectPlan = (planId: string, productType: string) => {
    // Build checkout URL with params
    const params = new URLSearchParams({
      product: productType,
      plan: planId,
    })

    if (businessId) params.append('business', businessId)

    window.location.href = `/checkout?${params.toString()}`
  }

  return (
    <>
      {/* Hero Section with business type if selected */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Tarifs simples et transparents
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Choisissez le plan adapté à vos besoins. Sans engagement, sans frais cachés.
          </p>

          {businessType && (
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <span className="text-3xl">{businessType.emoji}</span>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Métier sélectionné</p>
                <p className="font-semibold text-blue-900 dark:text-blue-100">{businessType.name}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Inter Pricing */}
      <section className="border-t py-16 md:py-24">
        <div className="container">
          <div className="mb-12">
            <Badge className="mb-4">Inter</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Gestion d'interventions multi-métiers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tarifs adaptés à la taille de votre entreprise
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Pour les indépendants</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">49€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">1 utilisateur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Interventions illimitées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Devis & Factures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Planning basique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Support email</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan('starter', 'inter')}
                >
                  Choisir Starter
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Populaire</Badge>
                </div>
                <CardDescription>Pour les équipes</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">99€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Utilisateurs illimités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tout Starter +</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Planning avancé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Multi-techniciens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Intégration Google Calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Support prioritaire</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan('pro', 'inter')}
                >
                  Choisir Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
