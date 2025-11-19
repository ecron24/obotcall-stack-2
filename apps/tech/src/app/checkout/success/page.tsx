'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const APP_URLS = {
  Inter: process.env.NEXT_PUBLIC_INTER_APP_URL || 'http://localhost:3001',
  Agent: process.env.NEXT_PUBLIC_AGENT_APP_URL || 'http://localhost:3000',
  Immo: process.env.NEXT_PUBLIC_IMMO_APP_URL || 'http://localhost:3002',
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(10)
  const [product, setProduct] = useState<string>('')
  const [appUrl, setAppUrl] = useState<string>('')

  useEffect(() => {
    // Get product from session or localStorage
    const storedProduct = localStorage.getItem('selected_product') || 'Inter'
    setProduct(storedProduct)
    setAppUrl(APP_URLS[storedProduct as keyof typeof APP_URLS] || APP_URLS.Inter)

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirect to the app
          window.location.href = APP_URLS[storedProduct as keyof typeof APP_URLS] || APP_URLS.Inter
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Paiement réussi !</CardTitle>
          <CardDescription className="text-lg mt-2">
            Merci pour votre confiance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Produit</span>
              <span className="font-semibold">{product}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <span className="font-semibold text-green-600">Actif</span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Un email de confirmation a été envoyé à votre adresse.
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Redirection automatique vers {product} dans{' '}
              <span className="font-bold text-primary">{countdown}</span> seconde{countdown > 1 ? 's' : ''}...
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="w-full sm:w-auto">
                <Link href={appUrl}>
                  Accéder à {product} maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t text-center">
            <h3 className="font-semibold mb-2">Prochaines étapes</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✓ Votre compte est maintenant actif</li>
              <li>✓ Accédez à toutes les fonctionnalités de {product}</li>
              <li>✓ Support disponible si vous avez besoin d'aide</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
