import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Receipt, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

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

export default async function InvoicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch invoices with contact information
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      contact:contacts(first_name, last_name, email)
    `)
    .is('deleted_at', null)
    .order('invoice_date', { ascending: false })
    .limit(50)

  const totalRevenue = invoices?.reduce(
    (sum: number, inv: any) => sum + (inv.payment_status === 'paid' ? inv.amount_ttc : 0),
    0
  ) || 0

  const unpaidAmount = invoices?.reduce(
    (sum: number, inv: any) =>
      sum + (inv.payment_status === 'pending' || inv.payment_status === 'overdue' ? inv.amount_ttc : 0),
    0
  ) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground">
            Gérez vos factures de courtage
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              CA encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              À encaisser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {formatCurrency(unpaidAmount)}
              </div>
              {unpaidAmount > 0 && (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices?.filter((i: any) => i.payment_status === 'overdue').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>
            {invoices?.length || 0} facture(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.contact
                        ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          invoice.payment_status === 'overdue'
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {formatDate(invoice.due_date)}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount_ht)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.amount_ttc)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            invoice.payment_status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            invoice.payment_status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucune facture pour le moment
              </p>
              <Link href="/dashboard/invoices/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre première facture
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
