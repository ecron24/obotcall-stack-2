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
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2, FileDown, Calendar } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateLease, deleteLease, generateLeasePDF } from '../actions'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function LeaseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: lease } = await supabase
    .from('leases')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!lease) {
    notFound()
  }

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .is('deleted_at', null)
    .order('country')

  const updateLeaseWithId = updateLease.bind(null, params.id)
  const deleteLeaseWithId = deleteLease.bind(null, params.id)
  const generatePDFWithId = generateLeasePDF.bind(null, params.id)

  const statusColors = {
    draft: 'secondary',
    generated: 'success',
    sent: 'default',
    signed: 'success',
  } as const

  const statusLabels = {
    draft: 'Brouillon',
    generated: 'Généré',
    sent: 'Envoyé',
    signed: 'Signé',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Bail {lease.lease_number}
              </h1>
              <Badge variant={statusColors[lease.status as keyof typeof statusColors]}>
                {statusLabels[lease.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {lease.country} - {lease.lease_type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <form action={generatePDFWithId}>
            <Button type="submit" variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Générer PDF
            </Button>
          </form>
          <form action={deleteLeaseWithId}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </form>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Loyer mensuel</div>
            <div className="text-2xl font-bold">
              {formatCurrency(lease.monthly_rent)}
            </div>
            {lease.charges > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                + {formatCurrency(lease.charges)} charges
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Dépôt de garantie</div>
            <div className="text-2xl font-bold">
              {formatCurrency(lease.deposit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Durée</div>
            <div className="text-2xl font-bold">
              {lease.duration_months} mois
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Début: {formatDate(lease.start_date)}
            </div>
          </CardContent>
        </Card>
      </div>

      <form action={updateLeaseWithId}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du bail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays *</Label>
                    <Select name="country" defaultValue={lease.country} required>
                      <SelectTrigger>
                        <SelectValue />
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
                    <Select name="lease_type" defaultValue={lease.lease_type} required>
                      <SelectTrigger>
                        <SelectValue />
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

                {templates && templates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="template_id">Template</Label>
                    <Select name="template_id" defaultValue={lease.template_id || undefined}>
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
                    defaultValue={lease.landlord_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landlord_address">Adresse *</Label>
                  <Textarea
                    id="landlord_address"
                    name="landlord_address"
                    defaultValue={lease.landlord_address}
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
                    defaultValue={lease.tenant_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_address">Adresse</Label>
                  <Textarea
                    id="tenant_address"
                    name="tenant_address"
                    defaultValue={lease.tenant_address || ''}
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
                    defaultValue={lease.property_address}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Type de bien</Label>
                  <Input
                    id="property_type"
                    name="property_type"
                    defaultValue={lease.property_type || ''}
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
                    defaultValue={lease.monthly_rent}
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
                    defaultValue={lease.charges}
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
                    defaultValue={lease.deposit}
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
                    defaultValue={lease.start_date}
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
                    defaultValue={lease.duration_months}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select name="status" defaultValue={lease.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="generated">Généré</SelectItem>
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="signed">Signé</SelectItem>
                    </SelectContent>
                  </Select>
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
                  defaultValue={lease.notes || ''}
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Créé le {formatDate(lease.created_at)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                Enregistrer les modifications
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
