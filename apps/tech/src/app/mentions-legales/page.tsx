import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MentionsLegalesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Mentions légales</h1>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Éditeur du site</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Raison sociale :</strong> ObotCall SAS</p>
                  <p><strong>Forme juridique :</strong> Société par Actions Simplifiée</p>
                  <p><strong>Capital social :</strong> 50 000 €</p>
                  <p><strong>Siège social :</strong> 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
                  <p><strong>RCS :</strong> Paris B 123 456 789</p>
                  <p><strong>SIRET :</strong> 123 456 789 00012</p>
                  <p><strong>N° TVA intracommunautaire :</strong> FR12 123456789</p>
                  <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
                  <p><strong>Email :</strong> contact@obotcall.com</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Directeur de la publication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Nom :</strong> [Nom du directeur]</p>
                  <p><strong>Fonction :</strong> Président</p>
                  <p><strong>Email :</strong> direction@obotcall.com</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hébergement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Hébergeur :</strong> [Nom de l'hébergeur]</p>
                  <p><strong>Adresse :</strong> [Adresse de l'hébergeur]</p>
                  <p><strong>Téléphone :</strong> [Téléphone de l'hébergeur]</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Propriété intellectuelle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    L'ensemble de ce site relève de la législation française et internationale
                    sur le droit d'auteur et la propriété intellectuelle. Tous les droits de
                    reproduction sont réservés, y compris pour les documents téléchargeables et
                    les représentations iconographiques et photographiques.
                  </p>
                  <p>
                    La reproduction de tout ou partie de ce site sur un support électronique
                    quel qu'il soit est formellement interdite sauf autorisation expresse du
                    directeur de la publication.
                  </p>
                  <p>
                    Les marques ObotCall, Inter, Agent et Immo sont des marques déposées.
                    Toute reproduction non autorisée de ces marques, logos et signes
                    constitue une contrefaçon passible de sanctions pénales.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Données personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Les informations recueillies sur ce site sont enregistrées dans un
                    fichier informatisé par ObotCall pour la gestion de la relation client
                    et l'amélioration de nos services.
                  </p>
                  <p>
                    Conformément à la loi « informatique et libertés » et au RGPD, vous
                    pouvez exercer votre droit d'accès, de rectification, d'opposition,
                    de limitation, de portabilité et d'effacement des données vous concernant
                    en nous contactant à l'adresse : dpo@obotcall.com
                  </p>
                  <p>
                    Pour plus d'informations, consultez notre{' '}
                    <a href="/confidentialite" className="text-primary hover:underline">
                      politique de confidentialité
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cookies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Ce site utilise des cookies pour améliorer l'expérience utilisateur et
                    réaliser des statistiques de visites.
                  </p>
                  <p>
                    Vous pouvez vous opposer à l'enregistrement de cookies en configurant
                    votre navigateur. Cependant, cela peut affecter votre expérience de
                    navigation sur le site.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Responsabilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Les informations fournies sur ce site le sont à titre indicatif. ObotCall
                    s'efforce d'assurer l'exactitude et la mise à jour des informations
                    diffusées sur ce site, dont elle se réserve le droit de corriger le
                    contenu à tout moment et sans préavis.
                  </p>
                  <p>
                    ObotCall ne saurait être tenue responsable de l'utilisation faite de ces
                    informations, et de tout préjudice direct ou indirect pouvant en découler.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liens hypertextes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Ce site peut contenir des liens hypertextes vers d'autres sites. ObotCall
                    n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant
                    à leur contenu.
                  </p>
                  <p>
                    La création de liens vers ce site est soumise à l'accord préalable d'ObotCall.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Droit applicable et juridiction compétente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Les présentes mentions légales sont régies par le droit français. En cas
                    de litige et à défaut d'accord amiable, le litige sera porté devant les
                    tribunaux français conformément aux règles de compétence en vigueur.
                  </p>
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
