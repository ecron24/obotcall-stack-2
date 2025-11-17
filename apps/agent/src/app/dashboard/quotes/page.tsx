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
import { Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

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

export default async function QuotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch quotes with contact information
  const { data: quotes } = await supabase
    .from('quotes')
    .select(`
      *,
      contact:contacts(first_name, last_name, email)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devis</h1>
          <p className="text-muted-foreground">
            Gérez vos devis d'assurance
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total devis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes?.filter((q) => q.status === 'sent' || q.status === 'viewed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Acceptés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes?.filter((q) => q.status === 'accepted').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes && quotes.length > 0
                ? Math.round(
                    (quotes.filter((q) => q.status === 'accepted').length /
                      quotes.length) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des devis</CardTitle>
          <CardDescription>
            {quotes?.length || 0} devis au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotes && quotes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devis</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Valide jusqu'au</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote: any) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.quote_number || '-'}
                    </TableCell>
                    <TableCell>
                      {quote.contact
                        ? `${quote.contact.first_name} ${quote.contact.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{quote.product_category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            quote.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            quote.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(quote.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/quotes/${quote.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
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
              <p className="text-muted-foreground">
                Aucun devis pour le moment
              </p>
              <Link href="/dashboard/quotes/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre premier devis
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
