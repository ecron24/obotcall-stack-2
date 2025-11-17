'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const invoiceSchema = z.object({
  contact_id: z.string().uuid('Contact requis'),
  contract_id: z.string().uuid().optional().nullable(),
  invoice_date: z.string(),
  due_date: z.string(),
  amount_ht: z.number().min(0, 'Montant HT requis'),
  vat_rate: z.number().min(0).max(100).default(20),
  amount_ttc: z.number().min(0),
  payment_status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  payment_date: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function createInvoice(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const amountHt = parseFloat(formData.get('amount_ht') as string)
  const vatRate = parseFloat(formData.get('vat_rate') as string) || 20
  const amountTtc = amountHt * (1 + vatRate / 100)

  const data = {
    contact_id: formData.get('contact_id'),
    contract_id: formData.get('contract_id') || null,
    invoice_date: formData.get('invoice_date'),
    due_date: formData.get('due_date'),
    amount_ht: amountHt,
    vat_rate: vatRate,
    amount_ttc: amountTtc,
    payment_status: formData.get('payment_status') || 'pending',
    payment_date: formData.get('payment_date') || null,
    payment_method: formData.get('payment_method') || null,
    notes: formData.get('notes') || null,
  }

  const validatedData = invoiceSchema.parse(data)

  // Generate invoice number
  const year = new Date(validatedData.invoice_date).getFullYear()
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `FAC-${year}-%`)

  const invoiceNumber = `FAC-${year}-${String((count || 0) + 1).padStart(5, '0')}`

  const { error } = await supabase.from('invoices').insert([
    {
      ...validatedData,
      invoice_number: invoiceNumber,
    },
  ])

  if (error) {
    console.error('Error creating invoice:', error)
    throw new Error('Erreur lors de la création de la facture')
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const amountHt = parseFloat(formData.get('amount_ht') as string)
  const vatRate = parseFloat(formData.get('vat_rate') as string) || 20
  const amountTtc = amountHt * (1 + vatRate / 100)

  const data = {
    contact_id: formData.get('contact_id'),
    contract_id: formData.get('contract_id') || null,
    invoice_date: formData.get('invoice_date'),
    due_date: formData.get('due_date'),
    amount_ht: amountHt,
    vat_rate: vatRate,
    amount_ttc: amountTtc,
    payment_status: formData.get('payment_status'),
    payment_date: formData.get('payment_date') || null,
    payment_method: formData.get('payment_method') || null,
    notes: formData.get('notes') || null,
    updated_at: new Date().toISOString(),
  }

  const validatedData = invoiceSchema.parse(data)

  // Check if payment status changed to paid, set payment_date if not set
  if (validatedData.payment_status === 'paid' && !validatedData.payment_date) {
    validatedData.payment_date = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('invoices')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating invoice:', error)
    throw new Error('Erreur lors de la mise à jour de la facture')
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
  redirect(`/dashboard/invoices/${id}`)
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Soft delete
  const { error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting invoice:', error)
    throw new Error('Erreur lors de la suppression de la facture')
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}
