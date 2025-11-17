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
import { createQuote } from '../actions'

export default async function NewQuotePage() {
  const supabase = await createClient()

  // Fetch contacts for the select
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_name')
    .is('deleted_at', null)
    .order('last_name')

  // Default valid until: 30 days from now
  const defaultValidUntil = new Date()
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
  const validUntilString = defaultValidUntil.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau devis</h1>
          <p className="text-muted-foreground">
            Créez un nouveau devis d'assurance
          </p>
        </div>
      </div>

      <form action={createQuote}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du devis</CardTitle>
            <CardDescription>
              Renseignez les informations du devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Selection */}
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

            {/* Product Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_category">Catégorie de produit *</Label>
                <Select name="product_category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automobile</SelectItem>
                    <SelectItem value="habitation">Habitation</SelectItem>
                    <SelectItem value="sante">Santé</SelectItem>
                    <SelectItem value="prevoyance">Prévoyance</SelectItem>
                    <SelectItem value="pro">Professionnel</SelectItem>
                    <SelectItem value="epargne">Épargne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_type">Type de produit</Label>
                <Input
                  id="product_type"
                  name="product_type"
                  placeholder="Ex: Tous risques, MRH, etc."
                />
              </div>
            </div>

            {/* Status and Validity */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="sent">Envoyé</SelectItem>
                    <SelectItem value="viewed">Vu</SelectItem>
                    <SelectItem value="accepted">Accepté</SelectItem>
                    <SelectItem value="rejected">Refusé</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valide jusqu'au</Label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  defaultValue={validUntilString}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notes internes sur le devis..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/quotes">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit">Créer le devis</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
