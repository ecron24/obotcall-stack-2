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
import { createContact } from '../actions'

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau contact</h1>
          <p className="text-muted-foreground">
            Créez un nouveau prospect ou client
          </p>
        </div>
      </div>

      <form action={createContact}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du contact</CardTitle>
            <CardDescription>
              Renseignez les informations du contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Type */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_type">Type de contact *</Label>
                <Select name="contact_type" defaultValue="individual" required>
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
                <Select name="status" defaultValue="prospect" required>
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
                <Select name="title">
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
                  placeholder="Jean"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Dupont"
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
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  name="siret"
                  placeholder="12345678901234"
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
                  placeholder="jean.dupont@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_phone">Téléphone mobile</Label>
                <Input
                  id="mobile_phone"
                  name="mobile_phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
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
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_phone">Téléphone professionnel</Label>
                <Input
                  id="work_phone"
                  name="work_phone"
                  type="tel"
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 rue de la Paix"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  placeholder="75001"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" name="city" placeholder="Paris" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="France"
                  defaultValue="France"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input id="birth_date" name="birth_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_contact_method">
                  Méthode de contact préférée
                </Label>
                <Select name="preferred_contact_method">
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
                placeholder="Séparés par des virgules (ex: VIP, Recommandation)"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notes internes sur le contact..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/contacts">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit">Créer le contact</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
