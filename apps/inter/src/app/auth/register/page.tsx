'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { BusinessTypeSelector } from '@/components/business'
import { useBusinessTypes } from '@/hooks'
import type { BusinessType } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { businessTypes, loading: loadingBusinessTypes } = useBusinessTypes()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null)

  // Pre-select business from query params
  useEffect(() => {
    const businessId = searchParams.get('business')
    if (businessId && businessTypes.length > 0) {
      const business = businessTypes.find(b => b.id === businessId)
      if (business) {
        setSelectedBusiness(business)
      }
    }
  }, [searchParams, businessTypes])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Vérifier qu'un métier a été sélectionné
    if (!selectedBusiness) {
      setError('Veuillez sélectionner votre type d\'activité')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const tenant_name = formData.get('tenant_name') as string
    const tenant_slug = formData.get('tenant_slug') as string

    try {
      const response = await apiClient.register({
        email,
        password,
        full_name,
        tenant_name,
        tenant_slug,
        business_type_id: selectedBusiness.id,
      })

      // Store token and user data
      apiClient.setToken(response.access_token)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('tenant', JSON.stringify(response.tenant))

      // Store selected business type for dashboard customization
      localStorage.setItem('selected_business_type', JSON.stringify(selectedBusiness))

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Inscription</CardTitle>
          <CardDescription>
            Créez votre compte Inter-App et commencez à gérer vos interventions
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">Nom complet</label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Jean Dupont"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vous@exemple.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tenant_name" className="text-sm font-medium">Nom de l'entreprise</label>
              <Input
                id="tenant_name"
                name="tenant_name"
                type="text"
                placeholder="Mon Entreprise"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tenant_slug" className="text-sm font-medium">Identifiant unique</label>
              <Input
                id="tenant_slug"
                name="tenant_slug"
                type="text"
                placeholder="mon-entreprise"
                required
                pattern="[a-z0-9\-]+"
                title="Lettres minuscules, chiffres et tirets uniquement"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Cet identifiant sera utilisé dans l'URL de votre compte
              </p>
            </div>

            {/* Sélecteur de métier */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Type d'activité *</label>

              {selectedBusiness ? (
                // Métier pré-sélectionné depuis l'URL - affichage simplifié
                <div className="space-y-2">
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedBusiness.emoji}</span>
                        <div>
                          <div className="text-base font-semibold text-blue-900">
                            {selectedBusiness.name}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBusiness(null)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        disabled={loading}
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez modifier votre choix en cliquant sur "Modifier"
                  </p>
                </div>
              ) : (
                // Pas de métier pré-sélectionné - afficher le sélecteur complet
                <BusinessTypeSelector
                  onChange={(business) => setSelectedBusiness(business)}
                  disabled={loading}
                  className="mt-2"
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
