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
import { ArrowLeft, Calendar, Trash2, User, DollarSign, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateInvoice, deleteInvoice } from '../actions'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function InvoiceDetailPage({
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

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, company_name),
      contract:contracts(id, contract_number, product_type)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!invoice) {
    notFound()
  }

  // Fetch all contacts and contracts for selects
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_name')
    .is('deleted_at', null)
    .order('last_name')

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_number, product_type')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const updateInvoiceWithId = updateInvoice.bind(null, params.id)
  const deleteInvoiceWithId = deleteInvoice.bind(null, params.id)

  const statusColors = {
    pending: 'warning',
    paid: 'success',
    overdue: 'destructive',
    cancelled: 'outline',
  } as const

  const statusLabels = {
    pending: 'En attente',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  } as const

  const isOverdue = invoice.payment_status !== 'paid' && new Date(invoice.due_date) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Facture {invoice.invoice_number}
              </h1>
              <Badge
                variant={statusColors[invoice.payment_status as keyof typeof statusColors]}
              >
                {statusLabels[invoice.payment_status as keyof typeof statusLabels]}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  En retard
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Échéance : {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>
        <form action={deleteInvoiceWithId}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </form>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {invoice.contact && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {invoice.contact.first_name} {invoice.contact.last_name}
                  </p>
                  {invoice.contact.company_name && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.contact.company_name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Montant TTC</p>
                <p className="font-medium text-2xl">
                  {formatCurrency(invoice.amount_ttc)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date de paiement</p>
                <p className="font-medium">
                  {invoice.payment_date ? formatDate(invoice.payment_date) : 'Non payée'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <form action={updateInvoiceWithId}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la facture</CardTitle>
            <CardDescription>
              Modifiez les informations de la facture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact and Contract */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_id">Client *</Label>
                <Select name="contact_id" defaultValue={invoice.contact_id} required>
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
              <div className="space-y-2">
                <Label htmlFor="contract_id">Contrat associé</Label>
                <Select
                  name="contract_id"
                  defaultValue={invoice.contract_id || undefined}
                >
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

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Date de facture *</Label>
                <Input
                  id="invoice_date"
                  name="invoice_date"
                  type="date"
                  defaultValue={invoice.invoice_date}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Date d'échéance *</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={invoice.due_date}
                  required
                />
              </div>
            </div>

            {/* Amounts */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount_ht">Montant HT * (€)</Label>
                <Input
                  id="amount_ht"
                  name="amount_ht"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={invoice.amount_ht}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_rate">Taux TVA (%)</Label>
                <Input
                  id="vat_rate"
                  name="vat_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={invoice.vat_rate}
                />
              </div>
              <div className="space-y-2">
                <Label>Montant TTC actuel</Label>
                <Input
                  disabled
                  value={formatCurrency(invoice.amount_ttc)}
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="payment_status">Statut de paiement</Label>
                <Select name="payment_status" defaultValue={invoice.payment_status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Date de paiement</Label>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  defaultValue={invoice.payment_date || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Moyen de paiement</Label>
                <Select
                  name="payment_method"
                  defaultValue={invoice.payment_method || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virement">Virement bancaire</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="carte">Carte bancaire</SelectItem>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="prelevement">Prélèvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={invoice.notes || ''}
                rows={4}
              />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Créé le {formatDate(invoice.created_at)}</span>
              </div>
              {invoice.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Modifié le {formatDate(invoice.updated_at)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/invoices">
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
