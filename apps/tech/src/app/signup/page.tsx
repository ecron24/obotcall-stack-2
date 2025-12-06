'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Rediriger immédiatement vers la sélection de produit
    // Le site tech ne gère pas l'inscription, c'est fait dans les apps finales
    router.push('/select-product')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirection en cours...</p>
    </div>
  )
}
