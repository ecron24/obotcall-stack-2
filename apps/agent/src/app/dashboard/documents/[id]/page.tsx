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
import { ArrowLeft, Calendar, Trash2, Download, File, FileText, Image, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateDocument, deleteDocument } from '../actions'
import { formatDate } from '@/lib/utils'

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <Image className="h-8 w-8" />
  }
  if (fileType.includes('pdf')) {
    return <FileText className="h-8 w-8" />
  }
  return <File className="h-8 w-8" />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default async function DocumentDetailPage({
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

  const { data: document } = await supabase
    .from('documents')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, company_name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!document) {
    notFound()
  }

  // Fetch all contacts for the select
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_name')
    .is('deleted_at', null)
    .order('last_name')

  // Get signed URL for download
  const { data: signedUrlData } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 3600) // 1 hour expiry

  const updateDocumentWithId = updateDocument.bind(null, params.id)
  const deleteDocumentWithId = deleteDocument.bind(null, params.id)

  const categoryColors = {
    contract: 'default',
    invoice: 'secondary',
    claim: 'warning',
    identity: 'success',
    other: 'outline',
  } as const

  const categoryLabels = {
    contract: 'Contrat',
    invoice: 'Facture',
    claim: 'Réclamation',
    identity: 'Identité',
    other: 'Autre',
  } as const

  const today = new Date()
  const isExpired = document.expires_at && new Date(document.expires_at) < today
  const isExpiringSoon =
    document.expires_at &&
    !isExpired &&
    new Date(document.expires_at) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {document.file_name}
              </h1>
              <Badge
                variant={categoryColors[document.category as keyof typeof categoryColors]}
              >
                {categoryLabels[document.category as keyof typeof categoryLabels]}
              </Badge>
              {document.is_confidential && (
                <Badge variant="destructive">Confidentiel</Badge>
              )}
              {isExpired && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Expiré
                </Badge>
              )}
              {isExpiringSoon && (
                <Badge variant="warning">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Expire bientôt
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {formatFileSize(document.file_size)} • {document.file_type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {signedUrlData?.signedUrl && (
            <a href={signedUrlData.signedUrl} download={document.file_name}>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </a>
          )}
          <form action={deleteDocumentWithId}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </form>
        </div>
      </div>

      {/* File Preview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              {getFileIcon(document.file_type)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{document.file_name}</p>
              <p className="text-sm text-muted-foreground">
                Téléversé le {formatDate(document.uploaded_at)}
              </p>
              {document.contact && (
                <p className="text-sm text-muted-foreground">
                  Contact : {document.contact.first_name} {document.contact.last_name}
                </p>
              )}
            </div>
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form action={updateDocumentWithId}>
        <Card>
          <CardHeader>
            <CardTitle>Métadonnées du document</CardTitle>
            <CardDescription>
              Modifiez les informations du document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category and Contact */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select name="category" defaultValue={document.category} required>
                  <SelectTrigger>
                    <SelectValue />
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
                <Select
                  name="contact_id"
                  defaultValue={document.contact_id || undefined}
                >
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
                    defaultChecked={document.is_confidential}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_confidential" className="cursor-pointer">
                    Document confidentiel
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Date d'expiration</Label>
                <Input
                  id="expires_at"
                  name="expires_at"
                  type="date"
                  defaultValue={document.expires_at || ''}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={document.tags?.join(', ') || ''}
                placeholder="Séparés par des virgules"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={document.notes || ''}
                rows={4}
              />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Téléversé le {formatDate(document.uploaded_at)}</span>
              </div>
              {document.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Modifié le {formatDate(document.updated_at)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/documents">
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
