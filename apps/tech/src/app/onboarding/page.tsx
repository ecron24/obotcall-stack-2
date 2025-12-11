'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react'

interface OnboardingData {
  // Informations de base
  companyName: string
  email: string
  phone: string

  // Adresse
  address: string
  city: string
  postalCode: string

  // Informations légales (optionnel)
  siret: string
  tvaNumber: string
}

function OnboardingContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenantData, setTenantData] = useState<any>(null)
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    siret: '',
    tvaNumber: ''
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
        router.push('/login')
        return
      }

      // Récupérer le tenant de l'utilisateur
      const { data: roles, error: rolesError } = await supabase
        .from('user_tenant_roles')
        .select('tenant_id, tenants!inner(id, name, slug, app_type)')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (rolesError || !roles) {
        setError('Tenant non trouvé')
        return
      }

      const tenant = (roles as any).tenants
      setTenantData(tenant)
      setData(prev => ({
        ...prev,
        companyName: tenant.name || ''
      }))
    } catch (err) {
      console.error('Error loading tenant:', err)
      setError('Erreur lors du chargement des données')
    }
  }

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handleSkip = () => {
    // Rediriger directement vers l'app métier
    redirectToApp()
  }

  const handleComplete = async () => {
    if (!tenantData) {
      setError('Tenant non trouvé')
      return
    }

    // Validation minimale
    if (!data.companyName || !data.email) {
      setError('Le nom de la société et l\'email sont requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Sauvegarder les company_settings selon l'app_type
      if (tenantData.app_type === 'inter_app') {
        const { error: settingsError } = await supabase
          .schema('inter_app')
          .from('company_settings')
          .update({
            company_name: data.companyName,
            email: data.email,
            phone: data.phone,
            company_address: data.address,
            company_city: data.city,
            company_postal_code: data.postalCode,
            siret: data.siret,
            tva_number: data.tvaNumber
          })
          .eq('tenant_id', tenantData.id)

        if (settingsError) throw settingsError
      }
      // TODO: ajouter pour immo_app, agent_app, assist_app

      // Rediriger vers l'app métier
      redirectToApp()

    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const redirectToApp = () => {
    if (!tenantData) return

    // Construire l'URL de l'app métier
    const appUrls: Record<string, string> = {
      'inter_app': process.env.NEXT_PUBLIC_INTER_APP_URL || 'http://localhost:3001',
      'immo_app': process.env.NEXT_PUBLIC_IMMO_APP_URL || 'http://localhost:3002',
      'agent_app': process.env.NEXT_PUBLIC_AGENT_APP_URL || 'http://localhost:3003',
      'assist_app': process.env.NEXT_PUBLIC_ASSIST_APP_URL || 'http://localhost:3004'
    }

    const appUrl = appUrls[tenantData.app_type]
    if (appUrl) {
      // Rediriger avec le slug du tenant dans l'URL
      window.location.href = `${appUrl}/dashboard?tenant=${tenantData.slug}`
    } else {
      setError('Type d\'application non reconnu')
    }
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <CardTitle>Bienvenue ! 🎉</CardTitle>
              <CardDescription>
                Votre compte a été créé avec succès
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Informations de votre société</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Nom de la société *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={data.companyName}
                    onChange={(e) => updateData('companyName', e.target.value)}
                    placeholder="Mon Entreprise SARL"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email de contact *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData('email', e.target.value)}
                      placeholder="contact@societe.fr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={data.phone}
                      onChange={(e) => updateData('phone', e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Adresse (optionnel)</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    type="text"
                    value={data.address}
                    onChange={(e) => updateData('address', e.target.value)}
                    placeholder="10 rue de la République"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      type="text"
                      value={data.postalCode}
                      onChange={(e) => updateData('postalCode', e.target.value)}
                      placeholder="75001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      type="text"
                      value={data.city}
                      onChange={(e) => updateData('city', e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Informations légales (optionnel)</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    type="text"
                    value={data.siret}
                    onChange={(e) => updateData('siret', e.target.value)}
                    placeholder="123 456 789 00012"
                  />
                </div>

                <div>
                  <Label htmlFor="tvaNumber">Numéro de TVA</Label>
                  <Input
                    id="tvaNumber"
                    type="text"
                    value={data.tvaNumber}
                    onChange={(e) => updateData('tvaNumber', e.target.value)}
                    placeholder="FR 12 345678901"
                  />
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                💡 Vous pourrez modifier ces informations plus tard dans les paramètres
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSkip} disabled={loading}>
            Passer
          </Button>

          <Button onClick={handleComplete} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                Accéder à mon espace
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
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
