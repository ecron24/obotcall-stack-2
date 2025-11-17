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
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { uploadDocument } from '../actions'

export default async function UploadDocumentPage() {
  const supabase = await createClient()

  // Fetch contacts for the select
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_name')
    .is('deleted_at', null)
    .order('last_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Téléverser un document
          </h1>
          <p className="text-muted-foreground">
            Ajoutez un nouveau document à votre bibliothèque
          </p>
        </div>
      </div>

      <form action={uploadDocument} encType="multipart/form-data">
        <Card>
          <CardHeader>
            <CardTitle>Informations du document</CardTitle>
            <CardDescription>
              Sélectionnez un fichier et renseignez les métadonnées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Fichier *</Label>
              <Input
                id="file"
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PDF, Word, Excel, Images (max 10 Mo)
              </p>
            </div>

            {/* Category and Contact */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contrat</SelectItem>
                    <SelectItem value="invoice">Facture</SelectItem>
                    <SelectItem value="claim">Réclamation</SelectItem>
                    <SelectItem value="identity">Identité</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_id">Contact associé</Label>
                <Select name="contact_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact (optionnel)" />
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
            </div>

            {/* Confidential and Expiry */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_confidential"
                    name="is_confidential"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_confidential" className="cursor-pointer">
                    Document confidentiel
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les documents confidentiels sont marqués avec un badge rouge
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Date d'expiration</Label>
                <Input
                  id="expires_at"
                  name="expires_at"
                  type="date"
                />
                <p className="text-xs text-muted-foreground">
                  Pour les documents avec date de validité (ex: carte d'identité)
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="Séparés par des virgules (ex: important, urgent, à signer)"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notes internes sur le document..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/documents">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit">
                <Upload className="mr-2 h-4 w-4" />
                Téléverser le document
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
