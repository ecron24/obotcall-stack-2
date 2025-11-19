import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Contactez-nous
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Une question ? Besoin d'une démo ? Notre équipe est là pour vous aider
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="border-t py-16 md:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Envoyez-nous un message</CardTitle>
                  <CardDescription>
                    Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus
                    brefs délais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="Jean"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Dupont"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jean.dupont@exemple.fr"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Nom de votre entreprise"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product">Produit concerné *</Label>
                      <Select name="product" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inter">Inter - Standard téléphonique</SelectItem>
                          <SelectItem value="agent">Agent - CRM Courtier</SelectItem>
                          <SelectItem value="immo">Immo - Générateur de baux</SelectItem>
                          <SelectItem value="multiple">Plusieurs produits</SelectItem>
                          <SelectItem value="autre">Autre demande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet *</Label>
                      <Select name="subject" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un sujet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Demande de démo</SelectItem>
                          <SelectItem value="devis">Demande de devis</SelectItem>
                          <SelectItem value="info">Demande d'information</SelectItem>
                          <SelectItem value="support">Support technique</SelectItem>
                          <SelectItem value="partnership">Partenariat</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={6}
                        placeholder="Décrivez votre demande en détail..."
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="consent"
                        name="consent"
                        required
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="consent" className="text-sm cursor-pointer">
                        J'accepte que mes données soient utilisées pour me recontacter *
                      </Label>
                    </div>

                    <Button type="submit" className="w-full">
                      Envoyer le message
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      * Champs obligatoires
                    </p>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de contact</CardTitle>
                    <CardDescription>
                      Vous pouvez également nous joindre directement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Email</h4>
                        <p className="text-sm text-muted-foreground">contact@obotcall.com</p>
                        <p className="text-sm text-muted-foreground">support@obotcall.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                        <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Téléphone</h4>
                        <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lun-Ven : 9h-18h (heure de Paris)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                        <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Adresse</h4>
                        <p className="text-sm text-muted-foreground">
                          123 Avenue des Champs-Élysées
                          <br />
                          75008 Paris, France
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Horaires d'ouverture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lundi - Vendredi</span>
                        <span className="font-medium">9h00 - 18h00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Samedi</span>
                        <span className="font-medium">10h00 - 16h00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimanche</span>
                        <span className="font-medium">Fermé</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Support technique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pour les urgences techniques en dehors des horaires d'ouverture, nos
                      clients Premium et Enterprise bénéficient d'un support 24/7.
                    </p>
                    <Button variant="outline" className="w-full">
                      Accéder au support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
                Avant de nous contacter
              </h2>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quel est le délai de réponse ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Nous nous engageons à répondre à toutes les demandes sous 24h ouvrées.
                      Les demandes de démo sont généralement traitées sous 4h.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Proposez-vous des formations ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Oui, nous proposons des formations personnalisées pour tous nos produits,
                      à distance ou en présentiel selon vos besoins.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Puis-je obtenir une démo personnalisée ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Absolument ! Nous proposons des démos personnalisées en visioconférence
                      pour vous présenter nos solutions et répondre à vos questions spécifiques.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
