import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Building2, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function ContractDetailPage({
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

  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, company_name, mobile_phone),
      company:companies(id, name, logo_url, type)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!contract) {
    notFound()
  }

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

  // Check if renewal is upcoming
  const today = new Date()
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)

  const needsRenewal = contract.renewal_date && contract.status === 'active'
    ? new Date(contract.renewal_date) >= today && new Date(contract.renewal_date) <= in30Days
    : false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contracts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Contrat {contract.contract_number}
              </h1>
              <Badge
                variant={statusColors[contract.status as keyof typeof statusColors]}
              >
                {statusLabels[contract.status as keyof typeof statusLabels]}
              </Badge>
              {needsRenewal && (
                <Badge variant="warning">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  À renouveler
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{contract.product_type}</p>
          </div>
        </div>
      </div>

      {/* Client and Company Info */}
      <div className="grid gap-4 md:grid-cols-2">
        {contract.contact && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">
                  {contract.contact.first_name} {contract.contact.last_name}
                </p>
              </div>
              {contract.contact.company_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{contract.contact.company_name}</p>
                </div>
              )}
              {contract.contact.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contract.contact.email}</p>
                </div>
              )}
              {contract.contact.mobile_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{contract.contact.mobile_phone}</p>
                </div>
              )}
              <Link href={`/dashboard/contacts/${contract.contact.id}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  Voir le contact
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {contract.company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Compagnie d'assurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{contract.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{contract.company.type}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détails du contrat
          </CardTitle>
          <CardDescription>
            Informations complètes du contrat d'assurance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">N° de contrat</p>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">N° de police</p>
              <p className="font-medium">{contract.policy_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type de produit</p>
              <p className="font-medium">{contract.product_type}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Date de début</p>
              <p className="font-medium">
                {contract.start_date ? formatDate(contract.start_date) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de fin</p>
              <p className="font-medium">
                {contract.end_date ? formatDate(contract.end_date) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de renouvellement</p>
              <p className={`font-medium ${needsRenewal ? 'text-yellow-600' : ''}`}>
                {contract.renewal_date ? formatDate(contract.renewal_date) : '-'}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Informations financières
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Prime annuelle</p>
                <p className="font-medium text-lg">
                  {formatCurrency(contract.annual_premium)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de commission</p>
                <p className="font-medium">
                  {contract.commission_rate ? `${contract.commission_rate}%` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant de commission</p>
                <p className="font-medium text-lg text-green-600">
                  {contract.commission_amount
                    ? formatCurrency(contract.commission_amount)
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {contract.coverage_details && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Détails de couverture</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {contract.coverage_details}
              </p>
            </div>
          )}

          {contract.notes && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {contract.notes}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Créé le {formatDate(contract.created_at)}</span>
            </div>
            {contract.updated_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Modifié le {formatDate(contract.updated_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link href="/dashboard/contracts">
          <Button variant="outline">Retour à la liste</Button>
        </Link>
      </div>
    </div>
  )
}
