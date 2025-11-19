import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Building2, MapPin, Ruler, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/server'
import { updateProperty, deleteProperty } from '../actions'

async function getProperty(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  if (!tenant) {
    throw new Error('Tenant non trouvé')
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      countries (
        id,
        name,
        code
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)
    .single()

  if (error || !property) {
    return null
  }

  return property
}

async function getCountries() {
  const supabase = await createClient()

  const { data: countries } = await supabase
    .from('countries')
    .select('id, name, code')
    .order('name')

  return countries || []
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, countries] = await Promise.all([
    getProperty(params.id),
    getCountries(),
  ])

  if (!property) {
    notFound()
  }

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Appartement',
    house: 'Maison',
    commercial: 'Local commercial',
    office: 'Bureau',
    parking: 'Parking',
    storage: 'Box / Cave',
    land: 'Terrain',
    other: 'Autre',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {propertyTypeLabels[property.property_type] || property.property_type}
          </h1>
          <p className="text-muted-foreground">
            {property.address_line1}, {property.city}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyTypeLabels[property.property_type] || property.property_type}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surface</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {property.surface_area ? `${property.surface_area} m²` : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pièces</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {property.rooms || '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localisation</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.city}</div>
            <p className="text-xs text-muted-foreground">{property.postal_code}</p>
          </CardContent>
        </Card>
      </div>

      <form action={updateProperty.bind(null, params.id)}>
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
                    defaultValue={property.property_type}
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
                    defaultValue={property.address_line1}
                    placeholder="123 rue de la République"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Complément d'adresse</Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    defaultValue={property.address_line2 || ''}
                    placeholder="Bâtiment A, Appartement 12"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      defaultValue={property.postal_code}
                      placeholder="75001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={property.city}
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
                    defaultValue={property.country_id}
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
                      defaultValue={property.surface_area || ''}
                      placeholder="75.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rooms">Nombre de pièces</Label>
                    <Input
                      id="rooms"
                      name="rooms"
                      type="number"
                      defaultValue={property.rooms || ''}
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
                      defaultValue={property.bedrooms || ''}
                      placeholder="2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Salles de bain</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      defaultValue={property.bathrooms || ''}
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
                      defaultValue={property.floor || ''}
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="building_year">Année de construction</Label>
                    <Input
                      id="building_year"
                      name="building_year"
                      type="number"
                      defaultValue={property.building_year || ''}
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
                      defaultValue={property.energy_class || ''}
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
                      defaultValue={property.ges_class || ''}
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
                    defaultValue={property.cadastral_reference || ''}
                    placeholder="AB 123 456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={property.description || ''}
                    placeholder="Description du bien..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Notes internes</Label>
                  <Textarea
                    id="internal_notes"
                    name="internal_notes"
                    defaultValue={property.internal_notes || ''}
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
                  Enregistrer
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
                <CardTitle>Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={deleteProperty.bind(null, params.id)}>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer le bien
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métadonnées</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Créé le:</strong>{' '}
                  {new Date(property.created_at).toLocaleDateString('fr-FR')}
                </p>
                {property.updated_at && (
                  <p>
                    <strong>Modifié le:</strong>{' '}
                    {new Date(property.updated_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
