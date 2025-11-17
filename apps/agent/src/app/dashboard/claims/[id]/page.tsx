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
import { ArrowLeft, Calendar, Trash2, User, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateClaim, deleteClaim } from '../actions'
import { formatDate } from '@/lib/utils'

export default async function ClaimDetailPage({
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

  const { data: claim } = await supabase
    .from('claims')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, company_name),
      contract:contracts(id, contract_number, product_type)
    `)
    .eq('id', params.id)
    .single()

  if (!claim) {
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

  const updateClaimWithId = updateClaim.bind(null, params.id)
  const deleteClaimWithId = deleteClaim.bind(null, params.id)

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

  // Check if urgent
  const today = new Date()
  const deadline = new Date(claim.deadline)
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  const isUrgent =
    (claim.status === 'received' || claim.status === 'in_progress') &&
    daysUntilDeadline <= 3 &&
    daysUntilDeadline >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/claims">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Réclamation {claim.claim_number}
              </h1>
              <Badge
                variant={statusColors[claim.status as keyof typeof statusColors]}
              >
                {statusLabels[claim.status as keyof typeof statusLabels]}
              </Badge>
              <Badge variant="outline">
                {levelLabels[claim.level as keyof typeof levelLabels]}
              </Badge>
              {isUrgent && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Urgent ({daysUntilDeadline}j restants)
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{claim.subject}</p>
          </div>
        </div>
        <form action={deleteClaimWithId}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </form>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {claim.contact && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {claim.contact.first_name} {claim.contact.last_name}
                  </p>
                  {claim.contact.company_name && (
                    <p className="text-sm text-muted-foreground">
                      {claim.contact.company_name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {claim.contract && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contrat</p>
                  <p className="font-medium">{claim.contract.contract_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {claim.contract.product_type}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Échéance</p>
                <p
                  className={`font-medium ${
                    isUrgent ? 'text-destructive' : ''
                  }`}
                >
                  {formatDate(claim.deadline)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {daysUntilDeadline > 0
                    ? `${daysUntilDeadline} jours restants`
                    : daysUntilDeadline === 0
                    ? "Aujourd'hui"
                    : 'Dépassée'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <form action={updateClaimWithId}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la réclamation</CardTitle>
            <CardDescription>
              Modifiez les informations de la réclamation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact and Contract */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_id">Client *</Label>
                <Select name="contact_id" defaultValue={claim.contact_id} required>
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
                  defaultValue={claim.contract_id || undefined}
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

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de la réclamation *</Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={claim.subject}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée *</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={claim.description}
                rows={6}
                required
              />
            </div>

            {/* Level, Status, and Dates */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="level">Niveau *</Label>
                <Select name="level" defaultValue={claim.level} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level_1">Niveau 1 (Courtier)</SelectItem>
                    <SelectItem value="level_2">Niveau 2 (Compagnie)</SelectItem>
                    <SelectItem value="level_3">Niveau 3 (Médiation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue={claim.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Reçue</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="answered">Répondue</SelectItem>
                    <SelectItem value="escalated">Escaladée</SelectItem>
                    <SelectItem value="closed">Fermée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reception_date">Date de réception *</Label>
                <Input
                  id="reception_date"
                  name="reception_date"
                  type="date"
                  defaultValue={claim.reception_date}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Échéance *</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={claim.deadline}
                required
              />
            </div>

            {/* Resolution Notes */}
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">Notes de résolution</Label>
              <Textarea
                id="resolution_notes"
                name="resolution_notes"
                defaultValue={claim.resolution_notes || ''}
                rows={4}
              />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Créé le {formatDate(claim.created_at)}</span>
              </div>
              {claim.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Modifié le {formatDate(claim.updated_at)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/claims">
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
