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
                  Gestion d&apos;interventions multi-métiers
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Solution complète pour piscinistes, plombiers, garagistes, électriciens,
                  chauffagistes, éradiqueurs de nuisibles et tous les métiers d&apos;intervention.
                  Gérez vos interventions, devis, factures et planning en toute simplicité.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gestion complète des interventions</p>
                      <p className="text-sm text-muted-foreground">
                        Planifiez, suivez et facturez toutes vos interventions terrain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Devis et facturation</p>
                      <p className="text-sm text-muted-foreground">
                        Créez rapidement des devis professionnels et transformez-les en factures
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Planning multi-techniciens</p>
                      <p className="text-sm text-muted-foreground">
                        Organisez les interventions de votre équipe avec un planning intelligent
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gestion clients et équipements</p>
                      <p className="text-sm text-muted-foreground">
                        Base de données clients complète avec historique des interventions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/select-product">
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
                  <CardTitle className="text-2xl">Métiers supportés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">🏊 Piscinistes</h4>
                    <p className="text-sm text-muted-foreground">
                      Entretien, maintenance et installation de piscines
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">🔧 Plombiers</h4>
                    <p className="text-sm text-muted-foreground">
                      Installations sanitaires et dépannages
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">🚗 Garagistes</h4>
                    <p className="text-sm text-muted-foreground">
                      Réparation et entretien automobile
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">⚡ Électriciens</h4>
                    <p className="text-sm text-muted-foreground">
                      Installations électriques et mises aux normes
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">🔥 Chauffagistes</h4>
                    <p className="text-sm text-muted-foreground">
                      Chauffage, climatisation et ventilation
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">🐛 Éradiqueurs de nuisibles</h4>
                    <p className="text-sm text-muted-foreground">
                      Dératisation, désinsectisation et désinfection
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
                    <Link href="/select-product">
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
                  Gestion locative et baux immobiliers
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Solution complète pour gérer votre patrimoine immobilier : baux, contrats de
                  vente, locataires, quittances et documents. Templates conformes et génération
                  PDF automatique.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gestion complète des biens</p>
                      <p className="text-sm text-muted-foreground">
                        Centralisez tous vos biens immobiliers avec leurs caractéristiques
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Baux et contrats automatisés</p>
                      <p className="text-sm text-muted-foreground">
                        Templates conformes pour baux résidentiels, commerciaux et contrats de vente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Gestion locataires et quittances</p>
                      <p className="text-sm text-muted-foreground">
                        Suivez vos locataires, générez les quittances et gérez les paiements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Multi-propriétaires et agences</p>
                      <p className="text-sm text-muted-foreground">
                        Gérez plusieurs propriétaires ou plusieurs agences immobilières
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/select-product">
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
                  <CardTitle className="text-2xl">Modules inclus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Gestion des biens</h4>
                    <p className="text-sm text-muted-foreground">
                      Propriétés, appartements, commerces avec toutes leurs caractéristiques
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Baux et contrats</h4>
                    <p className="text-sm text-muted-foreground">
                      Templates conformes pour baux résidentiels, commerciaux et contrats de vente
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Gestion locataires</h4>
                    <p className="text-sm text-muted-foreground">
                      Fiches locataires, quittances automatiques, suivi des paiements
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Documents et GED</h4>
                    <p className="text-sm text-muted-foreground">
                      Stockage sécurisé, génération PDF, historique complet
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
                  <Link href="/select-product">
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
