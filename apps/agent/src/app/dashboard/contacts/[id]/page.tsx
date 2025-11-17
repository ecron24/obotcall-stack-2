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
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateContact, deleteContact } from '../actions'
import { formatDate } from '@/lib/utils'

export default async function ContactDetailPage({
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

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!contact) {
    notFound()
  }

  const updateContactWithId = updateContact.bind(null, params.id)
  const deleteContactWithId = deleteContact.bind(null, params.id)

  const statusColors = {
    prospect: 'default',
    client: 'success',
    inactive: 'secondary',
    archived: 'outline',
  } as const

  const statusLabels = {
    prospect: 'Prospect',
    client: 'Client',
    inactive: 'Inactif',
    archived: 'Archivé',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contacts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {contact.title && `${contact.title}. `}
                {contact.first_name} {contact.last_name}
              </h1>
              <Badge
                variant={
                  statusColors[contact.status as keyof typeof statusColors]
                }
              >
                {statusLabels[contact.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {contact.contact_type === 'individual'
                ? 'Particulier'
                : 'Professionnel'}
              {contact.company_name && ` - ${contact.company_name}`}
            </p>
          </div>
        </div>
        <form action={deleteContactWithId}>
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </form>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {contact.email && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contact.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {contact.mobile_phone && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{contact.mobile_phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {contact.city && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ville</p>
                  <p className="font-medium">{contact.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Form */}
      <form action={updateContactWithId}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du contact</CardTitle>
            <CardDescription>
              Modifiez les informations du contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Type */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_type">Type de contact *</Label>
                <Select
                  name="contact_type"
                  defaultValue={contact.contact_type}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Particulier</SelectItem>
                    <SelectItem value="professional">Professionnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select name="status" defaultValue={contact.status} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Identity */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="title">Civilité</Label>
                <Select name="title" defaultValue={contact.title || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Mlle">Mlle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={contact.first_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={contact.last_name}
                  required
                />
              </div>
            </div>

            {/* Professional Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Entreprise</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={contact.company_name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  name="siret"
                  defaultValue={contact.siret || ''}
                  maxLength={14}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={contact.email || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_phone">Téléphone mobile</Label>
                <Input
                  id="mobile_phone"
                  name="mobile_phone"
                  type="tel"
                  defaultValue={contact.mobile_phone || ''}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="home_phone">Téléphone fixe</Label>
                <Input
                  id="home_phone"
                  name="home_phone"
                  type="tel"
                  defaultValue={contact.home_phone || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_phone">Téléphone professionnel</Label>
                <Input
                  id="work_phone"
                  name="work_phone"
                  type="tel"
                  defaultValue={contact.work_phone || ''}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                defaultValue={contact.address || ''}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  defaultValue={contact.postal_code || ''}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={contact.city || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={contact.country || 'France'}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={contact.birth_date || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_contact_method">
                  Méthode de contact préférée
                </Label>
                <Select
                  name="preferred_contact_method"
                  defaultValue={contact.preferred_contact_method || undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Téléphone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={contact.tags?.join(', ') || ''}
                placeholder="Séparés par des virgules"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={contact.notes || ''}
                rows={4}
              />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Créé le {formatDate(contact.created_at)}</span>
              </div>
              {contact.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Modifié le {formatDate(contact.updated_at)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/contacts">
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
