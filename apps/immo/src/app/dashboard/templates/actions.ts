'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const templateSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  country: z.enum(['FR', 'BE', 'LU', 'CH', 'DE', 'ES', 'IT', 'PT']),
  language: z.string().min(2),
  lease_type: z.enum(['residential', 'commercial', 'mixed', 'seasonal']),
  content: z.string().min(1, 'Contenu requis'),
  dynamic_fields: z.array(z.string()).optional(),
  mandatory_clauses: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
})

export async function createTemplate(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Parse arrays
  const dynamicFieldsString = formData.get('dynamic_fields') as string
  const dynamicFields = dynamicFieldsString ? dynamicFieldsString.split(',').map(f => f.trim()) : []

  const mandatoryClausesString = formData.get('mandatory_clauses') as string
  const mandatoryClauses = mandatoryClausesString ? mandatoryClausesString.split('\n').filter(c => c.trim()) : []

  const data = {
    name: formData.get('name'),
    country: formData.get('country'),
    language: formData.get('language'),
    lease_type: formData.get('lease_type'),
    content: formData.get('content'),
    dynamic_fields: dynamicFields.length > 0 ? dynamicFields : null,
    mandatory_clauses: mandatoryClauses.length > 0 ? mandatoryClauses : null,
    is_active: formData.get('is_active') === 'on',
    notes: formData.get('notes') || null,
  }

  const validatedData = templateSchema.parse(data)

  const { error } = await supabase.from('templates').insert([validatedData])

  if (error) {
    console.error('Error creating template:', error)
    throw new Error('Erreur lors de la création du template')
  }

  revalidatePath('/dashboard/templates')
  redirect('/dashboard/templates')
}

export async function updateTemplate(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Parse arrays
  const dynamicFieldsString = formData.get('dynamic_fields') as string
  const dynamicFields = dynamicFieldsString ? dynamicFieldsString.split(',').map(f => f.trim()) : []

  const mandatoryClausesString = formData.get('mandatory_clauses') as string
  const mandatoryClauses = mandatoryClausesString ? mandatoryClausesString.split('\n').filter(c => c.trim()) : []

  const data = {
    name: formData.get('name'),
    country: formData.get('country'),
    language: formData.get('language'),
    lease_type: formData.get('lease_type'),
    content: formData.get('content'),
    dynamic_fields: dynamicFields.length > 0 ? dynamicFields : null,
    mandatory_clauses: mandatoryClauses.length > 0 ? mandatoryClauses : null,
    is_active: formData.get('is_active') === 'on',
    notes: formData.get('notes') || null,
    updated_at: new Date().toISOString(),
  }

  const validatedData = templateSchema.parse(data)

  const { error } = await supabase
    .from('templates')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating template:', error)
    throw new Error('Erreur lors de la mise à jour du template')
  }

  revalidatePath('/dashboard/templates')
  revalidatePath(`/dashboard/templates/${id}`)
  redirect(`/dashboard/templates/${id}`)
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Soft delete
  const { error } = await supabase
    .from('templates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting template:', error)
    throw new Error('Erreur lors de la suppression du template')
  }

  revalidatePath('/dashboard/templates')
  redirect('/dashboard/templates')
}
