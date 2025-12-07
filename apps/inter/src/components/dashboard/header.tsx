'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useTenant } from '@/hooks'

export function Header() {
  const router = useRouter()
  const { tenant, businessType } = useTenant()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenant')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        {businessType ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">{businessType.emoji}</span>
            <div>
              <h2 className="text-lg font-semibold">{tenant?.name}</h2>
              <p className="text-xs text-gray-500">{businessType.name}</p>
            </div>
          </div>
        ) : (
          <h2 className="text-lg font-semibold">{tenant?.name || 'Bienvenue'}</h2>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  )
}
