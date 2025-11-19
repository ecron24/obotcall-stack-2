import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, product, plan } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: priceId.includes('IMMO') ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/select-product`,
      metadata: {
        user_id: user.id,
        product,
        plan,
      },
      subscription_data: priceId.includes('IMMO')
        ? undefined
        : {
            metadata: {
              user_id: user.id,
              product,
              plan,
            },
          },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
