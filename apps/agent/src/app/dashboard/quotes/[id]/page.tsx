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
import { ArrowLeft, Calendar, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateQuote, deleteQuote } from '../actions'
import { formatDate } from '@/lib/utils'

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, company_name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!quote) {
    notFound()
  }

  // Fetch all contacts for the select
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_name')
    .is('deleted_at', null)
    .order('last_name')

  const updateQuoteWithId = updateQuote.bind(null, params.id)
  const deleteQuoteWithId = deleteQuote.bind(null, params.id)

  const statusColors = {
    draft: 'secondary',
    sent: 'default',
    viewed: 'warning',
    accepted: 'success',
    rejected: 'destructive',
    expired: 'outline',
  } as const

  const statusLabels = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    viewed: 'Vu',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Devis {quote.quote_number || `#${params.id.substring(0, 8)}`}
              </h1>
              <Badge
                variant={statusColors[quote.status as keyof typeof statusColors]}
              >
                {statusLabels[quote.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {quote.product_category}
              {quote.product_type && ` - ${quote.product_type}`}
            </p>
          </div>
        </div>
        <form action={deleteQuoteWithId}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </form>
      </div>

      {/* Quick Info Card */}
      {quote.contact && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">
                  {quote.contact.first_name} {quote.contact.last_name}
                  {quote.contact.company_name && ` - ${quote.contact.company_name}`}
                </p>
                {quote.contact.email && (
                  <p className="text-sm text-muted-foreground">
                    {quote.contact.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <form action={updateQuoteWithId}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du devis</CardTitle>
            <CardDescription>
              Modifiez les informations du devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Selection */}
            <div className="space-y-2">
              <Label htmlFor="contact_id">Client *</Label>
              <Select name="contact_id" defaultValue={quote.contact_id} required>
                <SelectTrigger>
                  <SelectValue />
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
                <Select
                  name="product_category"
                  defaultValue={quote.product_category}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  defaultValue={quote.product_type || ''}
                />
              </div>
            </div>

            {/* Status and Validity */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue={quote.status}>
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
                  defaultValue={quote.valid_until || ''}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={quote.notes || ''}
                rows={4}
              />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Créé le {formatDate(quote.created_at)}</span>
              </div>
              {quote.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Modifié le {formatDate(quote.updated_at)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/quotes">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit">Enregistrer les modifications</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
