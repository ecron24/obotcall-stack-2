'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Récupérer les paramètres product et business depuis l'URL
  const product = searchParams.get('product')
  const businessId = searchParams.get('business')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    try {
      // Stocker product et business dans les métadonnées utilisateur
      const metadata: any = {
        full_name: fullName,
        company: company,
      }

      if (product) metadata.selected_product = product
      if (businessId) metadata.selected_business_id = businessId

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)

      // Redirection selon le produit sélectionné
      setTimeout(() => {
        if (product === 'inter' && businessId) {
          // Rediriger vers inter.app avec le business pré-sélectionné
          window.location.href = `https://inter.app.obotcall.tech/auth/register?business=${businessId}`
        } else if (product === 'immo') {
          // Rediriger vers immo.app
          window.location.href = 'https://immo.app.obotcall.tech/auth/register'
        } else if (product === 'agent') {
          // Rediriger vers agent.app
          window.location.href = 'https://agent.app.obotcall.tech/auth/register'
        } else {
          // Flow normal : sélection de produit
          router.push('/select-product')
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            {product === 'inter' ? (
              'Créez votre compte pour accéder à Inter-App'
            ) : product === 'immo' ? (
              'Créez votre compte pour accéder à Immo-App'
            ) : product === 'agent' ? (
              'Créez votre compte pour accéder à Agent-App'
            ) : (
              'Commencez votre essai gratuit de 14 jours'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="p-4 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 rounded-md">
              <p className="font-medium">Compte créé avec succès !</p>
              <p className="mt-1">Vérifiez votre email pour confirmer votre compte.</p>
              <p className="mt-2 text-xs">
                {product === 'inter' ? (
                  'Redirection vers Inter-App...'
                ) : product === 'immo' ? (
                  'Redirection vers Immo-App...'
                ) : product === 'agent' ? (
                  'Redirection vers Agent-App...'
                ) : (
                  'Redirection en cours...'
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Nom de votre entreprise"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  J'accepte les{' '}
                  <Link href="/cgu" className="text-primary hover:underline" target="_blank">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/confidentialite" className="text-primary hover:underline" target="_blank">
                    politique de confidentialité
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer mon compte'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
