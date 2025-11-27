'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
      tenant_slug: formData.get('tenant_slug') as string,
      tenant_name: formData.get('tenant_name') as string,
    }

    try {
      const response = await apiClient.register(data)

      // Store token
      apiClient.setToken(response.access_token)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('tenant', JSON.stringify(response.tenant))

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour accéder à Inter-App
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vous@exemple.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                minLength={8}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">Nom complet</label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Jean Dupont"
                minLength={2}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tenant_name" className="text-sm font-medium">Nom de l'entreprise</label>
              <Input
                id="tenant_name"
                name="tenant_name"
                type="text"
                placeholder="Mon Entreprise"
                minLength={2}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tenant_slug" className="text-sm font-medium">Identifiant unique (slug)</label>
              <Input
                id="tenant_slug"
                name="tenant_slug"
                type="text"
                placeholder="mon-entreprise"
                minLength={3}
                maxLength={50}
                pattern="[a-z0-9\-]+"
                title="Lettres minuscules, chiffres et tirets uniquement"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Lettres minuscules, chiffres et tirets uniquement (ex: mon-entreprise-123)
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
