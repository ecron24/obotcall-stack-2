import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  Users,
  FileText,
  GitBranch,
  BarChart3,
  Clock,
  Shield,
  Zap,
  FileCheck,
  MessageSquare,
  Bell,
  Database,
  Globe,
  CheckCircle2,
} from 'lucide-react'

export default function FonctionnalitesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Fonctionnalités complètes pour chaque métier
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Découvrez toutes les fonctionnalités de nos trois solutions professionnelles
            </p>
          </div>
        </section>

        {/* Inter Features */}
        <section className="border-t py-16 md:py-24">
          <div className="container">
            <div className="mb-12">
              <Badge className="mb-4">Inter</Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Gestion d&apos;interventions multi-métiers
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Solution complète pour piscinistes, plombiers, chauffagistes et tous les métiers d&apos;intervention
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Phone className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Routage intelligent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Distribuez automatiquement les appels selon des règles métier personnalisées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Statistiques détaillées</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analysez vos volumes d'appels, durées moyennes et performances en temps réel
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Enregistrements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enregistrez et archivez vos conversations pour la formation et la qualité
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <GitBranch className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Intégration N8N</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatisez vos workflows et connectez-vous à vos outils existants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Bell className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Notifications temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes instantanées pour les appels importants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Sécurité avancée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Chiffrement des communications et authentification multi-facteurs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Agent Features */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mb-12">
              <Badge className="mb-4 bg-purple-600">Agent</Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                CRM pour courtiers d'assurance
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Gérez l'intégralité de votre activité de courtage en un seul endroit
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Gestion des contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Centralisez toutes les informations de vos clients et prospects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileCheck className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Devis et contrats</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Créez, suivez et gérez vos devis et contrats d'assurance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Gestion des sinistres</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Suivez les déclarations et le traitement des sinistres
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Facturation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Générez et suivez vos factures avec numérotation automatique
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>GED intégrée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Stockez et organisez tous vos documents clients de manière sécurisée
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Tableau de bord</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualisez vos KPIs et performances en temps réel
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Immo Features */}
        <section className="border-t py-16 md:py-24">
          <div className="container">
            <div className="mb-12">
              <Badge className="mb-4 bg-green-600">Immo</Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Générateur de baux professionnels
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Créez des baux conformes et professionnels en quelques minutes
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Globe className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Multi-pays</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Support de 8 pays européens avec conformité légale locale
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Templates personnalisables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Créez vos propres modèles avec champs dynamiques et clauses obligatoires
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Génération PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Exportez vos baux au format PDF professionnel en un clic
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Numérotation automatique</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Format BAIL-YYYY-XXXXX pour un suivi optimal de vos documents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Système de crédits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Achetez des crédits par packs adaptés à votre volume d'activité
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Conformité légale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Templates conformes aux législations locales de chaque pays
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Common Features */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Fonctionnalités communes
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Bénéficiez de ces avantages sur toutes nos solutions
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Sécurité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Données chiffrées et conformité RGPD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Applications rapides et réactives
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <GitBranch className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Intégrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    API et webhooks pour vos automatisations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Équipe dédiée à votre succès
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
