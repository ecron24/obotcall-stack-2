import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CGUPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8">
              Conditions Générales d'Utilisation
            </h1>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Objet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Les présentes Conditions Générales d'Utilisation (CGU) régissent
                    l'utilisation des services ObotCall comprenant :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Inter :</strong> Standard téléphonique intelligent</li>
                    <li><strong>Agent :</strong> CRM pour courtiers d'assurance</li>
                    <li><strong>Immo :</strong> Générateur de baux professionnels</li>
                  </ul>
                  <p>
                    En accédant et en utilisant nos services, vous acceptez sans réserve les
                    présentes CGU.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Définitions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Services :</strong> ensemble des fonctionnalités proposées par ObotCall</li>
                    <li><strong>Utilisateur :</strong> toute personne physique ou morale utilisant les Services</li>
                    <li><strong>Compte :</strong> espace personnel créé par l'Utilisateur</li>
                    <li><strong>Abonnement :</strong> souscription à l'un des plans tarifaires proposés</li>
                    <li><strong>Contenu :</strong> données, fichiers et informations téléchargés par l'Utilisateur</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Accès aux Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">3.1 Inscription</h4>
                  <p className="text-muted-foreground">
                    L'accès aux Services nécessite la création d'un Compte. Vous devez fournir
                    des informations exactes, complètes et à jour. Vous êtes responsable de
                    la confidentialité de vos identifiants.
                  </p>

                  <h4 className="font-semibold">3.2 Éligibilité</h4>
                  <p className="text-muted-foreground">
                    Nos Services sont réservés aux professionnels et aux personnes majeures.
                    En créant un Compte, vous déclarez avoir la capacité juridique de
                    contracter.
                  </p>

                  <h4 className="font-semibold">3.3 Activation</h4>
                  <p className="text-muted-foreground">
                    Votre Compte est activé après validation de votre inscription. Nous nous
                    réservons le droit de refuser toute inscription sans avoir à nous justifier.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Description des Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">4.1 Inter - Standard téléphonique</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Gestion des appels entrants et sortants</li>
                    <li>Routage intelligent et personnalisable</li>
                    <li>Enregistrement et archivage des conversations</li>
                    <li>Statistiques et analytics en temps réel</li>
                    <li>Intégration avec outils tiers (N8N)</li>
                  </ul>

                  <h4 className="font-semibold mt-4">4.2 Agent - CRM Courtier</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Gestion des contacts et prospects</li>
                    <li>Création et suivi des devis et contrats</li>
                    <li>Gestion des sinistres et réclamations</li>
                    <li>Facturation et documents</li>
                    <li>GED intégrée</li>
                  </ul>

                  <h4 className="font-semibold mt-4">4.3 Immo - Générateur de baux</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Templates multi-pays et multi-langues</li>
                    <li>Personnalisation des modèles</li>
                    <li>Génération PDF professionnelle</li>
                    <li>Système de crédits prépayés</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Obligations de l'Utilisateur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">5.1 Usage conforme</h4>
                  <p className="text-muted-foreground">
                    Vous vous engagez à utiliser les Services conformément à leur destination
                    et dans le respect des lois et règlements en vigueur.
                  </p>

                  <h4 className="font-semibold">5.2 Interdictions</h4>
                  <p className="text-muted-foreground mb-2">Il est strictement interdit de :</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Utiliser les Services à des fins illégales ou frauduleuses</li>
                    <li>Tenter d'accéder aux comptes d'autres utilisateurs</li>
                    <li>Perturber le fonctionnement des Services</li>
                    <li>Collecter des données sans autorisation</li>
                    <li>Diffuser des virus ou codes malveillants</li>
                    <li>Contourner les mesures de sécurité</li>
                    <li>Revendre ou sous-licencier les Services sans autorisation</li>
                  </ul>

                  <h4 className="font-semibold">5.3 Contenu</h4>
                  <p className="text-muted-foreground">
                    Vous êtes seul responsable du Contenu que vous téléchargez et diffusez
                    via les Services. Vous garantissez disposer de tous les droits nécessaires
                    sur ce Contenu.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Propriété intellectuelle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">6.1 Droits d'ObotCall</h4>
                  <p className="text-muted-foreground">
                    Tous les éléments des Services (logiciels, bases de données, designs,
                    marques, logos) sont la propriété exclusive d'ObotCall et sont protégés
                    par le droit d'auteur et le droit des marques.
                  </p>

                  <h4 className="font-semibold">6.2 Licence d'utilisation</h4>
                  <p className="text-muted-foreground">
                    ObotCall vous concède une licence d'utilisation non exclusive, non
                    transférable et révocable des Services, limitée à la durée de votre
                    Abonnement.
                  </p>

                  <h4 className="font-semibold">6.3 Votre Contenu</h4>
                  <p className="text-muted-foreground">
                    Vous conservez tous les droits sur votre Contenu. Vous nous accordez
                    une licence d'utilisation de ce Contenu uniquement pour fournir les
                    Services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Disponibilité et support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">7.1 Disponibilité</h4>
                  <p className="text-muted-foreground">
                    Nous nous efforçons d'assurer une disponibilité maximale des Services,
                    sans pouvoir garantir une disponibilité de 100%. Des interruptions
                    peuvent survenir pour maintenance ou cas de force majeure.
                  </p>

                  <h4 className="font-semibold">7.2 Support technique</h4>
                  <p className="text-muted-foreground">
                    Le niveau de support technique varie selon votre plan d'Abonnement.
                    Les détails sont disponibles sur notre page tarifs.
                  </p>

                  <h4 className="font-semibold">7.3 Évolutions</h4>
                  <p className="text-muted-foreground">
                    Nous nous réservons le droit de faire évoluer les Services, d'ajouter
                    ou retirer des fonctionnalités, moyennant information préalable.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Données personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Le traitement de vos données personnelles est régi par notre{' '}
                    <a href="/confidentialite" className="text-primary hover:underline">
                      Politique de confidentialité
                    </a>
                    , qui fait partie intégrante des présentes CGU.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Responsabilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">9.1 Responsabilité d'ObotCall</h4>
                  <p className="text-muted-foreground">
                    ObotCall ne saurait être tenue responsable des dommages indirects
                    (perte de données, de chiffre d'affaires, d'opportunité) résultant
                    de l'utilisation ou de l'impossibilité d'utiliser les Services.
                  </p>

                  <h4 className="font-semibold">9.2 Limitation de responsabilité</h4>
                  <p className="text-muted-foreground">
                    En tout état de cause, la responsabilité d'ObotCall est limitée au
                    montant des sommes effectivement payées par l'Utilisateur au cours
                    des 12 derniers mois.
                  </p>

                  <h4 className="font-semibold">9.3 Responsabilité de l'Utilisateur</h4>
                  <p className="text-muted-foreground">
                    Vous êtes responsable de votre utilisation des Services et de votre
                    Contenu. Vous vous engagez à indemniser ObotCall en cas de réclamation
                    liée à votre utilisation des Services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Durée et résiliation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">10.1 Durée</h4>
                  <p className="text-muted-foreground">
                    Les Services sont souscrits pour la durée choisie lors de l'Abonnement
                    (mensuel ou annuel) et se renouvellent tacitement sauf résiliation.
                  </p>

                  <h4 className="font-semibold">10.2 Résiliation par l'Utilisateur</h4>
                  <p className="text-muted-foreground">
                    Vous pouvez résilier votre Abonnement à tout moment depuis votre Compte.
                    La résiliation prend effet à la fin de la période en cours. Aucun
                    remboursement n'est effectué pour la période déjà payée.
                  </p>

                  <h4 className="font-semibold">10.3 Résiliation par ObotCall</h4>
                  <p className="text-muted-foreground">
                    Nous pouvons suspendre ou résilier votre accès aux Services en cas de
                    violation des CGU, moyennant préavis sauf urgence. En cas de résiliation
                    pour faute, aucun remboursement n'est dû.
                  </p>

                  <h4 className="font-semibold">10.4 Effets de la résiliation</h4>
                  <p className="text-muted-foreground">
                    À la résiliation, votre accès aux Services est désactivé. Vous disposez
                    de 30 jours pour récupérer vos données, passé ce délai elles seront
                    définitivement supprimées.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Modifications des CGU</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous nous réservons le droit de modifier les présentes CGU à tout moment.
                    Les modifications importantes vous seront notifiées par email au moins
                    30 jours avant leur entrée en vigueur. Votre utilisation continue des
                    Services après cette date vaut acceptation des nouvelles CGU.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Droit applicable et juridiction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Les présentes CGU sont régies par le droit français.
                  </p>
                  <p className="text-muted-foreground">
                    En cas de litige, les parties s'efforceront de trouver une solution
                    amiable. À défaut, le litige sera porté devant les tribunaux compétents
                    de Paris.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>13. Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>Pour toute question concernant ces CGU :</p>
                  <p><strong>Email :</strong> legal@obotcall.com</p>
                  <p><strong>Adresse :</strong> ObotCall SAS, 123 Avenue des Champs-Élysées, 75008 Paris</p>
                </CardContent>
              </Card>

              <div className="text-sm text-muted-foreground mt-8">
                <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
