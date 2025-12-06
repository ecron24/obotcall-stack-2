import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function TarifsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Tarifs simples et transparents
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Choisissez le plan adapté à vos besoins. Sans engagement, sans frais cachés.
            </p>
          </div>
        </section>

        {/* Inter Pricing */}
        <section className="border-t py-16 md:py-24">
          <div className="container">
            <div className="mb-12">
              <Badge className="mb-4">Inter</Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Standard téléphonique intelligent
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tarification basée sur le nombre d'utilisateurs et le volume d'appels
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Pour les petites équipes</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">29€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Jusqu'à 5 utilisateurs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">1000 minutes/mois</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Routage basique</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Statistiques standards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support email</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/select-product">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pro</CardTitle>
                    <Badge>Populaire</Badge>
                  </div>
                  <CardDescription>Pour les équipes en croissance</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">99€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Jusqu'à 20 utilisateurs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">5000 minutes/mois</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Routage intelligent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Enregistrements illimités</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Intégration N8N</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support prioritaire</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/select-product">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Pour les grandes organisations</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Sur mesure</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Utilisateurs illimités</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Minutes illimitées</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Fonctionnalités avancées</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">SLA garanti</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support dédié 24/7</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/select-product">Nous contacter</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Agent Pricing */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mb-12">
              <Badge className="mb-4 bg-purple-600">Agent</Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                CRM pour courtiers d'assurance
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tarification par utilisateur avec fonctionnalités illimitées
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Solo</CardTitle>
                  <CardDescription>Pour les courtiers indépendants</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">49€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">1 utilisateur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Contacts illimités</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Devis & Contrats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Gestion des sinistres</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">1 Go de stockage</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/select-product">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Team</CardTitle>
                    <Badge>Populaire</Badge>
                  </div>
                  <CardDescription>Pour les agences de courtage</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">39€</span>
                    <span className="text-muted-foreground">/utilisateur/mois</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">3+ utilisateurs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Tout le plan Solo +</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Facturation avancée</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">10 Go de stockage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Rapports personnalisés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support prioritaire</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/select-product">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Pour les réseaux de courtage</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Sur mesure</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Utilisateurs illimités</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Tout le plan Team +</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Stockage illimité</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Personnalisation avancée</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support dédié</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/select-product">Nous contacter</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Immo Pricing */}
        <section className="border-t py-16 md:py-24">
          <div className="container">
            <div className="mb-12">
              <Badge className="mb-4 bg-green-600">Immo</Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Générateur de baux professionnels
              </h2>
              <p className="mt-2 text-muted-foreground">
                Système de crédits - Payez uniquement pour les baux que vous générez
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Pour débuter</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">10€</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">10 crédits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">1€ par bail</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Templates standards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Génération PDF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support email</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/select-product">Acheter</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pro</CardTitle>
                    <Badge>-17%</Badge>
                  </div>
                  <CardDescription>Le plus populaire</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">50€</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">60 crédits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">0,83€ par bail</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Templates personnalisés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Multi-pays</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support prioritaire</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/select-product">Acheter</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Enterprise</CardTitle>
                    <Badge className="bg-green-600">-33%</Badge>
                  </div>
                  <CardDescription>Pour gros volumes</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">200€</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">300 crédits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">0,67€ par bail</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Tout le plan Pro +</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Intégration API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Support dédié</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/select-product">Acheter</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
                Questions fréquentes
              </h2>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Puis-je essayer gratuitement ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Oui, tous nos produits offrent une période d'essai gratuite de 14 jours.
                      Aucune carte bancaire n'est requise pour commencer.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Puis-je changer de plan ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Absolument. Vous pouvez upgrader ou downgrader votre plan à tout moment.
                      Les changements sont proratisés.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quels moyens de paiement acceptez-vous ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) et les
                      virements bancaires pour les plans Enterprise.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Y a-t-il un engagement ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment
                      et ne serez facturé que jusqu'à la date d'annulation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à démarrer ?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Commencez votre essai gratuit de 14 jours dès aujourd'hui
              </p>
              <div className="mt-10">
                <Button size="lg" asChild>
                  <Link href="/select-product">
                    Essayer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
