'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const creditPurchaseSchema = z.object({
  amount: z.number().min(1, 'Montant requis'),
  pack_type: z.enum(['starter', 'pro', 'enterprise', 'custom']),
  price_paid: z.number().min(0),
  payment_method: z.string().optional(),
  description: z.string().optional(),
})

export async function purchaseCredits(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  const data = {
    amount: parseInt(formData.get('amount') as string),
    pack_type: formData.get('pack_type'),
    price_paid: parseFloat(formData.get('price_paid') as string),
    payment_method: formData.get('payment_method') || null,
    description: formData.get('description') || null,
  }

  const validatedData = creditPurchaseSchema.parse(data)

  // Create transaction record
  const { error } = await supabase.from('credit_transactions').insert([
    {
      type: 'purchase',
      amount: validatedData.amount,
      description: validatedData.description || `Achat pack ${validatedData.pack_type} - ${validatedData.amount} crédits`,
      metadata: {
        pack_type: validatedData.pack_type,
        price_paid: validatedData.price_paid,
        payment_method: validatedData.payment_method,
      },
    },
  ])

  if (error) {
    console.error('Error purchasing credits:', error)
    throw new Error('Erreur lors de l\'achat de crédits')
  }

  revalidatePath('/dashboard/credits')
  redirect('/dashboard/credits')
}

export async function consumeCredit(leaseId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non authentifié')
  }

  // Check available balance
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('amount, type')

  const balance = transactions?.reduce((sum, t) => {
    return t.type === 'purchase' ? sum + t.amount : sum + t.amount // usage has negative amount
  }, 0) || 0

  if (balance <= 0) {
    throw new Error('Crédits insuffisants')
  }

  // Record usage
  const { error } = await supabase.from('credit_transactions').insert([
    {
      type: 'usage',
      amount: -1, // Negative for usage
      description: `Génération de bail`,
      metadata: {
        lease_id: leaseId,
      },
    },
  ])

  if (error) {
    console.error('Error consuming credit:', error)
    throw new Error('Erreur lors de l\'utilisation du crédit')
  }

  revalidatePath('/dashboard/credits')
  revalidatePath('/dashboard/leases')
}
