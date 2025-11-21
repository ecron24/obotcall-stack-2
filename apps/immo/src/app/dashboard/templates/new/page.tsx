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
import { createTemplate } from '../actions'

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau template</h1>
          <p className="text-muted-foreground">
            Créez un nouveau modèle de bail personnalisé
          </p>
        </div>
      </div>

      <form action={createTemplate}>
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
                    placeholder="Bail résidentiel France"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays *</Label>
                  <Select name="country" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
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
                    placeholder="fr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lease_type">Type de bail *</Label>
                  <Select name="lease_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
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
                Utilisez {'{field_name}'} pour les champs dynamiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Contenu *</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={15}
                  placeholder="CONTRAT DE LOCATION\n\nEntre les soussignés:\n{landlord_name}, propriétaire...\n\nEt {tenant_name}, locataire..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dynamic_fields">Champs dynamiques (séparés par virgule)</Label>
                <Input
                  id="dynamic_fields"
                  name="dynamic_fields"
                  placeholder="landlord_name, tenant_name, property_address, monthly_rent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mandatory_clauses">Clauses obligatoires (une par ligne)</Label>
                <Textarea
                  id="mandatory_clauses"
                  name="mandatory_clauses"
                  rows={6}
                  placeholder="Clause 1: Durée du bail...&#10;Clause 2: Montant du loyer..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  defaultChecked
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
            <Button type="submit">Créer le template</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
