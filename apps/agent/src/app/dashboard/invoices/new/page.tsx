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
import { createInvoice } from '../actions'

export default async function NewInvoicePage() {
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
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Default dates
  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)
  const dueDateString = dueDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle facture</h1>
          <p className="text-muted-foreground">
            Créez une nouvelle facture de courtage
          </p>
        </div>
      </div>

      <form action={createInvoice}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la facture</CardTitle>
            <CardDescription>
              Renseignez les informations de facturation
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

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Date de facture *</Label>
                <Input
                  id="invoice_date"
                  name="invoice_date"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Date d'échéance *</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={dueDateString}
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
                  placeholder="0.00"
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
                  defaultValue="20"
                />
              </div>
              <div className="space-y-2">
                <Label>Montant TTC (calculé auto)</Label>
                <Input
                  disabled
                  placeholder="Calculé automatiquement"
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="payment_status">Statut de paiement</Label>
                <Select name="payment_status" defaultValue="pending">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Moyen de paiement</Label>
                <Select name="payment_method">
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
                placeholder="Notes internes sur la facture..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/invoices">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit">Créer la facture</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
