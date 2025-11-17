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
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const statusColors = {
  draft: 'secondary',
  generated: 'success',
  sent: 'default',
  signed: 'success',
} as const

const statusLabels = {
  draft: 'Brouillon',
  generated: 'Généré',
  sent: 'Envoyé',
  signed: 'Signé',
} as const

export default async function LeasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: leases } = await supabase
    .from('leases')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Baux</h1>
          <p className="text-muted-foreground">
            Gérez et générez vos baux immobiliers
          </p>
        </div>
        <Link href="/dashboard/leases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Générer un bail
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des baux</CardTitle>
          <CardDescription>
            {leases?.length || 0} bail(x) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leases && leases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Bail</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease: any) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">
                      {lease.lease_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lease.lease_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {lease.tenant_name || '-'}
                    </TableCell>
                    <TableCell>{lease.country}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[lease.status as keyof typeof statusColors]}>
                        {statusLabels[lease.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(lease.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/leases/${lease.id}`}>
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
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucun bail pour le moment
              </p>
              <Link href="/dashboard/leases/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Générer votre premier bail
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
