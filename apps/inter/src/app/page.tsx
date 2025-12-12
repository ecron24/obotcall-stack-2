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
        // Non connecté → Redirect vers tech (hub SaaS)
        const techUrl = process.env.NEXT_PUBLIC_TECH_APP_URL || 'https://app.obotcall.tech'
        window.location.href = techUrl
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
