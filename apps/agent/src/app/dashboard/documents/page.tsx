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
import { Upload, File, FileText, Image, AlertCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

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

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <Image className="h-4 w-4" />
  }
  if (fileType.includes('pdf')) {
    return <FileText className="h-4 w-4" />
  }
  return <File className="h-4 w-4" />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default async function DocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch documents with contact information
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      contact:contacts(first_name, last_name, email)
    `)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })
    .limit(50)

  // Count documents expiring soon (within 30 days)
  const today = new Date()
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)

  const expiringSoon = documents?.filter((d: any) => {
    if (!d.expires_at) return false
    const expiryDate = new Date(d.expires_at)
    return expiryDate >= today && expiryDate <= in30Days
  })

  // Count by category
  const contractDocs = documents?.filter((d: any) => d.category === 'contract').length || 0
  const invoiceDocs = documents?.filter((d: any) => d.category === 'invoice').length || 0
  const claimDocs = documents?.filter((d: any) => d.category === 'claim').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Gérez vos documents et pièces jointes
          </p>
        </div>
        <Link href="/dashboard/documents/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Téléverser un document
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Contrats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractDocs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceDocs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Expirent bientôt (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {expiringSoon?.length || 0}
              </div>
              {expiringSoon && expiringSoon.length > 0 && (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des documents</CardTitle>
          <CardDescription>
            {documents?.length || 0} document(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Associé à</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d'upload</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => {
                  const isExpiringSoon =
                    doc.expires_at &&
                    new Date(doc.expires_at) >= today &&
                    new Date(doc.expires_at) <= in30Days
                  const isExpired =
                    doc.expires_at && new Date(doc.expires_at) < today

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.file_type)}
                          <div className="flex flex-col">
                            <span className="text-sm">{doc.file_name}</span>
                            {doc.is_confidential && (
                              <Badge variant="destructive" className="w-fit text-xs">
                                Confidentiel
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            categoryColors[
                              doc.category as keyof typeof categoryColors
                            ]
                          }
                        >
                          {
                            categoryLabels[
                              doc.category as keyof typeof categoryLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags?.slice(0, 2).map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.contact
                          ? `${doc.contact.first_name} ${doc.contact.last_name}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                      <TableCell>
                        {doc.expires_at ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                isExpired
                                  ? 'text-destructive font-medium'
                                  : isExpiringSoon
                                  ? 'text-yellow-600 font-medium'
                                  : ''
                              }
                            >
                              {formatDate(doc.expires_at)}
                            </span>
                            {(isExpired || isExpiringSoon) && (
                              <AlertCircle
                                className={`h-4 w-4 ${
                                  isExpired ? 'text-destructive' : 'text-yellow-600'
                                }`}
                              />
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Link href={`/dashboard/documents/${doc.id}`}>
                            <Button variant="ghost" size="sm">
                              Voir
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <File className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucun document pour le moment
              </p>
              <Link href="/dashboard/documents/upload">
                <Button className="mt-4" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Téléverser votre premier document
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
