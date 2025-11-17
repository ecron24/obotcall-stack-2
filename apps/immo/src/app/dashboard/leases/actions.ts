'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const leaseSchema = z.object({
  country: z.enum(['FR', 'BE', 'LU', 'CH', 'DE', 'ES', 'IT', 'PT']),
  lease_type: z.enum(['residential', 'commercial', 'mixed', 'seasonal']),
  template_id: z.string().uuid().optional().nullable(),
  landlord_name: z.string().min(1, 'Nom du propriétaire requis'),
  landlord_address: z.string().min(1, 'Adresse du propriétaire requise'),
  tenant_name: z.string().min(1, 'Nom du locataire requis'),
  tenant_address: z.string().optional(),
  property_address: z.string().min(1, 'Adresse du bien requise'),
  property_type: z.string().optional(),
  monthly_rent: z.number().min(0, 'Loyer requis'),
  charges: z.number().min(0).default(0),
  deposit: z.number().min(0).default(0),
  start_date: z.string(),
  duration_months: z.number().min(1).default(12),
  status: z.enum(['draft', 'generated', 'sent', 'signed']).default('draft'),
  dynamic_fields: z.record(z.any()).optional(),
  notes: z.string().optional(),
})

export async function createLease(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Parse dynamic fields
  const dynamicFieldsString = formData.get('dynamic_fields') as string
  const dynamicFields = dynamicFieldsString ? JSON.parse(dynamicFieldsString) : {}

  const data = {
    country: formData.get('country'),
    lease_type: formData.get('lease_type'),
    template_id: formData.get('template_id') || null,
    landlord_name: formData.get('landlord_name'),
    landlord_address: formData.get('landlord_address'),
    tenant_name: formData.get('tenant_name'),
    tenant_address: formData.get('tenant_address') || null,
    property_address: formData.get('property_address'),
    property_type: formData.get('property_type') || null,
    monthly_rent: parseFloat(formData.get('monthly_rent') as string),
    charges: parseFloat(formData.get('charges') as string) || 0,
    deposit: parseFloat(formData.get('deposit') as string) || 0,
    start_date: formData.get('start_date'),
    duration_months: parseInt(formData.get('duration_months') as string) || 12,
    status: formData.get('status') || 'draft',
    dynamic_fields: dynamicFields,
    notes: formData.get('notes') || null,
  }

  const validatedData = leaseSchema.parse(data)

  // Generate lease number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('leases')
    .select('*', { count: 'exact', head: true })
    .like('lease_number', `BAIL-${year}-%`)

  const leaseNumber = `BAIL-${year}-${String((count || 0) + 1).padStart(5, '0')}`

  const { error } = await supabase.from('leases').insert([
    {
      ...validatedData,
      lease_number: leaseNumber,
    },
  ])

  if (error) {
    console.error('Error creating lease:', error)
    throw new Error('Erreur lors de la création du bail')
  }

  revalidatePath('/dashboard/leases')
  redirect('/dashboard/leases')
}

export async function updateLease(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Parse dynamic fields
  const dynamicFieldsString = formData.get('dynamic_fields') as string
  const dynamicFields = dynamicFieldsString ? JSON.parse(dynamicFieldsString) : {}

  const data = {
    country: formData.get('country'),
    lease_type: formData.get('lease_type'),
    template_id: formData.get('template_id') || null,
    landlord_name: formData.get('landlord_name'),
    landlord_address: formData.get('landlord_address'),
    tenant_name: formData.get('tenant_name'),
    tenant_address: formData.get('tenant_address') || null,
    property_address: formData.get('property_address'),
    property_type: formData.get('property_type') || null,
    monthly_rent: parseFloat(formData.get('monthly_rent') as string),
    charges: parseFloat(formData.get('charges') as string) || 0,
    deposit: parseFloat(formData.get('deposit') as string) || 0,
    start_date: formData.get('start_date'),
    duration_months: parseInt(formData.get('duration_months') as string) || 12,
    status: formData.get('status'),
    dynamic_fields: dynamicFields,
    notes: formData.get('notes') || null,
    updated_at: new Date().toISOString(),
  }

  const validatedData = leaseSchema.parse(data)

  const { error } = await supabase
    .from('leases')
    .update(validatedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating lease:', error)
    throw new Error('Erreur lors de la mise à jour du bail')
  }

  revalidatePath('/dashboard/leases')
  revalidatePath(`/dashboard/leases/${id}`)
  redirect(`/dashboard/leases/${id}`)
}

export async function deleteLease(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Soft delete
  const { error } = await supabase
    .from('leases')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting lease:', error)
    throw new Error('Erreur lors de la suppression du bail')
  }

  revalidatePath('/dashboard/leases')
  redirect('/dashboard/leases')
}

export async function generateLeasePDF(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Get lease data
  const { data: lease } = await supabase
    .from('leases')
    .select('*')
    .eq('id', id)
    .single()

  if (!lease) {
    throw new Error('Bail non trouvé')
  }

  // TODO: Implement PDF generation with a library like pdf-lib or puppeteer
  // For now, just update status to generated
  const { error } = await supabase
    .from('leases')
    .update({
      status: 'generated',
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error('Erreur lors de la génération du PDF')
  }

  revalidatePath('/dashboard/leases')
  revalidatePath(`/dashboard/leases/${id}`)

  return { success: true }
}
