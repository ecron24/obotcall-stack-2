import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  Users,
  FileText,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function ProduitsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Nos Solutions Professionnelles
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Trois produits métier conçus pour répondre aux besoins spécifiques de votre
              activité professionnelle
            </p>
          </div>
        </section>

        {/* Inter Product */}
        <section id="inter" className="border-t py-16 md:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <Badge className="mb-4">Inter</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  Standard téléphonique intelligent
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Transformez votre gestion téléphonique avec une solution moderne et
                  intelligente. Inter vous permet de gérer tous vos appels professionnels
                  avec une efficacité sans précédent.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Routage intelligent des appels</p>
                      <p className="text-sm text-muted-foreground">
                        Distribuez automatiquement les appels selon vos règles métier
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Statistiques et analytics</p>
                      <p className="text-sm text-muted-foreground">
                        Analysez vos performances avec des tableaux de bord détaillés
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Enregistrements et archivage</p>
                      <p className="text-sm text-muted-foreground">
                        Conservez une trace de toutes vos conversations importantes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Intégration N8N</p>
                      <p className="text-sm text-muted-foreground">
                        Automatisez vos workflows et connectez vos outils existants
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/signup">
                      Essayer Inter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/fonctionnalites#inter">Voir les fonctionnalités</Link>
                  </Button>
                </div>
              </div>

              <Card className="lg:order-first">
                <CardHeader>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 mb-4">
                    <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">Cas d'usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Service client</h4>
                    <p className="text-sm text-muted-foreground">
                      Gérez efficacement les appels entrants de vos clients avec distribution
                      automatique et files d'attente intelligentes
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Équipes commerciales</h4>
                    <p className="text-sm text-muted-foreground">
                      Suivez les performances de vos commerciaux et optimisez vos campagnes
                      d'appels sortants
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">PME et startups</h4>
                    <p className="text-sm text-muted-foreground">
                      Adoptez un système téléphonique professionnel sans infrastructure complexe
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Agent Product */}
        <section id="agent" className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <Badge className="mb-4 bg-purple-600">Agent</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  CRM pour courtiers d'assurance
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Une solution complète conçue spécifiquement pour les courtiers d'assurance.
                  Agent centralise toute votre activité : de la prospection à la gestion des
                  sinistres.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gestion complète des contacts</p>
                      <p className="text-sm text-muted-foreground">
                        Centralisez toutes les informations de vos clients et prospects
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Devis, contrats et factures</p>
                      <p className="text-sm text-muted-foreground">
                        Gérez tout le cycle de vie commercial en un seul endroit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Suivi des sinistres</p>
                      <p className="text-sm text-muted-foreground">
                        Accompagnez vos clients dans leurs déclarations et réclamations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">GED intégrée</p>
                      <p className="text-sm text-muted-foreground">
                        Stockez et organisez tous vos documents de manière sécurisée
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/signup">
                      Essayer Agent
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/fonctionnalites#agent">Voir les fonctionnalités</Link>
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900 mb-4">
                    <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">Modules inclus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contacts & Prospection</h4>
                    <p className="text-sm text-muted-foreground">
                      Fiches clients détaillées, historique des interactions, segmentation
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Devis & Contrats</h4>
                    <p className="text-sm text-muted-foreground">
                      Création rapide, suivi du pipeline, conversion automatisée
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sinistres & Réclamations</h4>
                    <p className="text-sm text-muted-foreground">
                      Déclaration en ligne, suivi du traitement, communication avec assureurs
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Facturation & Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Génération automatique, numérotation, stockage sécurisé
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Immo Product */}
        <section id="immo" className="border-t py-16 md:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <Badge className="mb-4 bg-green-600">Immo</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  Générateur de baux professionnels
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Créez des contrats de location conformes et professionnels en quelques
                  minutes. Immo vous fait gagner un temps précieux dans la gestion locative.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Support multi-pays</p>
                      <p className="text-sm text-muted-foreground">
                        8 pays européens supportés avec conformité légale locale
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Templates personnalisables</p>
                      <p className="text-sm text-muted-foreground">
                        Créez vos propres modèles avec champs dynamiques
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Génération PDF instantanée</p>
                      <p className="text-sm text-muted-foreground">
                        Exportez vos baux au format PDF professionnel en un clic
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Système de crédits flexible</p>
                      <p className="text-sm text-muted-foreground">
                        Payez uniquement pour les baux que vous générez
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/signup">
                      Essayer Immo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/fonctionnalites#immo">Voir les fonctionnalités</Link>
                  </Button>
                </div>
              </div>

              <Card className="lg:order-first">
                <CardHeader>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900 mb-4">
                    <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">Types de baux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Bail résidentiel</h4>
                    <p className="text-sm text-muted-foreground">
                      Pour locations d'habitation principale avec toutes les clauses légales
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Bail commercial</h4>
                    <p className="text-sm text-muted-foreground">
                      Locations professionnelles et commerciales avec spécificités métier
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Bail mixte</h4>
                    <p className="text-sm text-muted-foreground">
                      Combinaison habitation et activité professionnelle
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Bail saisonnier</h4>
                    <p className="text-sm text-muted-foreground">
                      Locations de courte durée pour vacances et séjours temporaires
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trouvez la solution adaptée à votre métier
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Ou combinez plusieurs produits pour une synergie optimale
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/signup">
                    Nous contacter
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
