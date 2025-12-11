'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, Users, FileText, Wrench } from 'lucide-react'
import Link from 'next/link'

interface SignupFormData {
  // Step 1: Compte utilisateur
  email: string
  password: string
  fullName: string

  // Step 2: Informations société
  companyName: string
  slug: string
  countryCode: string

  // Step 3: Choix produit
  productType: 'inter_app' | 'immo_app' | 'agent_app' | 'assist_app' | null
  businessType?: string // Pour Inter-App uniquement
}

const PRODUCTS = [
  {
    id: 'inter_app' as const,
    name: 'Inter',
    description: 'Gestion d\'interventions multi-métiers',
    icon: Phone,
    color: 'blue',
    requiresBusinessType: true
  },
  {
    id: 'immo_app' as const,
    name: 'Immo',
    description: 'Gestion locative et baux',
    icon: FileText,
    color: 'green',
    requiresBusinessType: false
  },
  {
    id: 'agent_app' as const,
    name: 'Agent',
    description: 'CRM pour courtiers',
    icon: Users,
    color: 'purple',
    requiresBusinessType: false
  },
  {
    id: 'assist_app' as const,
    name: 'Assist',
    description: 'Assistant personnel',
    icon: Wrench,
    color: 'orange',
    requiresBusinessType: false
  }
]

const BUSINESS_TYPES = [
  { value: 'pool_maintenance', label: 'Pisciniste' },
  { value: 'plumbing', label: 'Plombier' },
  { value: 'electrician', label: 'Électricien' },
  { value: 'hvac', label: 'Chauffagiste' },
  { value: 'gardening', label: 'Paysagiste' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'other', label: 'Autre métier' }
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
    productType: null,
    businessType: undefined
  })

  const router = useRouter()
  const supabase = createClient()

  const updateFormData = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-générer le slug depuis le nom de la société
    if (field === 'companyName' && value) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever accents
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Email invalide')
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
      if (formData.slug.length < 3) {
        setError('Le slug doit contenir au moins 3 caractères')
        return false
      }
    }

    if (step === 3) {
      if (!formData.productType) {
        setError('Veuillez sélectionner un produit')
        return false
      }
      // Si Inter-App, vérifier que businessType est défini
      if (formData.productType === 'inter_app' && !formData.businessType) {
        setError('Veuillez sélectionner votre type de métier')
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
          app_type: formData.productType,
          country_code: formData.countryCode,
          owner_user_id: authData.user.id,
          plan: 'free', // Commence toujours en FREE
          business_type: formData.businessType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tenant')
      }

      const { tenant } = await response.json()

      // 4. Rediriger vers la sélection de plan
      // L'utilisateur peut rester en FREE ou upgrader
      router.push(`/select-product?tenant=${tenant.slug}&product=${formData.productType}`)

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = formData.productType
    ? PRODUCTS.find(p => p.id === formData.productType)
    : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Créer votre compte Obotcall</CardTitle>
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
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@entreprise.fr"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum 8 caractères
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </div>
            </div>
          )}

          {/* Étape 2: Informations société */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nom de votre société *</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Mon Entreprise SARL"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="slug">Identifiant unique (slug) *</Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="mon-entreprise"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Votre URL sera: <span className="font-mono">{formData.slug || 'votre-slug'}.obotcall.tech</span>
                </p>
              </div>

              <div>
                <Label htmlFor="country">Pays *</Label>
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

          {/* Étape 3: Choix du produit */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base mb-3 block">Quel produit souhaitez-vous utiliser ? *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRODUCTS.map((product) => {
                    const Icon = product.icon
                    const isSelected = formData.productType === product.id
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => updateFormData('productType', product.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-${product.color}-100`}>
                            <Icon className={`h-5 w-5 text-${product.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Si Inter-App est sélectionné, demander le type de métier */}
              {formData.productType === 'inter_app' && (
                <div>
                  <Label htmlFor="businessType">Votre métier *</Label>
                  <select
                    id="businessType"
                    className="w-full border rounded-md px-3 py-2 mt-2"
                    value={formData.businessType || ''}
                    onChange={(e) => updateFormData('businessType', e.target.value)}
                  >
                    <option value="">Sélectionnez votre métier...</option>
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
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
