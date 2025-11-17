'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const documentSchema = z.object({
  contact_id: z.string().uuid().optional().nullable(),
  category: z.enum(['contract', 'invoice', 'claim', 'identity', 'other']),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().min(0),
  is_confidential: z.boolean().default(false),
  expires_at: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('Fichier requis')
  }

  // Get user's tenant
  const { data: userTenant } = await supabase
    .from('user_tenant_roles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!userTenant) {
    throw new Error('Tenant non trouvé')
  }

  const tenantId = userTenant.tenant_id

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${tenantId}/documents/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    throw new Error('Erreur lors du téléversement du fichier')
  }

  // Parse tags if provided
  const tagsString = formData.get('tags') as string
  const tags = tagsString ? tagsString.split(',').map((t) => t.trim()) : []

  const data = {
    contact_id: formData.get('contact_id') || null,
    category: formData.get('category'),
    file_name: file.name,
    file_path: filePath,
    file_type: file.type,
    file_size: file.size,
    is_confidential: formData.get('is_confidential') === 'on',
    expires_at: formData.get('expires_at') || null,
    tags: tags.length > 0 ? tags : null,
    notes: formData.get('notes') || null,
  }

  const validatedData = documentSchema.parse(data)

  const { error } = await supabase.from('documents').insert([validatedData])

  if (error) {
    // Delete uploaded file if DB insert fails
    await supabase.storage.from('documents').remove([filePath])
    console.error('Error creating document:', error)
    throw new Error('Erreur lors de l\'enregistrement du document')
  }

  revalidatePath('/dashboard/documents')
  redirect('/dashboard/documents')
}

export async function updateDocument(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Parse tags if provided
  const tagsString = formData.get('tags') as string
  const tags = tagsString ? tagsString.split(',').map((t) => t.trim()) : []

  const data = {
    contact_id: formData.get('contact_id') || null,
    category: formData.get('category'),
    is_confidential: formData.get('is_confidential') === 'on',
    expires_at: formData.get('expires_at') || null,
    tags: tags.length > 0 ? tags : null,
    notes: formData.get('notes') || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('documents')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating document:', error)
    throw new Error('Erreur lors de la mise à jour du document')
  }

  revalidatePath('/dashboard/documents')
  revalidatePath(`/dashboard/documents/${id}`)
  redirect(`/dashboard/documents/${id}`)
}

export async function deleteDocument(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Get document to find file path
  const { data: document } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single()

  if (document) {
    // Delete file from storage
    await supabase.storage.from('documents').remove([document.file_path])
  }

  // Soft delete document record
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting document:', error)
    throw new Error('Erreur lors de la suppression du document')
  }

  revalidatePath('/dashboard/documents')
  redirect('/dashboard/documents')
}

export async function downloadDocument(filePath: string, fileName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath)

  if (error) {
    console.error('Error downloading file:', error)
    throw new Error('Erreur lors du téléchargement du fichier')
  }

  return data
}
