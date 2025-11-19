'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const priceId = searchParams?.get('priceId')
  const product = searchParams?.get('product')
  const plan = searchParams?.get('plan')

  useEffect(() => {
    if (!priceId) {
      setError('Price ID manquant')
      setLoading(false)
      return
    }

    createCheckoutSession()
  }, [priceId])

  const createCheckoutSession = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          product,
          plan,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('URL de checkout non disponible')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err)
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {loading ? 'Préparation du paiement...' : 'Erreur'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Redirection vers le paiement sécurisé Stripe...
              </p>
            </>
          ) : error ? (
            <>
              <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-md w-full">
                {error}
              </div>
              <Button onClick={() => router.push('/select-product')} className="w-full">
                Retour à la sélection
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
