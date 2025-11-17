'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const claimSchema = z.object({
  contact_id: z.string().uuid('Contact requis'),
  contract_id: z.string().uuid().optional().nullable(),
  subject: z.string().min(1, 'Sujet requis'),
  description: z.string().min(1, 'Description requise'),
  level: z.enum(['level_1', 'level_2', 'level_3']).default('level_1'),
  status: z.enum(['received', 'in_progress', 'answered', 'escalated', 'closed']).default('received'),
  reception_date: z.string(),
  deadline: z.string(),
  resolution_notes: z.string().optional(),
})

export async function createClaim(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const receptionDate = formData.get('reception_date') as string || new Date().toISOString().split('T')[0]

  // Calculate deadline: 10 business days from reception
  const deadline = new Date(receptionDate)
  let businessDays = 0
  while (businessDays < 10) {
    deadline.setDate(deadline.getDate() + 1)
    const dayOfWeek = deadline.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
  }

  const data = {
    contact_id: formData.get('contact_id'),
    contract_id: formData.get('contract_id') || null,
    subject: formData.get('subject'),
    description: formData.get('description'),
    level: formData.get('level') || 'level_1',
    status: formData.get('status') || 'received',
    reception_date: receptionDate,
    deadline: deadline.toISOString().split('T')[0],
    resolution_notes: formData.get('resolution_notes') || null,
  }

  const validatedData = claimSchema.parse(data)

  // Generate claim number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('claims')
    .select('*', { count: 'exact', head: true })
    .like('claim_number', `REC-${year}-%`)

  const claimNumber = `REC-${year}-${String((count || 0) + 1).padStart(5, '0')}`

  const { error } = await supabase.from('claims').insert([
    {
      ...validatedData,
      claim_number: claimNumber,
    },
  ])

  if (error) {
    console.error('Error creating claim:', error)
    throw new Error('Erreur lors de la création de la réclamation')
  }

  revalidatePath('/dashboard/claims')
  redirect('/dashboard/claims')
}

export async function updateClaim(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const data = {
    contact_id: formData.get('contact_id'),
    contract_id: formData.get('contract_id') || null,
    subject: formData.get('subject'),
    description: formData.get('description'),
    level: formData.get('level'),
    status: formData.get('status'),
    reception_date: formData.get('reception_date'),
    deadline: formData.get('deadline'),
    resolution_notes: formData.get('resolution_notes') || null,
    updated_at: new Date().toISOString(),
  }

  const validatedData = claimSchema.parse(data)

  const { error } = await supabase
    .from('claims')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating claim:', error)
    throw new Error('Erreur lors de la mise à jour de la réclamation')
  }

  revalidatePath('/dashboard/claims')
  revalidatePath(`/dashboard/claims/${id}`)
  redirect(`/dashboard/claims/${id}`)
}

export async function deleteClaim(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const { error } = await supabase
    .from('claims')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting claim:', error)
    throw new Error('Erreur lors de la suppression de la réclamation')
  }

  revalidatePath('/dashboard/claims')
  redirect('/dashboard/claims')
}
