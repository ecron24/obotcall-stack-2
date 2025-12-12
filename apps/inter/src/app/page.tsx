'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Connecté → Dashboard
        router.push('/dashboard')
      } else {
        // Non connecté → Login local (pour tests/dev)
        // En production, on pourrait rediriger vers tech
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  )
}
