'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle } from 'lucide-react'

interface CompanySettings {
  company_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  siret: string
  tva_number: string
}

function OnboardingContent() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    siret: '',
    tva_number: ''
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadTenant()
  }, [])

  const loadTenant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Récupérer le tenant de l'utilisateur
      const { data: roles } = await supabase
        .from('user_tenant_roles')
        .select('tenant_id, tenants(id, name, app_type)')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (roles) {
        setTenantId(roles.tenant_id)
        setCompanySettings(prev => ({
          ...prev,
          company_name: (roles.tenants as any)?.name || ''
        }))
      }
    } catch (err) {
      console.error('Error loading tenant:', err)
    }
  }

  const updateSettings = (field: keyof CompanySettings, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSkip = async () => {
    // Passer directement au dashboard
    router.push('/dashboard')
  }

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = async () => {
    if (!tenantId) {
      setError('Tenant non trouvé')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Sauvegarder les company_settings
      const { error: settingsError } = await supabase
        .schema('inter_app')
        .from('company_settings')
        .update({
          company_name: companySettings.company_name,
          email: companySettings.email,
          phone: companySettings.phone,
          company_address: companySettings.address,
          company_city: companySettings.city,
          company_postal_code: companySettings.postal_code,
          siret: companySettings.siret,
          tva_number: companySettings.tva_number
        })
        .eq('tenant_id', tenantId)

      if (settingsError) throw settingsError

      // Rediriger vers le dashboard
      router.push('/dashboard')

    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Bienvenue sur Inter-App ! 🎉</CardTitle>
          <CardDescription>
            Configuration rapide de votre compte - Étape {step} sur 3
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Étape 1: Informations de base */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg">Votre compte a été créé avec succès !</p>
                <p className="text-sm text-muted-foreground">
                  Configurons maintenant les informations de votre société.
                </p>
              </div>

              <div>
                <Label htmlFor="companyName">Nom de votre société *</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companySettings.company_name}
                  onChange={(e) => updateSettings('company_name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email de contact *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@societe.fr"
                    value={companySettings.email}
                    onChange={(e) => updateSettings('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={companySettings.phone}
                    onChange={(e) => updateSettings('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Adresse */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="10 rue de la République"
                  value={companySettings.address}
                  onChange={(e) => updateSettings('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="75001"
                    value={companySettings.postal_code}
                    onChange={(e) => updateSettings('postal_code', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Paris"
                    value={companySettings.city}
                    onChange={(e) => updateSettings('city', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Informations légales */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  type="text"
                  placeholder="123 456 789 00012"
                  value={companySettings.siret}
                  onChange={(e) => updateSettings('siret', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optionnel - Vous pourrez le renseigner plus tard
                </p>
              </div>

              <div>
                <Label htmlFor="tvaNumber">Numéro de TVA</Label>
                <Input
                  id="tvaNumber"
                  type="text"
                  placeholder="FR 12 345678901"
                  value={companySettings.tva_number}
                  onChange={(e) => updateSettings('tva_number', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optionnel - Vous pourrez le renseigner plus tard
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  ✅ Vous êtes presque prêt ! Cliquez sur "Terminer" pour accéder à votre tableau de bord.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Retour
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} disabled={loading}>
              Passer
            </Button>
          </div>

          {step < 3 ? (
            <Button onClick={handleNext} disabled={loading}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalisation...
                </>
              ) : (
                'Terminer'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
