'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const propertySchema = z.object({
  property_type: z.enum(['apartment', 'house', 'commercial', 'office', 'parking', 'storage', 'land', 'other']),
  address_line1: z.string().min(1, 'Adresse requise'),
  address_line2: z.string().optional(),
  postal_code: z.string().min(1, 'Code postal requis'),
  city: z.string().min(1, 'Ville requise'),
  country_id: z.string().uuid(),
  surface_area: z.coerce.number().positive().optional(),
  rooms: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().positive().optional(),
  bathrooms: z.coerce.number().int().positive().optional(),
  floor: z.coerce.number().int().optional(),
  building_year: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  energy_class: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  ges_class: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  cadastral_reference: z.string().optional(),
  description: z.string().optional(),
  internal_notes: z.string().optional(),
})

export async function createProperty(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Utilisateur non authentifié')
  }

  // Get tenant_id from user metadata or session
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  if (!tenant) {
    throw new Error('Tenant non trouvé')
  }

  const data = {
    property_type: formData.get('property_type'),
    address_line1: formData.get('address_line1'),
    address_line2: formData.get('address_line2') || null,
    postal_code: formData.get('postal_code'),
    city: formData.get('city'),
    country_id: formData.get('country_id'),
    surface_area: formData.get('surface_area') || null,
    rooms: formData.get('rooms') || null,
    bedrooms: formData.get('bedrooms') || null,
    bathrooms: formData.get('bathrooms') || null,
    floor: formData.get('floor') || null,
    building_year: formData.get('building_year') || null,
    energy_class: formData.get('energy_class') || null,
    ges_class: formData.get('ges_class') || null,
    cadastral_reference: formData.get('cadastral_reference') || null,
    description: formData.get('description') || null,
    internal_notes: formData.get('internal_notes') || null,
  }

  const validatedData = propertySchema.parse(data)

  const { error } = await supabase
    .from('properties')
    .insert([{
      tenant_id: tenant.id,
      created_by: user.id,
      ...validatedData,
    }])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}

export async function updateProperty(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Utilisateur non authentifié')
  }

  const data = {
    property_type: formData.get('property_type'),
    address_line1: formData.get('address_line1'),
    address_line2: formData.get('address_line2') || null,
    postal_code: formData.get('postal_code'),
    city: formData.get('city'),
    country_id: formData.get('country_id'),
    surface_area: formData.get('surface_area') || null,
    rooms: formData.get('rooms') || null,
    bedrooms: formData.get('bedrooms') || null,
    bathrooms: formData.get('bathrooms') || null,
    floor: formData.get('floor') || null,
    building_year: formData.get('building_year') || null,
    energy_class: formData.get('energy_class') || null,
    ges_class: formData.get('ges_class') || null,
    cadastral_reference: formData.get('cadastral_reference') || null,
    description: formData.get('description') || null,
    internal_notes: formData.get('internal_notes') || null,
  }

  const validatedData = propertySchema.parse(data)

  const { error } = await supabase
    .from('properties')
    .update({
      ...validatedData,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/properties')
  revalidatePath(`/dashboard/properties/${id}`)
  redirect('/dashboard/properties')
}

export async function deleteProperty(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Utilisateur non authentifié')
  }

  // Soft delete
  const { error } = await supabase
    .from('properties')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}
