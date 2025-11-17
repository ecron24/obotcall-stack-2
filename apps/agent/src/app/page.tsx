import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  FileText,
  FileCheck,
  Receipt,
  AlertCircle,
  FolderOpen,
  Shield,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Agent CRM</span>
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
            CRM pour courtiers d'assurance
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Gérez vos clients, devis, contrats et réclamations en toute simplicité.
            Une solution complète pour optimiser votre activité de courtage.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">
                Commencer maintenant
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Fonctionnalités principales</h2>
          <p className="text-muted-foreground">
            Tout ce dont vous avez besoin pour gérer votre activité de courtage
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Gestion des contacts</CardTitle>
              <CardDescription>
                Centralisez tous vos prospects et clients avec leurs informations complètes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Fiches clients détaillées</li>
                <li>• Particuliers et professionnels</li>
                <li>• Historique complet</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Gestion des devis</CardTitle>
              <CardDescription>
                Créez et suivez vos devis avec un workflow complet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Création rapide de devis</li>
                <li>• Suivi des statuts</li>
                <li>• Taux de conversion</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileCheck className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Gestion des contrats</CardTitle>
              <CardDescription>
                Suivez tous vos contrats et leurs échéances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Alertes de renouvellement</li>
                <li>• Suivi des commissions</li>
                <li>• Historique détaillé</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Facturation</CardTitle>
              <CardDescription>
                Générez et gérez vos factures de courtage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Création automatique</li>
                <li>• Suivi des paiements</li>
                <li>• Relances automatiques</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <AlertCircle className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Réclamations</CardTitle>
              <CardDescription>
                Gérez les réclamations selon le processus légal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Processus en 3 niveaux</li>
                <li>• Calcul automatique des délais</li>
                <li>• Alertes d'échéance</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FolderOpen className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Gestion documentaire</CardTitle>
              <CardDescription>
                Centralisez tous vos documents en toute sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Stockage sécurisé</li>
                <li>• Documents confidentiels</li>
                <li>• Gestion des expirations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-primary" />
              <div className="mb-2 text-4xl font-bold">100%</div>
              <div className="text-muted-foreground">Conforme aux réglementations</div>
            </div>
            <div className="text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
              <div className="mb-2 text-4xl font-bold">Sécurisé</div>
              <div className="text-muted-foreground">Données chiffrées et protégées</div>
            </div>
            <div className="text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-primary" />
              <div className="mb-2 text-4xl font-bold">Multi-tenant</div>
              <div className="text-muted-foreground">Isolation complète des données</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à optimiser votre activité de courtage ?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Rejoignez les courtiers qui ont choisi Agent CRM pour gérer leur activité
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
          <p>© 2024 Agent CRM. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
