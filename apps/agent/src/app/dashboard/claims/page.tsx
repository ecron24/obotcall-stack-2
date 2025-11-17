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
import { Plus, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const statusColors = {
  received: 'secondary',
  in_progress: 'default',
  answered: 'success',
  escalated: 'warning',
  closed: 'outline',
} as const

const statusLabels = {
  received: 'Reçue',
  in_progress: 'En cours',
  answered: 'Répondue',
  escalated: 'Escaladée',
  closed: 'Fermée',
} as const

const levelLabels = {
  level_1: 'Niveau 1 (Courtier)',
  level_2: 'Niveau 2 (Compagnie)',
  level_3: 'Niveau 3 (Médiation)',
} as const

export default async function ClaimsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch claims with contact information
  const { data: claims } = await supabase
    .from('claims')
    .select(`
      *,
      contact:contacts(first_name, last_name, email)
    `)
    .order('reception_date', { ascending: false })
    .limit(50)

  // Count urgent claims (deadline soon)
  const today = new Date()
  const urgentClaims = claims?.filter((c: any) => {
    if (c.status === 'closed' || c.status === 'answered') return false
    const deadline = new Date(c.deadline)
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Réclamations</h1>
          <p className="text-muted-foreground">
            Gérez les réclamations clients (processus légal 3 niveaux)
          </p>
        </div>
        <Link href="/dashboard/claims/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle réclamation
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total réclamations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims?.filter(
                (c: any) =>
                  c.status === 'received' || c.status === 'in_progress'
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Urgentes (&lt; 3j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {urgentClaims?.length || 0}
              </div>
              {urgentClaims && urgentClaims.length > 0 && (
                <Clock className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taux de résolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims && claims.length > 0
                ? Math.round(
                    (claims.filter(
                      (c: any) => c.status === 'answered' || c.status === 'closed'
                    ).length /
                      claims.length) *
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
          <CardTitle>Liste des réclamations</CardTitle>
          <CardDescription>
            {claims?.length || 0} réclamation(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claims && claims.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Réclamation</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date réception</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim: any) => {
                  const deadline = new Date(claim.deadline)
                  const today = new Date()
                  const isUrgent =
                    (claim.status === 'received' ||
                      claim.status === 'in_progress') &&
                    deadline <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

                  return (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">
                        {claim.claim_number}
                      </TableCell>
                      <TableCell>
                        {claim.contact
                          ? `${claim.contact.first_name} ${claim.contact.last_name}`
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {claim.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {levelLabels[claim.level as keyof typeof levelLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[
                              claim.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {
                            statusLabels[
                              claim.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(claim.reception_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={isUrgent ? 'text-destructive font-medium' : ''}
                          >
                            {formatDate(claim.deadline)}
                          </span>
                          {isUrgent && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/claims/${claim.id}`}>
                          <Button variant="ghost" size="sm">
                            Voir
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucune réclamation pour le moment
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Les réclamations doivent être traitées sous 10 jours ouvrés
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
