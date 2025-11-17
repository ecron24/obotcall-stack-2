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
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateTemplate, deleteTemplate } from '../actions'
import { notFound } from 'next/navigation'

export default async function TemplateDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!template) {
    notFound()
  }

  const updateTemplateWithId = updateTemplate.bind(null, params.id)
  const deleteTemplateWithId = deleteTemplate.bind(null, params.id)

  const dynamicFieldsString = template.dynamic_fields?.join(', ') || ''
  const mandatoryClausesString = template.mandatory_clauses?.join('\n') || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
            <p className="text-muted-foreground">
              Modifiez les détails du template
            </p>
          </div>
        </div>
        <form action={deleteTemplateWithId}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Pays</div>
            <div className="mt-2">
              <Badge variant="outline">{template.country}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Langue</div>
            <div className="mt-2">
              <Badge variant="outline">{template.language}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Type de bail</div>
            <div className="mt-2">
              <Badge variant="outline">
                {template.lease_type === 'residential' && 'Résidentiel'}
                {template.lease_type === 'commercial' && 'Commercial'}
                {template.lease_type === 'mixed' && 'Mixte'}
                {template.lease_type === 'seasonal' && 'Saisonnier'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Statut</div>
            <div className="mt-2">
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <form action={updateTemplateWithId}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du template *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={template.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays *</Label>
                  <Select name="country" defaultValue={template.country} required>
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue *</Label>
                  <Input
                    id="language"
                    name="language"
                    defaultValue={template.language}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lease_type">Type de bail *</Label>
                  <Select name="lease_type" defaultValue={template.lease_type} required>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenu du template</CardTitle>
              <CardDescription>
                Utilisez {{`{field_name}`}} pour les champs dynamiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Contenu *</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={15}
                  defaultValue={template.content}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dynamic_fields">Champs dynamiques (séparés par virgule)</Label>
                <Input
                  id="dynamic_fields"
                  name="dynamic_fields"
                  defaultValue={dynamicFieldsString}
                  placeholder="landlord_name, tenant_name, property_address, monthly_rent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mandatory_clauses">Clauses obligatoires (une par ligne)</Label>
                <Textarea
                  id="mandatory_clauses"
                  name="mandatory_clauses"
                  rows={6}
                  defaultValue={mandatoryClausesString}
                  placeholder="Clause 1: Durée du bail...&#10;Clause 2: Montant du loyer..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  defaultChecked={template.is_active}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Template actif
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={template.notes || ''}
                  placeholder="Notes sur ce template..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/templates">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit">Enregistrer les modifications</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
