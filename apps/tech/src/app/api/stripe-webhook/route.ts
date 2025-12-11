import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mapping des Price IDs Stripe vers les plans
const STRIPE_PRICE_TO_PLAN: Record<string, 'starter' | 'pro'> = {
  // Inter-App
  'STRIPE_INTER_STARTER_PRICE_ID': 'starter',
  'STRIPE_INTER_PRO_PRICE_ID': 'pro',
  // Immo-App
  'STRIPE_IMMO_STARTER_PRICE_ID': 'starter',
  'STRIPE_IMMO_PRO_PRICE_ID': 'pro',
  // Agent-App
  'STRIPE_AGENT_STARTER_PRICE_ID': 'starter',
  'STRIPE_AGENT_PRO_PRICE_ID': 'pro',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break

      case 'invoice.paid':
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(failedInvoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Gère la completion du checkout Stripe
 * - Récupère le tenant du user
 * - Met à jour la subscription vers le plan payé
 * - Active le tenant si suspendu
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const product = session.metadata?.product
  const planName = session.metadata?.plan

  if (!userId) {
    console.error('No user_id in session metadata')
    return
  }

  console.log(`💰 Checkout completed for user ${userId}, product: ${product}, plan: ${planName}`)

  // 1. Récupérer le tenant du user (owner)
  const { data: tenantRole, error: tenantError } = await supabase
    .from('user_tenant_roles')
    .select('tenant_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .single()

  if (tenantError || !tenantRole) {
    console.error('Cannot find tenant for user:', userId, tenantError)
    return
  }

  const tenantId = tenantRole.tenant_id

  // 2. Extraire le plan depuis le price ID
  let plan: 'starter' | 'pro' = 'starter'

  if (session.line_items) {
    const priceId = session.line_items.data[0]?.price?.id
    if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
      plan = STRIPE_PRICE_TO_PLAN[priceId]
    }
  }

  // Fallback: essayer de mapper depuis planName
  if (planName === 'Pro') {
    plan = 'pro'
  }

  // 3. Mettre à jour la subscription
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      billing_cycle: 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_end: null, // Plus en trial
      upgraded_at: new Date().toISOString(),
      previous_plan: 'free'
    })
    .eq('tenant_id', tenantId)

  if (subscriptionError) {
    console.error('Error updating subscription:', subscriptionError)
    return
  }

  // 4. Activer le tenant si suspendu
  const { error: tenantUpdateError } = await supabase
    .from('tenants')
    .update({
      is_active: true
    })
    .eq('id', tenantId)

  if (tenantUpdateError) {
    console.error('Error activating tenant:', tenantUpdateError)
  }

  console.log(`✅ Tenant ${tenantId} upgraded to ${plan} plan`)
}

/**
 * Gère les mises à jour de subscription Stripe
 * - Changement de plan
 * - Renouvellement
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}`)

  // Trouver la subscription dans Supabase
  const { data: existingSubscription, error: findError } = await supabase
    .from('subscriptions')
    .select('tenant_id, plan')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (findError || !existingSubscription) {
    console.error('Cannot find subscription:', subscription.id, findError)
    return
  }

  // Extraire le nouveau plan depuis le price ID
  let newPlan: 'starter' | 'pro' | null = null

  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id
    if (STRIPE_PRICE_TO_PLAN[priceId]) {
      newPlan = STRIPE_PRICE_TO_PLAN[priceId]
    }
  }

  const updateData: any = {
    status: subscription.status === 'active' ? 'active' :
            subscription.status === 'trialing' ? 'trialing' :
            subscription.status === 'past_due' ? 'past_due' : 'suspended',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }

  // Si changement de plan
  if (newPlan && newPlan !== existingSubscription.plan) {
    updateData.plan = newPlan
    updateData.previous_plan = existingSubscription.plan
    updateData.upgraded_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)

  if (updateError) {
    console.error('Error updating subscription:', updateError)
    return
  }

  // Si la subscription devient inactive, suspendre le tenant
  if (subscription.status === 'past_due' || subscription.status === 'canceled') {
    await supabase
      .from('tenants')
      .update({
        is_active: false
      })
      .eq('id', existingSubscription.tenant_id)
  }

  console.log(`✅ Subscription ${subscription.id} updated`)
}

/**
 * Gère l'annulation d'une subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`❌ Subscription deleted: ${subscription.id}`)

  // Trouver le tenant
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('tenant_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSubscription) {
    console.error('Cannot find subscription:', subscription.id)
    return
  }

  // Downgrade vers FREE
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      stripe_subscription_id: null,
      previous_plan: 'starter' // ou récupérer le plan actuel
    })
    .eq('stripe_subscription_id', subscription.id)

  if (subscriptionError) {
    console.error('Error downgrading subscription:', subscriptionError)
    return
  }

  // Garder le tenant actif mais en FREE
  console.log(`✅ Tenant ${existingSubscription.tenant_id} downgraded to FREE`)
}

/**
 * Gère le paiement d'une facture
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`✅ Invoice paid: ${invoice.id}`)

  // Optionnel: Enregistrer le paiement dans une table invoices/payments
  // Pour l'instant on log juste
}

/**
 * Gère l'échec de paiement d'une facture
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`⚠️ Invoice payment failed: ${invoice.id}`)

  // TODO: Envoyer un email au propriétaire du tenant
  // TODO: Marquer la subscription comme past_due

  if (invoice.subscription) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tenant_id')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single()

    if (subscription) {
      // Mettre à jour le status
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due'
        })
        .eq('tenant_id', subscription.tenant_id)

      console.log(`⚠️ Tenant ${subscription.tenant_id} marked as past_due`)
    }
  }
}
