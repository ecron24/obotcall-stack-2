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

  // Fetch templates
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .is('deleted_at', null)
    .order('country')

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

            <Card>
              <CardHeader>
                <CardTitle>Propriétaire (Bailleur)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="landlord_name">Nom complet *</Label>
                  <Input
                    id="landlord_name"
                    name="landlord_name"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landlord_address">Adresse *</Label>
                  <Textarea
                    id="landlord_address"
                    name="landlord_address"
                    placeholder="123 rue de la Paix, 75001 Paris"
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name">Nom complet *</Label>
                  <Input
                    id="tenant_name"
                    name="tenant_name"
                    placeholder="Marie Martin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_address">Adresse</Label>
                  <Textarea
                    id="tenant_address"
                    name="tenant_address"
                    placeholder="45 avenue des Champs, 75008 Paris"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bien immobilier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property_address">Adresse du bien *</Label>
                  <Textarea
                    id="property_address"
                    name="property_address"
                    placeholder="10 boulevard Voltaire, 75011 Paris"
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Type de bien</Label>
                  <Input
                    id="property_type"
                    name="property_type"
                    placeholder="Appartement T3, 65m²"
                  />
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
