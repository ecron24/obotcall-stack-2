'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Users, FileText, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Product = 'inter' | 'agent' | 'immo'
type Plan = {
  id: string
  name: string
  price: string
  priceId: string
  features: string[]
}

const products = {
  inter: {
    name: 'Inter',
    description: 'Gestion d'interventions multi-métiers',
    icon: Phone,
    color: 'blue',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: '29€/mois',
        priceId: 'STRIPE_INTER_STARTER_PRICE_ID',
        features: ['1 utilisateur', 'Interventions illimitées', 'Devis & Factures', 'Planning basique', 'Support email'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '99€/mois',
        priceId: 'STRIPE_INTER_PRO_PRICE_ID',
        features: ['Utilisateurs illimités', 'Tout Starter +', 'Planning avancé', 'Multi-techniciens', 'Intégration Google Calendar', 'Support prioritaire'],
      },
    ],
  },
  agent: {
    name: 'Agent',
    description: 'CRM pour courtiers d\'assurance',
    icon: Users,
    color: 'purple',
    plans: [
      {
        id: 'solo',
        name: 'Solo',
        price: '49€/mois',
        priceId: 'STRIPE_AGENT_SOLO_PRICE_ID',
        features: ['1 utilisateur', 'Contacts illimités', 'Devis & Contrats', 'Sinistres', '1 Go stockage'],
      },
      {
        id: 'team',
        name: 'Team',
        price: '39€/utilisateur/mois',
        priceId: 'STRIPE_AGENT_TEAM_PRICE_ID',
        features: ['3+ utilisateurs', 'Tout Solo +', 'Facturation avancée', '10 Go stockage', 'Support prioritaire'],
      },
    ],
  },
  immo: {
    name: 'Immo',
    description: 'Gestion locative et baux immobiliers',
    icon: FileText,
    color: 'green',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: '19€/mois',
        priceId: 'STRIPE_IMMO_STARTER_PRICE_ID',
        features: ['10 biens', 'Baux et contrats', 'Quittances', 'Gestion locataires', 'Support email'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '49€/mois',
        priceId: 'STRIPE_IMMO_PRO_PRICE_ID',
        features: ['Biens illimités', 'Tout Starter +', 'Multi-propriétaires', 'Documents personnalisés', 'Support prioritaire'],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: '99€/mois',
        priceId: 'STRIPE_IMMO_ENTERPRISE_PRICE_ID',
        features: ['Tout Pro +', 'Multi-agences', 'Intégration API', 'White label', 'Support dédié'],
      },
    ],
  },
}

export default function SelectProductPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const router = useRouter()

  const handleSelectPlan = async (priceId: string, productName: string, planName: string) => {
    // Redirect to checkout with the selected price ID
    router.push(`/checkout?priceId=${priceId}&product=${productName}&plan=${planName}`)
  }

  return (
    <div className="min-h-screen bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choisissez votre solution
          </h1>
          <p className="text-lg text-muted-foreground">
            Sélectionnez le produit et le plan qui correspond à vos besoins
          </p>
        </div>

        {!selectedProduct ? (
          <div className="grid gap-8 md:grid-cols-3">
            {Object.entries(products).map(([key, product]) => {
              const Icon = product.icon
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    // Pour Inter, rediriger vers la sélection de métier
                    if (key === 'inter') {
                      router.push('/inter/select-business')
                    } else {
                      setSelectedProduct(key as Product)
                    }
                  }}
                >
                  <CardHeader>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-lg bg-${product.color}-100 dark:bg-${product.color}-900 mb-4`}>
                      <Icon className={`h-8 w-8 text-${product.color}-600 dark:text-${product.color}-400`} />
                    </div>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {key === 'inter'
                        ? 'Sélectionnez votre métier pour continuer'
                        : `${product.plans.length} plan${product.plans.length > 1 ? 's' : ''} disponible${product.plans.length > 1 ? 's' : ''}`
                      }
                    </p>
                    <Button className="w-full">
                      Sélectionner
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div>
            <Button
              variant="ghost"
              onClick={() => setSelectedProduct(null)}
              className="mb-8"
            >
              ← Retour aux produits
            </Button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {products[selectedProduct].name}
              </h2>
              <p className="text-lg text-muted-foreground">
                {products[selectedProduct].description}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {products[selectedProduct].plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price.split('/')[0]}</span>
                      {plan.price.includes('/') && (
                        <span className="text-muted-foreground">
                          /{plan.price.split('/')[1]}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() =>
                        handleSelectPlan(
                          plan.priceId,
                          products[selectedProduct].name,
                          plan.name
                        )
                      }
                    >
                      Choisir ce plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Besoin d'une solution personnalisée ?{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  Contactez-nous
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
