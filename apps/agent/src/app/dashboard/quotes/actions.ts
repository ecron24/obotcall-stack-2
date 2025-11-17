'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const quoteSchema = z.object({
  contact_id: z.string().uuid('Contact requis'),
  product_category: z.string().min(1, 'Catégorie requise'),
  product_type: z.string().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']).default('draft'),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
})

export async function createQuote(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const data = {
    contact_id: formData.get('contact_id'),
    product_category: formData.get('product_category'),
    product_type: formData.get('product_type') || null,
    status: formData.get('status') || 'draft',
    valid_until: formData.get('valid_until') || null,
    notes: formData.get('notes') || null,
  }

  const validatedData = quoteSchema.parse(data)

  // Generate quote number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .like('quote_number', `DEV-${year}-%`)

  const quoteNumber = `DEV-${year}-${String((count || 0) + 1).padStart(5, '0')}`

  const { error } = await supabase.from('quotes').insert([
    {
      ...validatedData,
      quote_number: quoteNumber,
    },
  ])

  if (error) {
    console.error('Error creating quote:', error)
    throw new Error('Erreur lors de la création du devis')
  }

  revalidatePath('/dashboard/quotes')
  redirect('/dashboard/quotes')
}

export async function updateQuote(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const data = {
    contact_id: formData.get('contact_id'),
    product_category: formData.get('product_category'),
    product_type: formData.get('product_type') || null,
    status: formData.get('status'),
    valid_until: formData.get('valid_until') || null,
    notes: formData.get('notes') || null,
    updated_at: new Date().toISOString(),
  }

  const validatedData = quoteSchema.parse(data)

  const { error } = await supabase
    .from('quotes')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating quote:', error)
    throw new Error('Erreur lors de la mise à jour du devis')
  }

  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/quotes/${id}`)
  redirect(`/dashboard/quotes/${id}`)
}

export async function deleteQuote(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Soft delete
  const { error } = await supabase
    .from('quotes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting quote:', error)
    throw new Error('Erreur lors de la suppression du devis')
  }

  revalidatePath('/dashboard/quotes')
  redirect('/dashboard/quotes')
}
