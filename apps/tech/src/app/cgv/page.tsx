import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CGVPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8">
              Conditions Générales de Vente
            </h1>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Objet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Les présentes Conditions Générales de Vente (CGV) régissent les relations
                    commerciales entre ObotCall SAS et ses clients pour la vente de services
                    SaaS (Inter, Agent, Immo). Elles complètent les Conditions Générales
                    d'Utilisation (CGU).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Offres et tarifs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">2.1 Description des offres</h4>
                  <p className="text-muted-foreground">
                    Les caractéristiques principales des Services sont présentées sur notre
                    site internet. Nous nous réservons le droit de modifier nos offres à
                    tout moment.
                  </p>

                  <h4 className="font-semibold">2.2 Prix</h4>
                  <p className="text-muted-foreground">
                    Les prix sont indiqués en euros (€) hors taxes. Ils sont majorés de la
                    TVA applicable au jour de la commande. Nous nous réservons le droit de
                    modifier nos tarifs à tout moment, sous réserve d'en informer le client
                    au moins 30 jours avant la prise d'effet.
                  </p>

                  <h4 className="font-semibold">2.3 Formules d'abonnement</h4>
                  <p className="text-muted-foreground mb-2">Trois formules sont proposées :</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li><strong>Mensuel :</strong> engagement au mois, résiliable à tout moment</li>
                    <li><strong>Annuel :</strong> engagement sur 12 mois avec réduction tarifaire</li>
                    <li><strong>Enterprise :</strong> tarification sur mesure avec engagement contractuel</li>
                  </ul>

                  <h4 className="font-semibold">2.4 Promotions</h4>
                  <p className="text-muted-foreground">
                    Les promotions et offres spéciales sont valables dans la limite des stocks
                    disponibles et pour une durée déterminée. Elles ne sont pas cumulables sauf
                    mention contraire.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Commande et souscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">3.1 Processus de commande</h4>
                  <p className="text-muted-foreground">
                    La souscription s'effectue en ligne via notre site internet. Le client
                    choisit son offre, crée son compte, et procède au paiement. La commande
                    n'est définitive qu'après validation du paiement.
                  </p>

                  <h4 className="font-semibold">3.2 Validation de la commande</h4>
                  <p className="text-muted-foreground">
                    Un email de confirmation est envoyé au client après validation de la
                    commande. Cet email récapitule les éléments de la commande et constitue
                    la preuve du contrat.
                  </p>

                  <h4 className="font-semibold">3.3 Essai gratuit</h4>
                  <p className="text-muted-foreground">
                    Une période d'essai gratuite de 14 jours est proposée. Aucune carte
                    bancaire n'est requise. À l'issue de la période d'essai, le service
                    est automatiquement désactivé sauf souscription à un abonnement payant.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">4.1 Modalités de paiement</h4>
                  <p className="text-muted-foreground mb-2">Les paiements peuvent être effectués par :</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Carte bancaire (Visa, Mastercard, American Express)</li>
                    <li>Prélèvement SEPA (pour abonnements récurrents)</li>
                    <li>Virement bancaire (pour plans Enterprise sur facture)</li>
                  </ul>

                  <h4 className="font-semibold">4.2 Sécurité</h4>
                  <p className="text-muted-foreground">
                    Les paiements par carte bancaire sont sécurisés et traités par notre
                    prestataire de paiement certifié PCI-DSS. ObotCall ne stocke aucune
                    donnée bancaire.
                  </p>

                  <h4 className="font-semibold">4.3 Renouvellement automatique</h4>
                  <p className="text-muted-foreground">
                    Les abonnements se renouvellent automatiquement à échéance. Le paiement
                    est prélevé automatiquement sauf résiliation préalable.
                  </p>

                  <h4 className="font-semibold">4.4 Défaut de paiement</h4>
                  <p className="text-muted-foreground">
                    En cas de défaut de paiement, l'accès aux Services est suspendu après
                    relance. Si le défaut persiste plus de 15 jours, le compte peut être
                    définitivement fermé.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Facturation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">5.1 Émission des factures</h4>
                  <p className="text-muted-foreground">
                    Une facture est émise pour chaque paiement et envoyée par email. Elle
                    est également accessible depuis votre espace client.
                  </p>

                  <h4 className="font-semibold">5.2 Mentions légales</h4>
                  <p className="text-muted-foreground">
                    Les factures comportent toutes les mentions légales requises : numéro de
                    facture, date, identité du vendeur et de l'acheteur, montant HT, TVA,
                    montant TTC.
                  </p>

                  <h4 className="font-semibold">5.3 Conservation</h4>
                  <p className="text-muted-foreground">
                    Les factures sont conservées pendant 10 ans conformément aux obligations
                    légales.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Droit de rétractation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">6.1 Délai de rétractation</h4>
                  <p className="text-muted-foreground">
                    Pour les clients consommateurs (non professionnels), un droit de
                    rétractation de 14 jours s'applique conformément au Code de la
                    Consommation.
                  </p>

                  <h4 className="font-semibold">6.2 Exercice du droit</h4>
                  <p className="text-muted-foreground">
                    Pour exercer ce droit, contactez-nous à : support@obotcall.com avec
                    vos références de commande.
                  </p>

                  <h4 className="font-semibold">6.3 Remboursement</h4>
                  <p className="text-muted-foreground">
                    En cas de rétractation, le remboursement intervient dans un délai de
                    14 jours par le même moyen de paiement que celui utilisé pour la
                    commande.
                  </p>

                  <h4 className="font-semibold">6.4 Exclusion</h4>
                  <p className="text-muted-foreground">
                    Le droit de rétractation ne s'applique pas aux clients professionnels
                    ni aux services pleinement exécutés avant la fin du délai avec accord
                    exprès du client.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Résiliation et remboursement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">7.1 Résiliation par le client</h4>
                  <p className="text-muted-foreground">
                    Le client peut résilier son abonnement à tout moment depuis son espace
                    client. La résiliation prend effet à la fin de la période payée en cours.
                  </p>

                  <h4 className="font-semibold">7.2 Absence de remboursement</h4>
                  <p className="text-muted-foreground">
                    Les sommes versées pour la période en cours ne sont pas remboursables,
                    sauf exercice du droit de rétractation ou résiliation pour faute d'ObotCall.
                  </p>

                  <h4 className="font-semibold">7.3 Crédits Immo</h4>
                  <p className="text-muted-foreground">
                    Les crédits achetés pour le service Immo sont valables 12 mois à compter
                    de leur date d'achat. Ils ne sont ni remboursables ni transférables.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Niveau de service (SLA)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">8.1 Disponibilité</h4>
                  <p className="text-muted-foreground mb-2">
                    Nous nous engageons sur les niveaux de disponibilité suivants :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li><strong>Plans Starter/Solo :</strong> 99% de disponibilité</li>
                    <li><strong>Plans Pro/Team :</strong> 99,5% de disponibilité</li>
                    <li><strong>Plans Enterprise :</strong> 99,9% de disponibilité avec SLA dédié</li>
                  </ul>

                  <h4 className="font-semibold">8.2 Maintenance</h4>
                  <p className="text-muted-foreground">
                    Des opérations de maintenance programmées peuvent nécessiter des
                    interruptions de service. Nous nous efforçons de les planifier en
                    dehors des heures ouvrées et d'en informer les clients 48h à l'avance.
                  </p>

                  <h4 className="font-semibold">8.3 Compensation</h4>
                  <p className="text-muted-foreground">
                    En cas de non-respect des SLA, les clients Enterprise peuvent prétendre
                    à une compensation selon les termes de leur contrat spécifique.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Support et assistance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">9.1 Niveaux de support</h4>
                  <p className="text-muted-foreground mb-2">Le support varie selon les plans :</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li><strong>Starter/Solo :</strong> Support email en jours ouvrés</li>
                    <li><strong>Pro/Team :</strong> Support prioritaire email et chat</li>
                    <li><strong>Enterprise :</strong> Support dédié 24/7 avec gestionnaire de compte</li>
                  </ul>

                  <h4 className="font-semibold">9.2 Délais de réponse</h4>
                  <p className="text-muted-foreground">
                    Nous nous engageons à répondre aux demandes de support sous 24h ouvrées
                    pour les plans standards, et sous 4h pour les plans Enterprise.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Garanties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">10.1 Conformité</h4>
                  <p className="text-muted-foreground">
                    Les Services sont fournis conformément aux descriptions présentées
                    sur notre site. ObotCall garantit la conformité des Services aux
                    fonctionnalités annoncées.
                  </p>

                  <h4 className="font-semibold">10.2 Sécurité</h4>
                  <p className="text-muted-foreground">
                    Nous mettons en œuvre les mesures de sécurité appropriées pour protéger
                    vos données conformément aux standards de l'industrie et au RGPD.
                  </p>

                  <h4 className="font-semibold">10.3 Limitation</h4>
                  <p className="text-muted-foreground">
                    Les Services sont fournis "en l'état". ObotCall ne garantit pas que les
                    Services seront ininterrompus, exempts d'erreurs ou totalement sécurisés.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Responsabilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    La responsabilité d'ObotCall est limitée conformément aux dispositions
                    des CGU. En particulier :
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Responsabilité limitée aux dommages directs</li>
                    <li>Exclusion des dommages indirects</li>
                    <li>Plafonnement au montant payé sur les 12 derniers mois</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Force majeure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ObotCall ne saurait être tenue responsable de l'inexécution de ses
                    obligations en cas de force majeure telle que définie par la jurisprudence
                    française (catastrophe naturelle, guerre, grève, panne généralisée,
                    attaque informatique massive, etc.).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>13. Propriété intellectuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Les dispositions relatives à la propriété intellectuelle figurent dans
                    les CGU et s'appliquent également dans le cadre des présentes CGV.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>14. Données personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Le traitement des données personnelles est régi par notre{' '}
                    <a href="/confidentialite" className="text-primary hover:underline">
                      Politique de confidentialité
                    </a>
                    , conforme au RGPD.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>15. Médiation et règlement des litiges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">15.1 Médiation consommateur</h4>
                  <p className="text-muted-foreground">
                    Conformément à l'article L.612-1 du Code de la consommation, les clients
                    consommateurs peuvent recourir gratuitement à un service de médiation en
                    cas de litige.
                  </p>

                  <h4 className="font-semibold">15.2 Juridiction compétente</h4>
                  <p className="text-muted-foreground">
                    Pour les clients professionnels, tout litige sera soumis aux tribunaux
                    compétents de Paris. Pour les consommateurs, les juridictions compétentes
                    sont celles prévues par le Code de la consommation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>16. Modifications des CGV</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ObotCall se réserve le droit de modifier les présentes CGV à tout moment.
                    Les modifications seront notifiées aux clients par email au moins 30 jours
                    avant leur entrée en vigueur. Les CGV applicables sont celles en vigueur
                    à la date de la commande.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>17. Acceptation des CGV</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    La souscription à nos Services implique l'acceptation sans réserve des
                    présentes CGV et des CGU. Le client reconnaît avoir pris connaissance
                    de ces conditions et les avoir acceptées en cochant la case prévue à
                    cet effet lors de la commande.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>18. Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>Pour toute question concernant ces CGV :</p>
                  <p><strong>Service commercial :</strong> ventes@obotcall.com</p>
                  <p><strong>Service client :</strong> support@obotcall.com</p>
                  <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
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
