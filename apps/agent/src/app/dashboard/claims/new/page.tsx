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
import { createClaim } from '../actions'

export default async function NewClaimPage() {
  const supabase = await createClient()

  // Fetch contacts for the select
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_name')
    .is('deleted_at', null)
    .order('last_name')

  // Fetch contracts for the select
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_number, product_type')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Default reception date: today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/claims">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Nouvelle réclamation
          </h1>
          <p className="text-muted-foreground">
            Enregistrez une nouvelle réclamation client
          </p>
        </div>
      </div>

      <form action={createClaim}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la réclamation</CardTitle>
            <CardDescription>
              Processus légal en 3 niveaux (10 jours ouvrés par niveau)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact and Contract */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_id">Client *</Label>
                <Select name="contact_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                        {contact.company_name && ` - ${contact.company_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_id">Contrat associé</Label>
                <Select name="contract_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contrat (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts?.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contract_number} - {contract.product_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de la réclamation *</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Ex: Refus de prise en charge sinistre"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décrivez la réclamation en détail..."
                rows={6}
                required
              />
            </div>

            {/* Level and Status */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="level">Niveau *</Label>
                <Select name="level" defaultValue="level_1" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level_1">Niveau 1 (Courtier)</SelectItem>
                    <SelectItem value="level_2">Niveau 2 (Compagnie)</SelectItem>
                    <SelectItem value="level_3">Niveau 3 (Médiation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue="received">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Reçue</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="answered">Répondue</SelectItem>
                    <SelectItem value="escalated">Escaladée</SelectItem>
                    <SelectItem value="closed">Fermée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reception_date">Date de réception *</Label>
                <Input
                  id="reception_date"
                  name="reception_date"
                  type="date"
                  defaultValue={today}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Échéance calculée automatiquement (+10 jours ouvrés)
                </p>
              </div>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">Notes de résolution</Label>
              <Textarea
                id="resolution_notes"
                name="resolution_notes"
                placeholder="Notes sur la résolution de la réclamation..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/claims">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit">Créer la réclamation</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
