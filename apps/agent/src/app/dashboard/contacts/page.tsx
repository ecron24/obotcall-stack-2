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
import { Plus, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatPhoneNumber } from '@/lib/utils'

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

export default async function ContactsPage() {
  const supabase = await createClient()

  // Get current user's tenants
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch contacts
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Gérez vos prospects et clients
          </p>
        </div>
        <Link href="/dashboard/contacts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contact
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des contacts</CardTitle>
          <CardDescription>
            {contacts?.length || 0} contact(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.title && `${contact.title}. `}
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contact.contact_type === 'individual'
                          ? 'Particulier'
                          : 'Professionnel'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            contact.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            contact.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {contact.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.mobile_phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {formatPhoneNumber(contact.mobile_phone)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contact.city || '-'}</TableCell>
                    <TableCell>{formatDate(contact.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/contacts/${contact.id}`}>
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
              <p className="text-muted-foreground">
                Aucun contact pour le moment
              </p>
              <Link href="/dashboard/contacts/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer votre premier contact
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
