import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Globe,
  CreditCard,
  Zap,
  Shield,
  Check
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Immo Lease</span>
          </div>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Générateur de Baux Immobiliers
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Générez des baux conformes pour 8 pays européens en quelques clics.
            Solution multi-pays avec système de crédits et templates personnalisables.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">
                Commencer maintenant
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Découvrir
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Fonctionnalités</h2>
          <p className="text-muted-foreground">
            Tout ce dont vous avez besoin pour générer vos baux immobiliers
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Globe className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Multi-pays</CardTitle>
              <CardDescription>
                Support de 8 pays européens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• France, Belgique, Luxembourg</li>
                <li>• Suisse, Allemagne, Espagne</li>
                <li>• Italie, Portugal</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Templates personnalisables</CardTitle>
              <CardDescription>
                Créez et gérez vos modèles de baux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Champs dynamiques</li>
                <li>• Clauses personnalisées</li>
                <li>• Multi-langues</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Système de crédits</CardTitle>
              <CardDescription>
                Payez uniquement ce que vous utilisez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Packs de crédits flexibles</li>
                <li>• Historique des consommations</li>
                <li>• Alertes de solde bas</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Génération automatique</CardTitle>
              <CardDescription>
                Générez vos baux en quelques secondes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• PDF haute qualité</li>
                <li>• Numérotation automatique</li>
                <li>• Export multiple</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Conformité légale</CardTitle>
              <CardDescription>
                Baux conformes aux législations locales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Clauses obligatoires</li>
                <li>• Mises à jour régulières</li>
                <li>• Validation juridique</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Check className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Intégration N8N</CardTitle>
              <CardDescription>
                Connectez vos workflows d'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Webhooks intégrés</li>
                <li>• API complète</li>
                <li>• Automatisation totale</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-y bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground">Choisissez le pack qui vous convient</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Pour démarrer</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">10€</span>
                  <span className="text-muted-foreground">/10 crédits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">10 baux</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tous les pays</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Templates de base</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">Choisir</Button>
              </CardContent>
            </Card>

            <Card className="border-primary shadow-lg">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>Le plus populaire</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">50€</span>
                  <span className="text-muted-foreground">/60 crédits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">60 baux</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tous les pays</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Templates personnalisés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API & Webhooks</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">Choisir</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Pour les grandes structures</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">200€</span>
                  <span className="text-muted-foreground">/300 crédits</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">300 baux</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tous les pays</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Templates illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Support prioritaire</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">Choisir</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à générer vos premiers baux ?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Créez votre compte gratuitement et générez votre premier bail en quelques minutes
          </p>
          <Link href="/login">
            <Button size="lg">
              Commencer gratuitement
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Immo Lease. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
