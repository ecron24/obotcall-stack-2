'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface SignupFormData {
  // Step 1: Compte utilisateur
  email: string
  password: string
  fullName: string

  // Step 2: Informations société
  companyName: string
  slug: string
  countryCode: string

  // Step 3: Plan
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
}

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    features: [
      '2 utilisateurs',
      '1 GB de stockage',
      '1 000 appels API/mois',
      'Support email'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: [
      '10 utilisateurs',
      '10 GB de stockage',
      '10 000 appels API/mois',
      'Support prioritaire',
      'Domaine personnalisé'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    features: [
      'Utilisateurs illimités',
      '50 GB de stockage',
      '100 000 appels API/mois',
      'Support prioritaire 24/7',
      'Domaine personnalisé',
      'White-label',
      'API access'
    ]
  }
]

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    slug: '',
    countryCode: 'FR',
    plan: 'free'
  })

  const router = useRouter()
  const supabase = createClient()

  const updateFormData = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-générer le slug depuis le nom de la société
    if (field === 'companyName' && value) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const validateStep = () => {
    setError('')

    if (step === 1) {
      if (!formData.email || !formData.password || !formData.fullName) {
        setError('Tous les champs sont requis')
        return false
      }
      if (formData.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères')
        return false
      }
    }

    if (step === 2) {
      if (!formData.companyName || !formData.slug) {
        setError('Tous les champs sont requis')
        return false
      }
      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        setError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setLoading(true)
    setError('')

    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // 2. Créer l'entrée user dans public.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName
        })

      if (userError && userError.code !== '23505') { // Ignorer duplicate key
        throw userError
      }

      // 3. Créer le tenant via l'API
      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName,
          slug: formData.slug,
          app_type: 'inter_app',
          country_code: formData.countryCode,
          owner_user_id: authData.user.id,
          plan: formData.plan
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tenant')
      }

      const { tenant } = await response.json()

      // 4. Rediriger vers l'onboarding
      router.push(`/onboarding?tenant=${tenant.slug}`)

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Créer votre compte Inter-App</CardTitle>
          <CardDescription>
            Étape {step} sur 3
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Étape 1: Compte utilisateur */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@entreprise.fr"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum 8 caractères
                </p>
              </div>
            </div>
          )}

          {/* Étape 2: Informations société */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nom de votre société</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Mon Entreprise SARL"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="slug">Identifiant unique (slug)</Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="mon-entreprise"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Votre URL sera: <span className="font-mono">{formData.slug}.inter-app.obotcall.tech</span>
                </p>
              </div>

              <div>
                <Label htmlFor="country">Pays</Label>
                <select
                  id="country"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.countryCode}
                  onChange={(e) => updateFormData('countryCode', e.target.value)}
                >
                  <option value="FR">🇫🇷 France</option>
                  <option value="BE">🇧🇪 Belgique</option>
                  <option value="CH">🇨🇭 Suisse</option>
                  <option value="DE">🇩🇪 Allemagne</option>
                  <option value="ES">🇪🇸 Espagne</option>
                  <option value="IT">🇮🇹 Italie</option>
                </select>
              </div>
            </div>
          )}

          {/* Étape 3: Choix du plan */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.plan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => updateFormData('plan', plan.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-2xl font-bold mt-1">
                          {plan.price === 0 ? 'Gratuit' : `${plan.price}€/mois`}
                        </p>
                        <ul className="mt-3 space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              ✓ {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <input
                        type="radio"
                        checked={formData.plan === plan.id}
                        onChange={() => updateFormData('plan', plan.id)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {formData.plan !== 'free' && (
                <Alert>
                  <AlertDescription>
                    📅 Vous bénéficiez de <strong>14 jours d'essai gratuit</strong>. Aucun paiement ne vous sera demandé maintenant.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Retour
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button onClick={handleNext} disabled={loading}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
