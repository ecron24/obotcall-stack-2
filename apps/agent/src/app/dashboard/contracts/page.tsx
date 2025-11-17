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
import { FileCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

const statusColors = {
  active: 'success',
  expired: 'destructive',
  cancelled: 'outline',
  replaced: 'secondary',
} as const

const statusLabels = {
  active: 'Actif',
  expired: 'Expiré',
  cancelled: 'Annulé',
  replaced: 'Remplacé',
} as const

export default async function ContractsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch contracts with contact and company information
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      *,
      contact:contacts(first_name, last_name, email),
      company:companies(name, logo_url)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Count contracts needing renewal (within 30 days)
  const today = new Date()
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)

  const upcomingRenewals = contracts?.filter((c: any) => {
    if (!c.renewal_date || c.status !== 'active') return false
    const renewalDate = new Date(c.renewal_date)
    return renewalDate >= today && renewalDate <= in30Days
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrats</h1>
          <p className="text-muted-foreground">
            Gérez vos contrats d'assurance
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total contrats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts?.filter((c: any) => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              À renouveler (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {upcomingRenewals?.length || 0}
              </div>
              {upcomingRenewals && upcomingRenewals.length > 0 && (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Commission totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                contracts?.reduce(
                  (sum: number, c: any) => sum + (c.commission_amount || 0),
                  0
                ) || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des contrats</CardTitle>
          <CardDescription>
            {contracts?.length || 0} contrat(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Contrat</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Compagnie</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prime annuelle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Renouvellement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.contract_number}
                    </TableCell>
                    <TableCell>
                      {contract.contact
                        ? `${contract.contact.first_name} ${contract.contact.last_name}`
                        : '-'}
                    </TableCell>
                    <TableCell>{contract.company?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contract.product_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(contract.annual_premium)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            contract.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            contract.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.renewal_date
                        ? formatDate(contract.renewal_date)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/contracts/${contract.id}`}>
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
              <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucun contrat pour le moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
