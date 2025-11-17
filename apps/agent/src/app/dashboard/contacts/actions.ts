'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const contactSchema = z.object({
  contact_type: z.enum(['individual', 'professional']),
  title: z.string().optional(),
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  company_name: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  mobile_phone: z.string().optional(),
  home_phone: z.string().optional(),
  work_phone: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('France'),
  birth_date: z.string().optional(),
  siret: z.string().optional(),
  status: z.enum(['prospect', 'client', 'inactive', 'archived']).default('prospect'),
  preferred_contact_method: z.enum(['email', 'phone', 'sms']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function createContact(formData: FormData) {
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
    contact_type: formData.get('contact_type'),
    title: formData.get('title') || null,
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    company_name: formData.get('company_name') || null,
    email: formData.get('email') || null,
    mobile_phone: formData.get('mobile_phone') || null,
    home_phone: formData.get('home_phone') || null,
    work_phone: formData.get('work_phone') || null,
    address: formData.get('address') || null,
    postal_code: formData.get('postal_code') || null,
    city: formData.get('city') || null,
    country: formData.get('country') || 'France',
    birth_date: formData.get('birth_date') || null,
    siret: formData.get('siret') || null,
    status: formData.get('status') || 'prospect',
    preferred_contact_method: formData.get('preferred_contact_method') || null,
    notes: formData.get('notes') || null,
    tags: tags.length > 0 ? tags : null,
  }

  const validatedData = contactSchema.parse(data)

  const { error } = await supabase.from('contacts').insert([validatedData])

  if (error) {
    console.error('Error creating contact:', error)
    throw new Error('Erreur lors de la création du contact')
  }

  revalidatePath('/dashboard/contacts')
  redirect('/dashboard/contacts')
}

export async function updateContact(id: string, formData: FormData) {
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
    contact_type: formData.get('contact_type'),
    title: formData.get('title') || null,
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    company_name: formData.get('company_name') || null,
    email: formData.get('email') || null,
    mobile_phone: formData.get('mobile_phone') || null,
    home_phone: formData.get('home_phone') || null,
    work_phone: formData.get('work_phone') || null,
    address: formData.get('address') || null,
    postal_code: formData.get('postal_code') || null,
    city: formData.get('city') || null,
    country: formData.get('country') || 'France',
    birth_date: formData.get('birth_date') || null,
    siret: formData.get('siret') || null,
    status: formData.get('status'),
    preferred_contact_method: formData.get('preferred_contact_method') || null,
    notes: formData.get('notes') || null,
    tags: tags.length > 0 ? tags : null,
    updated_at: new Date().toISOString(),
  }

  const validatedData = contactSchema.parse(data)

  const { error } = await supabase
    .from('contacts')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating contact:', error)
    throw new Error('Erreur lors de la mise à jour du contact')
  }

  revalidatePath('/dashboard/contacts')
  revalidatePath(`/dashboard/contacts/${id}`)
  redirect(`/dashboard/contacts/${id}`)
}

export async function deleteContact(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Soft delete
  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting contact:', error)
    throw new Error('Erreur lors de la suppression du contact')
  }

  revalidatePath('/dashboard/contacts')
  redirect('/dashboard/contacts')
}
