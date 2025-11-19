import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createLease } from '../actions'

export default async function NewLeasePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  // Fetch templates
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .is('deleted_at', null)
    .order('country')

  // Fetch properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id, property_type, address_line1, city, postal_code')
    .eq('tenant_id', tenant?.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Default start date: today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Générer un bail</h1>
          <p className="text-muted-foreground">
            Créez un nouveau bail immobilier
          </p>
        </div>
      </div>

      <form action={createLease}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du bail</CardTitle>
                <CardDescription>
                  Sélectionnez le pays et le type de bail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Country and Type */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays *</Label>
                    <Select name="country" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="LU">Luxembourg</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="DE">Allemagne</SelectItem>
                        <SelectItem value="ES">Espagne</SelectItem>
                        <SelectItem value="IT">Italie</SelectItem>
                        <SelectItem value="PT">Portugal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lease_type">Type de bail *</Label>
                    <Select name="lease_type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Résidentiel</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed">Mixte</SelectItem>
                        <SelectItem value="seasonal">Saisonnier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Template */}
                {templates && templates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="template_id">Template (optionnel)</Label>
                    <Select name="template_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template: any) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} - {template.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Bien immobilier</CardTitle>
                <CardDescription>
                  Sélectionnez le bien concerné par le bail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property_id">Propriété *</Label>
                  {properties && properties.length > 0 ? (
                    <Select name="property_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un bien" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property: any) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.address_line1}, {property.city} ({property.postal_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 border rounded-md">
                      Aucun bien disponible.{' '}
                      <Link href="/dashboard/properties/new" className="text-primary hover:underline">
                        Créer un bien
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lessor (Bailleur) */}
            <Card>
              <CardHeader>
                <CardTitle>Bailleur (Propriétaire)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lessor_entity_type">Type *</Label>
                  <Select name="lessor_entity_type" required defaultValue="individual">
                    <SelectTrigger>
                      <SelectValue placeholder="Type d'entité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Particulier</SelectItem>
                      <SelectItem value="company">Société</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Individual fields */}
                <div className="space-y-4" data-entity="individual">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lessor_title">Civilité</Label>
                      <Select name="lessor_title">
                        <SelectTrigger>
                          <SelectValue placeholder="Civilité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">M.</SelectItem>
                          <SelectItem value="MME">Mme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lessor_first_name">Prénom *</Label>
                      <Input
                        id="lessor_first_name"
                        name="lessor_first_name"
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lessor_last_name">Nom *</Label>
                      <Input
                        id="lessor_last_name"
                        name="lessor_last_name"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                </div>

                {/* Company fields */}
                <div className="space-y-4" data-entity="company">
                  <div className="space-y-2">
                    <Label htmlFor="lessor_company_name">Raison sociale *</Label>
                    <Input
                      id="lessor_company_name"
                      name="lessor_company_name"
                      placeholder="Ma Société SARL"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lessor_legal_form">Forme juridique</Label>
                      <Input
                        id="lessor_legal_form"
                        name="lessor_legal_form"
                        placeholder="SARL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lessor_siret">SIRET</Label>
                      <Input
                        id="lessor_siret"
                        name="lessor_siret"
                        placeholder="12345678901234"
                      />
                    </div>
                  </div>
                </div>

                {/* Common address fields */}
                <div className="space-y-2">
                  <Label htmlFor="lessor_address_line1">Adresse *</Label>
                  <Input
                    id="lessor_address_line1"
                    name="lessor_address_line1"
                    placeholder="123 rue de la Paix"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lessor_postal_code">Code postal *</Label>
                    <Input
                      id="lessor_postal_code"
                      name="lessor_postal_code"
                      placeholder="75001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessor_city">Ville *</Label>
                    <Input
                      id="lessor_city"
                      name="lessor_city"
                      placeholder="Paris"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lessee (Locataire) */}
            <Card>
              <CardHeader>
                <CardTitle>Locataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lessee_entity_type">Type *</Label>
                  <Select name="lessee_entity_type" required defaultValue="individual">
                    <SelectTrigger>
                      <SelectValue placeholder="Type d'entité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Particulier</SelectItem>
                      <SelectItem value="company">Société</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Individual fields */}
                <div className="space-y-4" data-entity="individual">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lessee_title">Civilité</Label>
                      <Select name="lessee_title">
                        <SelectTrigger>
                          <SelectValue placeholder="Civilité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">M.</SelectItem>
                          <SelectItem value="MME">Mme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lessee_first_name">Prénom *</Label>
                      <Input
                        id="lessee_first_name"
                        name="lessee_first_name"
                        placeholder="Marie"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lessee_last_name">Nom *</Label>
                      <Input
                        id="lessee_last_name"
                        name="lessee_last_name"
                        placeholder="Martin"
                      />
                    </div>
                  </div>
                </div>

                {/* Company fields */}
                <div className="space-y-4" data-entity="company">
                  <div className="space-y-2">
                    <Label htmlFor="lessee_company_name">Raison sociale *</Label>
                    <Input
                      id="lessee_company_name"
                      name="lessee_company_name"
                      placeholder="Entreprise SAS"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lessee_legal_form">Forme juridique</Label>
                      <Input
                        id="lessee_legal_form"
                        name="lessee_legal_form"
                        placeholder="SAS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lessee_siret">SIRET</Label>
                      <Input
                        id="lessee_siret"
                        name="lessee_siret"
                        placeholder="12345678901234"
                      />
                    </div>
                  </div>
                </div>

                {/* Common address fields */}
                <div className="space-y-2">
                  <Label htmlFor="lessee_address_line1">Adresse *</Label>
                  <Input
                    id="lessee_address_line1"
                    name="lessee_address_line1"
                    placeholder="45 avenue des Champs"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lessee_postal_code">Code postal *</Label>
                    <Input
                      id="lessee_postal_code"
                      name="lessee_postal_code"
                      placeholder="75008"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessee_city">Ville *</Label>
                    <Input
                      id="lessee_city"
                      name="lessee_city"
                      placeholder="Paris"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations financières</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">Loyer mensuel (€) *</Label>
                  <Input
                    id="monthly_rent"
                    name="monthly_rent"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="850.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="charges">Charges (€)</Label>
                  <Input
                    id="charges"
                    name="charges"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    defaultValue="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Dépôt de garantie (€)</Label>
                  <Input
                    id="deposit"
                    name="deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="850.00"
                    defaultValue="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Durée du bail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    defaultValue={today}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_months">Durée (mois)</Label>
                  <Input
                    id="duration_months"
                    name="duration_months"
                    type="number"
                    min="1"
                    defaultValue="12"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Notes internes sur ce bail..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                Créer le bail (brouillon)
              </Button>
              <Link href="/dashboard/leases">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
