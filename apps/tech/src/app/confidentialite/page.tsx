import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfidentialitePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8">
              Politique de confidentialité
            </h1>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Introduction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    ObotCall SAS, en tant que responsable du traitement, attache une grande
                    importance à la protection de vos données personnelles et au respect de
                    votre vie privée.
                  </p>
                  <p>
                    La présente politique de confidentialité a pour objectif de vous informer
                    sur la manière dont nous collectons, utilisons, partageons et protégeons
                    vos données personnelles conformément au Règlement Général sur la
                    Protection des Données (RGPD) et à la loi Informatique et Libertés.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Données collectées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">Données d'identification</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Nom et prénom</li>
                    <li>Adresse email</li>
                    <li>Numéro de téléphone</li>
                    <li>Adresse postale</li>
                    <li>Nom de l'entreprise</li>
                  </ul>

                  <h4 className="font-semibold mt-4">Données de connexion</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Adresse IP</li>
                    <li>Logs de connexion</li>
                    <li>Données de navigation</li>
                    <li>Type de navigateur</li>
                    <li>Système d'exploitation</li>
                  </ul>

                  <h4 className="font-semibold mt-4">Données d'utilisation</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Historique des appels (Inter)</li>
                    <li>Contacts et documents (Agent)</li>
                    <li>Baux générés (Immo)</li>
                    <li>Statistiques d'utilisation</li>
                  </ul>

                  <h4 className="font-semibold mt-4">Données de paiement</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Informations de facturation</li>
                    <li>Historique des transactions</li>
                    <li>Note : Les données bancaires sont traitées par notre prestataire de paiement certifié PCI-DSS</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Finalités du traitement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Nous collectons et utilisons vos données pour :</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Créer et gérer votre compte utilisateur</li>
                    <li>Fournir et améliorer nos services (Inter, Agent, Immo)</li>
                    <li>Traiter vos commandes et gérer votre abonnement</li>
                    <li>Vous envoyer des communications relatives à votre compte</li>
                    <li>Répondre à vos demandes de support</li>
                    <li>Assurer la sécurité de nos services</li>
                    <li>Respecter nos obligations légales et réglementaires</li>
                    <li>Analyser l'utilisation de nos services pour les améliorer</li>
                    <li>Vous envoyer des communications marketing (avec votre consentement)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base légale du traitement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Le traitement de vos données repose sur :</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>L'exécution du contrat :</strong> pour fournir nos services</li>
                    <li><strong>Votre consentement :</strong> pour les communications marketing et les cookies non essentiels</li>
                    <li><strong>Notre intérêt légitime :</strong> pour améliorer nos services et assurer leur sécurité</li>
                    <li><strong>Le respect d'obligations légales :</strong> pour la facturation et la comptabilité</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Destinataires des données</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Vos données personnelles sont destinées aux services internes d'ObotCall
                    et peuvent être transmises à :
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Nos sous-traitants techniques (hébergement, infrastructure cloud)</li>
                    <li>Nos prestataires de paiement</li>
                    <li>Nos outils d'analyse et de monitoring</li>
                    <li>Les autorités légales sur demande judiciaire</li>
                  </ul>
                  <p className="mt-4">
                    Tous nos sous-traitants sont soumis à des obligations contractuelles
                    strictes en matière de sécurité et de confidentialité des données.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transfert de données hors UE</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Vos données sont hébergées au sein de l'Union Européenne. Si un transfert
                    hors UE s'avère nécessaire, nous nous assurons que des garanties appropriées
                    sont en place (clauses contractuelles types, Privacy Shield, etc.).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Durée de conservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Nous conservons vos données personnelles :</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Données de compte :</strong> pendant toute la durée de votre abonnement + 3 ans après la fin du contrat</li>
                    <li><strong>Données de facturation :</strong> 10 ans conformément aux obligations comptables</li>
                    <li><strong>Données de navigation :</strong> 13 mois maximum</li>
                    <li><strong>Données marketing :</strong> 3 ans à compter de votre dernier contact</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sécurité des données</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Nous mettons en œuvre des mesures techniques et organisationnelles
                    appropriées pour protéger vos données personnelles :
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Chiffrement des données en transit (HTTPS/TLS) et au repos</li>
                    <li>Authentification renforcée et gestion des accès</li>
                    <li>Surveillance et détection des incidents de sécurité</li>
                    <li>Sauvegardes régulières et plan de continuité d'activité</li>
                    <li>Formation de nos équipes aux bonnes pratiques de sécurité</li>
                    <li>Audits de sécurité réguliers</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vos droits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Conformément au RGPD, vous disposez des droits suivants :
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                    <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
                    <li><strong>Droit à l'effacement :</strong> supprimer vos données dans certaines conditions</li>
                    <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                    <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                    <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                    <li><strong>Droit de retirer votre consentement :</strong> à tout moment</li>
                  </ul>
                  <p className="mt-4">
                    Pour exercer vos droits, contactez-nous à : <strong>dpo@obotcall.com</strong>
                  </p>
                  <p className="mt-2">
                    Vous disposez également du droit d'introduire une réclamation auprès de
                    la CNIL (www.cnil.fr).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cookies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience et analyser
                    l'utilisation de notre site :
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site</li>
                    <li><strong>Cookies analytiques :</strong> pour comprendre l'utilisation du site</li>
                    <li><strong>Cookies marketing :</strong> pour personnaliser les publicités (avec votre consentement)</li>
                  </ul>
                  <p className="mt-4">
                    Vous pouvez gérer vos préférences de cookies via les paramètres de votre
                    navigateur ou notre bannière de consentement.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mineurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Nos services sont destinés aux professionnels et ne s'adressent pas aux
                    personnes de moins de 18 ans. Nous ne collectons pas sciemment de données
                    personnelles concernant des mineurs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Modifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Nous nous réservons le droit de modifier cette politique de confidentialité
                    à tout moment. Les modifications importantes vous seront notifiées par email
                    ou via un avis sur notre site.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>Pour toute question concernant cette politique de confidentialité :</p>
                  <p><strong>Email :</strong> dpo@obotcall.com</p>
                  <p><strong>Adresse :</strong> ObotCall SAS - DPO, 123 Avenue des Champs-Élysées, 75008 Paris</p>
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
