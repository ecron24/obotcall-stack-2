import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/server'
import { createProperty } from '../actions'

async function getCountries() {
  const supabase = await createClient()

  const { data: countries } = await supabase
    .from('countries')
    .select('id, name, code')
    .order('name')

  return countries || []
}

export default async function NewPropertyPage() {
  const countries = await getCountries()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Bien</h1>
          <p className="text-muted-foreground">
            Ajoutez un bien à votre parc immobilier
          </p>
        </div>
      </div>

      <form action={createProperty}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type de bien */}
            <Card>
              <CardHeader>
                <CardTitle>Type de bien</CardTitle>
                <CardDescription>Sélectionnez le type de bien immobilier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property_type">Type *</Label>
                  <select
                    id="property_type"
                    name="property_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Sélectionnez un type</option>
                    <option value="apartment">Appartement</option>
                    <option value="house">Maison</option>
                    <option value="commercial">Local commercial</option>
                    <option value="office">Bureau</option>
                    <option value="parking">Parking</option>
                    <option value="storage">Box / Cave</option>
                    <option value="land">Terrain</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Adresse */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
                <CardDescription>Localisation du bien</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Adresse *</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    placeholder="123 rue de la République"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Complément d'adresse</Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    placeholder="Bâtiment A, Appartement 12"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      placeholder="75001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Paris"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country_id">Pays *</Label>
                  <select
                    id="country_id"
                    name="country_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Sélectionnez un pays</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Caractéristiques */}
            <Card>
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
                <CardDescription>Détails du bien</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="surface_area">Surface (m²)</Label>
                    <Input
                      id="surface_area"
                      name="surface_area"
                      type="number"
                      step="0.01"
                      placeholder="75.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rooms">Nombre de pièces</Label>
                    <Input
                      id="rooms"
                      name="rooms"
                      type="number"
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Chambres</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      placeholder="2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Salles de bain</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="floor">Étage</Label>
                    <Input
                      id="floor"
                      name="floor"
                      type="number"
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="building_year">Année de construction</Label>
                    <Input
                      id="building_year"
                      name="building_year"
                      type="number"
                      placeholder="2010"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diagnostics énergétiques */}
            <Card>
              <CardHeader>
                <CardTitle>Performance énergétique</CardTitle>
                <CardDescription>DPE et GES</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="energy_class">Classe énergétique (DPE)</Label>
                    <select
                      id="energy_class"
                      name="energy_class"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Non renseigné</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="G">G</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ges_class">Classe GES</Label>
                    <select
                      id="ges_class"
                      name="ges_class"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Non renseigné</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="G">G</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations complémentaires */}
            <Card>
              <CardHeader>
                <CardTitle>Informations complémentaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cadastral_reference">Référence cadastrale</Label>
                  <Input
                    id="cadastral_reference"
                    name="cadastral_reference"
                    placeholder="AB 123 456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description du bien..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Notes internes</Label>
                  <Textarea
                    id="internal_notes"
                    name="internal_notes"
                    placeholder="Notes privées (non visibles dans les documents)..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full">
                  Créer le bien
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/properties">
                    Annuler
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aide</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Les champs marqués d'un astérisque (*) sont obligatoires.
                </p>
                <p>
                  Les autres informations peuvent être complétées ultérieurement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
