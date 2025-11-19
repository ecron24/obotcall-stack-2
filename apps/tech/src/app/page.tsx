import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ArrowRight, Phone, Users, FileText, Zap, Shield, BarChart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Solutions Digitales pour Professionnels
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              ObotCall accompagne votre transformation digitale avec trois solutions métier
              complètes : standard téléphonique intelligent, CRM pour courtiers et générateur
              de baux professionnels.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/signup">
                  Démarrer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/produits">Découvrir nos produits</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Products Overview */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trois solutions, un écosystème
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Choisissez la solution adaptée à votre métier ou combinez-les pour une
                synergie optimale.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="mt-4">Inter</CardTitle>
                  <CardDescription>Standard téléphonique intelligent</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gérez vos appels professionnels avec intelligence : routage avancé,
                    enregistrements, statistiques et intégration N8N.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/produits#inter">En savoir plus →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="mt-4">Agent</CardTitle>
                  <CardDescription>CRM pour courtiers d'assurance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Solution complète pour courtiers : gestion contacts, devis, contrats,
                    sinistres, factures et documents.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/produits#agent">En savoir plus →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="mt-4">Immo</CardTitle>
                  <CardDescription>Générateur de baux professionnels</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créez des baux conformes en quelques clics : templates multi-pays,
                    génération PDF, gestion des crédits.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/produits#immo">En savoir plus →</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Pourquoi choisir ObotCall ?
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Performance</h3>
                <p className="mt-2 text-muted-foreground">
                  Applications rapides et réactives construites avec les dernières technologies
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Sécurité</h3>
                <p className="mt-2 text-muted-foreground">
                  Données chiffrées, authentification sécurisée et conformité RGPD
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <BarChart className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Analytics</h3>
                <p className="mt-2 text-muted-foreground">
                  Tableaux de bord détaillés et statistiques en temps réel
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à transformer votre activité ?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Commencez dès aujourd'hui avec notre essai gratuit de 14 jours.
                Aucune carte bancaire requise.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/signup">
                    Essayer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/tarifs">Voir les tarifs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
