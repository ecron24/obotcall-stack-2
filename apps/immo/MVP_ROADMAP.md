# MVP Gestion Locative - Roadmap Technique

**Objectif:** Transformer l'app Immo (générateur de baux) en plateforme légère de gestion locative.

**Stratégie:** Option 1 - MVP Rapide (1-2 semaines) avec modules essentiels.

---

## 📊 État d'avancement global

### ✅ Déjà fait (Session 1)

**Infrastructure:**
- ✅ Tables DB complètes dans `supabase/migrations/003_schema_immo_app.sql`
  - `immo_app.properties` - Gestion des biens
  - `immo_app.lease_parties` - Bailleurs et locataires
  - `immo_app.generated_leases` - Baux avec liens property + parties
  - `immo_app.countries` - Support multi-pays
  - `immo_app.credit_system` - Système de crédits existant

**Site Tech (Auth + Paiements):**
- ✅ Authentification Supabase (login/signup)
- ✅ Intégration Stripe complète
- ✅ Sélection de produits
- ✅ Webhooks abonnements
- ✅ Redirection post-achat vers apps

**App Immo - Base:**
- ✅ Structure Next.js 14 (port 3002)
- ✅ Composants UI (shadcn/ui)
- ✅ Page dashboard existante
- ✅ Module Leases basique (à enrichir)
- ✅ Module Templates
- ✅ Module Credits
- ✅ Sidebar navigation

**Module Properties (WIP):**
- ✅ Server actions CRUD (`apps/immo/src/app/dashboard/properties/actions.ts`)
  - createProperty()
  - updateProperty()
  - deleteProperty()
- ✅ Schéma Zod validation
- ✅ Soft delete pattern
- ⏳ Pages manquantes (list, new, detail)

### 🚧 En cours / À faire (Session 2)

**1. Finaliser Module Properties** ⏳
**2. Créer Module Lease Parties** ❌
**3. Enrichir Module Leases** ❌
**4. Dashboard avec KPIs** ❌
**5. Navigation sidebar** ❌
**6. Tests & Polish** ❌

---

## 🎯 Détails des tâches restantes

### 1. Module Properties - Pages UI (3 fichiers)

#### Fichier 1: `apps/immo/src/app/dashboard/properties/page.tsx`
**Description:** Liste des propriétés avec tableau et filtres

**Structure:**
```tsx
import { createClient } from '@/lib/supabase/server'
import { Card, Table, Button, Badge } from '@/components/ui/*'
import Link from 'next/link'

export default async function PropertiesPage() {
  const supabase = await createClient()

  // Fetch properties with country info
  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      countries (code, name)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header avec bouton "Nouvelle propriété" */}
      <div className="flex justify-between items-center">
        <h1>Propriétés</h1>
        <Link href="/dashboard/properties/new">
          <Button>+ Nouvelle propriété</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>Total: {properties?.length}</Card>
        <Card>Disponibles</Card>
        <Card>Louées</Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Surface</TableHead>
              <TableHead>Pièces</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties?.map(property => (
              <TableRow key={property.id}>
                <TableCell>
                  <Badge>{property.property_type}</Badge>
                </TableCell>
                <TableCell>{property.address_line1}</TableCell>
                <TableCell>{property.city}</TableCell>
                <TableCell>{property.surface_area} m²</TableCell>
                <TableCell>{property.rooms}</TableCell>
                <TableCell>
                  <Link href={`/dashboard/properties/${property.id}`}>
                    Voir
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Empty state si aucune propriété */}
      {properties?.length === 0 && (
        <Card className="text-center py-12">
          <p>Aucune propriété enregistrée</p>
          <Link href="/dashboard/properties/new">
            <Button>Ajouter ma première propriété</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
```

**Imports nécessaires:**
- Table, TableHeader, TableRow, TableHead, TableBody, TableCell
- Badge pour afficher le type de propriété
- Link pour navigation
- Empty state si pas de propriétés

---

#### Fichier 2: `apps/immo/src/app/dashboard/properties/new/page.tsx`
**Description:** Formulaire de création de propriété

**Structure:**
```tsx
import { createProperty } from '../actions'
import { Card, Input, Select, Textarea, Button } from '@/components/ui/*'
import { createClient } from '@/lib/supabase/server'

export default async function NewPropertyPage() {
  const supabase = await createClient()

  // Fetch countries for select
  const { data: countries } = await supabase
    .from('countries')
    .select('id, code, name')
    .eq('is_active', true)
    .order('name')

  return (
    <form action={createProperty}>
      <div className="space-y-6">
        <h1>Nouvelle propriété</h1>

        {/* Type de bien */}
        <Card>
          <CardHeader>Type de bien</CardHeader>
          <CardContent>
            <Select name="property_type" required>
              <option value="apartment">Appartement</option>
              <option value="house">Maison</option>
              <option value="commercial">Commerce</option>
              <option value="office">Bureau</option>
              <option value="parking">Parking</option>
              <option value="storage">Cave/Box</option>
              <option value="land">Terrain</option>
              <option value="other">Autre</option>
            </Select>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader>Localisation</CardHeader>
          <CardContent className="space-y-4">
            <Input name="address_line1" label="Adresse" required />
            <Input name="address_line2" label="Complément d'adresse" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="postal_code" label="Code postal" required />
              <Input name="city" label="Ville" required />
            </div>
            <Select name="country_id" label="Pays" required>
              {countries?.map(country => (
                <option key={country.id} value={country.id}>
                  {country.code} - {country.name}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>Caractéristiques</CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Input name="surface_area" type="number" label="Surface (m²)" />
            <Input name="rooms" type="number" label="Pièces" />
            <Input name="bedrooms" type="number" label="Chambres" />
            <Input name="bathrooms" type="number" label="Salles de bain" />
            <Input name="floor" type="number" label="Étage" />
            <Input name="building_year" type="number" label="Année de construction" />
          </CardContent>
        </Card>

        {/* Performance énergétique */}
        <Card>
          <CardHeader>Performance énergétique</CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Select name="energy_class" label="DPE">
              <option value="">Non renseigné</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
            </Select>
            <Select name="ges_class" label="GES">
              <option value="">Non renseigné</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
            </Select>
          </CardContent>
        </Card>

        {/* Informations complémentaires */}
        <Card>
          <CardHeader>Informations complémentaires</CardHeader>
          <CardContent className="space-y-4">
            <Input name="cadastral_reference" label="Référence cadastrale" />
            <Textarea name="description" label="Description" rows={4} />
            <Textarea name="internal_notes" label="Notes internes" rows={3} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit">Enregistrer</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </div>
    </form>
  )
}
```

**Points clés:**
- Formulaire en sections (Cards)
- Select pour property_type avec toutes les options
- Fetch countries depuis DB pour le select pays
- Validation côté serveur via actions.ts (déjà fait)

---

#### Fichier 3: `apps/immo/src/app/dashboard/properties/[id]/page.tsx`
**Description:** Détail et édition d'une propriété

**Structure:**
```tsx
import { createClient } from '@/lib/supabase/server'
import { updateProperty, deleteProperty } from '../actions'
import { Card, Badge, Button } from '@/components/ui/*'
import { notFound } from 'next/navigation'

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select(`
      *,
      countries (code, name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!property) {
    notFound()
  }

  // Fetch countries for select
  const { data: countries } = await supabase
    .from('countries')
    .select('id, code, name')
    .eq('is_active', true)

  // Bind ID to actions
  const updatePropertyWithId = updateProperty.bind(null, params.id)
  const deletePropertyWithId = deleteProperty.bind(null, params.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>{property.address_line1}</h1>
          <p className="text-muted-foreground">
            {property.city}, {property.countries?.name}
          </p>
        </div>
        <form action={deletePropertyWithId}>
          <Button type="submit" variant="destructive">
            Supprimer
          </Button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Type</div>
            <Badge className="mt-2">{property.property_type}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Surface</div>
            <div className="text-2xl font-bold">{property.surface_area} m²</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Pièces</div>
            <div className="text-2xl font-bold">{property.rooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">DPE</div>
            <Badge>{property.energy_class || 'N/A'}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Edit form - SAME AS NEW PAGE but with defaultValue */}
      <form action={updatePropertyWithId}>
        {/* ... Même structure que new/page.tsx ... */}
        {/* ... Mais avec defaultValue={property.xxx} sur chaque champ ... */}
      </form>
    </div>
  )
}
```

**Points clés:**
- Summary cards en haut avec infos clés
- Formulaire pré-rempli (defaultValue)
- Bouton supprimer avec confirmation
- Réutiliser la structure du formulaire de création

---

### 2. Module Lease Parties (Locataires/Bailleurs)

**Simplification MVP:** Au lieu de créer un module complet, intégrer la création de parties directement dans le formulaire de bail.

#### Fichier: `apps/immo/src/app/dashboard/leases/new/page.tsx` (MODIFIER)

**Ajouter sections:**
```tsx
{/* Section Bailleur */}
<Card>
  <CardHeader>Bailleur (Propriétaire)</CardHeader>
  <CardContent className="space-y-4">
    <Select name="lessor_type">
      <option value="individual">Particulier</option>
      <option value="company">Société</option>
    </Select>

    {/* Si individual */}
    <Input name="lessor_first_name" label="Prénom" />
    <Input name="lessor_last_name" label="Nom" />

    {/* Si company */}
    <Input name="lessor_company_name" label="Raison sociale" />
    <Input name="lessor_siret" label="SIRET" />

    {/* Commun */}
    <Input name="lessor_email" type="email" label="Email" />
    <Input name="lessor_phone" label="Téléphone" />
    <Textarea name="lessor_address" label="Adresse complète" />
  </CardContent>
</Card>

{/* Section Locataire */}
<Card>
  <CardHeader>Locataire</CardHeader>
  <CardContent className="space-y-4">
    {/* Même structure que bailleur */}
  </CardContent>
</Card>
```

**Dans actions.ts, créer les parties avant le bail:**
```tsx
// 1. Créer ou récupérer lessor
const { data: lessor } = await supabase
  .from('lease_parties')
  .insert({
    tenant_id,
    party_type: 'lessor',
    entity_type: formData.get('lessor_type'),
    first_name: formData.get('lessor_first_name'),
    // ... autres champs
  })
  .select()
  .single()

// 2. Créer ou récupérer lessee
const { data: lessee } = await supabase
  .from('lease_parties')
  .insert({
    tenant_id,
    party_type: 'lessee',
    // ...
  })
  .select()
  .single()

// 3. Créer le bail avec les IDs
await supabase
  .from('generated_leases')
  .insert({
    lessor_id: lessor.id,
    lessee_id: lessee.id,
    property_id: formData.get('property_id'),
    // ...
  })
```

---

### 3. Enrichir Module Leases

#### Modifications à faire:

**A) `apps/immo/src/app/dashboard/leases/new/page.tsx`**

**Ajouter en premier:**
```tsx
{/* Sélection de propriété */}
<Card>
  <CardHeader>Propriété concernée</CardHeader>
  <CardContent>
    <Select name="property_id" required>
      <option value="">Sélectionner une propriété</option>
      {properties?.map(p => (
        <option key={p.id} value={p.id}>
          {p.address_line1} - {p.city}
        </option>
      ))}
    </Select>
    <Link href="/dashboard/properties/new">
      <Button variant="link">+ Ajouter une propriété</Button>
    </Link>
  </CardContent>
</Card>
```

**B) `apps/immo/src/app/dashboard/leases/page.tsx`**

**Modifier la query:**
```tsx
const { data: leases } = await supabase
  .from('generated_leases')
  .select(`
    *,
    properties (address_line1, city),
    lessor:lease_parties!lessor_id (first_name, last_name, company_name),
    lessee:lease_parties!lessee_id (first_name, last_name, company_name)
  `)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

**Afficher dans le tableau:**
```tsx
<TableCell>{lease.properties?.address_line1}</TableCell>
<TableCell>
  {lease.lessee?.company_name ||
   `${lease.lessee?.first_name} ${lease.lessee?.last_name}`}
</TableCell>
```

---

### 4. Dashboard avec KPIs

#### Fichier: `apps/immo/src/app/dashboard/page.tsx` (MODIFIER)

**Remplacer le contenu actuel par:**

```tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileText, Euro, TrendingUp, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch KPIs
  const [
    { count: totalProperties },
    { count: activeLeases },
    { count: totalLeases },
    { data: properties },
    { data: leases },
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('generated_leases').select('*', { count: 'exact', head: true }).eq('status', 'completed').is('deleted_at', null),
    supabase.from('generated_leases').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('properties').select('*').is('deleted_at', null),
    supabase.from('generated_leases').select('*, properties(*)').eq('status', 'completed').is('deleted_at', null),
  ])

  // Calculate metrics
  const occupancyRate = totalProperties > 0
    ? Math.round((activeLeases / totalProperties) * 100)
    : 0

  const totalRent = leases?.reduce((sum, lease) => sum + (parseFloat(lease.monthly_rent) || 0), 0) || 0

  // Recent leases
  const recentLeases = await supabase
    .from('generated_leases')
    .select(`
      *,
      properties (address_line1, city),
      lessee:lease_parties!lessee_id (first_name, last_name, company_name)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre activité locative</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propriétés</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Biens enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Baux actifs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases}</div>
            <p className="text-xs text-muted-foreground">
              Contrats en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {activeLeases} / {totalProperties} biens loués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Loyers mensuels</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalRent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total mensuel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Baux récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLeases.data?.map(lease => (
              <div key={lease.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">
                    {lease.lessee?.company_name ||
                     `${lease.lessee?.first_name} ${lease.lessee?.last_name}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lease.properties?.address_line1}, {lease.properties?.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(parseFloat(lease.monthly_rent))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lease.start_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Link href="/dashboard/properties/new">
              <div className="text-center">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Ajouter une propriété</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Link href="/dashboard/leases/new">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Créer un bail</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <Link href="/dashboard/templates">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Gérer les templates</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**KPIs à afficher:**
1. **Nombre de propriétés** - Total des biens
2. **Baux actifs** - Nombre de baux status='completed'
3. **Taux d'occupation** - (baux actifs / propriétés) * 100
4. **Loyers mensuels** - Somme des monthly_rent des baux actifs

---

### 5. Navigation Sidebar

#### Fichier: `apps/immo/src/components/dashboard/sidebar.tsx` (MODIFIER)

**Remplacer les liens par:**

```tsx
const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: Home },
  { name: 'Propriétés', href: '/dashboard/properties', icon: Building2 },
  { name: 'Baux', href: '/dashboard/leases', icon: FileText },
  { name: 'Templates', href: '/dashboard/templates', icon: FileType },
  { name: 'Crédits', href: '/dashboard/credits', icon: CreditCard },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]
```

**Importer icône:**
```tsx
import { Building2 } from 'lucide-react'
```

---

## 🔧 Patterns de code à respecter

### Server Actions
```tsx
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function actionName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Validation Zod
  const validatedData = schema.parse(data)

  // DB operation
  const { error } = await supabase.from('table').insert([...])

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/...')
  redirect('/dashboard/...')
}
```

### Pages avec fetch
```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('table')
    .select('*, related(*)')
    .is('deleted_at', null)

  return <div>...</div>
}
```

### Formulaires
```tsx
<form action={serverAction}>
  <Input name="field_name" label="Label" required />
  <Button type="submit">Enregistrer</Button>
</form>
```

---

## 📦 Fichiers à créer - Checklist

### Module Properties
- [x] `apps/immo/src/app/dashboard/properties/actions.ts`
- [ ] `apps/immo/src/app/dashboard/properties/page.tsx`
- [ ] `apps/immo/src/app/dashboard/properties/new/page.tsx`
- [ ] `apps/immo/src/app/dashboard/properties/[id]/page.tsx`

### Module Leases (enrichir)
- [ ] Modifier `apps/immo/src/app/dashboard/leases/new/page.tsx`
  - Ajouter sélection propriété
  - Ajouter formulaire bailleur
  - Ajouter formulaire locataire
- [ ] Modifier `apps/immo/src/app/dashboard/leases/actions.ts`
  - Créer lease_parties avant bail
  - Lier property_id, lessor_id, lessee_id
- [ ] Modifier `apps/immo/src/app/dashboard/leases/page.tsx`
  - Afficher info propriété
  - Afficher nom locataire
- [ ] Modifier `apps/immo/src/app/dashboard/leases/[id]/page.tsx`
  - Afficher détails propriété
  - Afficher détails parties

### Dashboard
- [ ] Modifier `apps/immo/src/app/dashboard/page.tsx`
  - KPIs cards
  - Recent activity
  - Quick actions

### Navigation
- [ ] Modifier `apps/immo/src/components/dashboard/sidebar.tsx`
  - Ajouter lien Propriétés

---

## 🧪 Tests à faire

Après implémentation:

1. **Properties:**
   - [ ] Créer une propriété
   - [ ] Lister les propriétés
   - [ ] Éditer une propriété
   - [ ] Supprimer une propriété

2. **Leases:**
   - [ ] Créer un bail avec propriété
   - [ ] Créer un bail avec bailleur/locataire
   - [ ] Vérifier les liens dans la liste
   - [ ] Vérifier génération PDF

3. **Dashboard:**
   - [ ] Vérifier calcul KPIs
   - [ ] Vérifier affichage récents
   - [ ] Tester quick actions

4. **Navigation:**
   - [ ] Tous les liens fonctionnent
   - [ ] Active state correct

---

## 🎯 Scope MVP - Ce qu'on NE fait PAS

Pour rester dans le MVP rapide (1-2 semaines):

❌ **Hors scope:**
- App mobile React Native
- Module Paiements récurrents (loyers mensuels)
- Module Maintenance
- Portail Locataire
- Notifications push
- Upload photos propriétés
- Upload documents
- Génération quittances
- Gestion charges locatives
- Historique paiements
- Rapports financiers avancés
- Multi-utilisateurs par tenant
- Permissions granulaires

✅ **Dans scope:**
- CRUD Propriétés (web)
- CRUD Baux liés aux propriétés
- Bailleurs/Locataires (inline dans baux)
- Dashboard KPIs basiques
- Navigation fonctionnelle
- Génération PDF baux (existant)
- Système crédits (existant)

---

## 🚀 Ordre d'exécution recommandé

**Session 2:**

1. **Properties pages** (30 min)
   - page.tsx (liste)
   - new/page.tsx (création)
   - [id]/page.tsx (détail)

2. **Leases enrichment** (45 min)
   - Modifier new/page.tsx (add property select + parties)
   - Modifier actions.ts (create parties logic)
   - Modifier page.tsx (display property + parties)
   - Modifier [id]/page.tsx (show full info)

3. **Dashboard** (20 min)
   - Modifier page.tsx (KPIs + recent + quick actions)

4. **Navigation** (5 min)
   - Modifier sidebar.tsx (add Properties link)

5. **Test & Polish** (20 min)
   - Tester tous les flows
   - Fix bugs
   - Vérifier responsive

6. **Commit & Push** (5 min)
   - Commit final MVP
   - Push sur branche
   - Merger dans main

**Temps total estimé:** ~2h

---

## 📝 Notes importantes

**Schema DB:**
- Toutes les tables sont dans le schema `immo_app`
- Préfixer les noms: `immo_app.properties`, `immo_app.generated_leases`, etc.
- Les `tenant_id` font référence à `public.tenants` (multi-tenancy)
- Soft delete avec `deleted_at`

**Auth:**
- L'auth se fait via le site tech (apps/tech)
- L'app immo assume l'utilisateur déjà connecté
- Récupérer user via `supabase.auth.getUser()`

**Stripe:**
- Les paiements se font via site tech
- L'app immo utilise le système de crédits existant
- 1 crédit = 1 bail généré

**Multi-pays:**
- 8 pays supportés dans `immo_app.countries`
- Chaque propriété est liée à un country_id
- Templates par pays déjà implémentés

---

## ✅ Critères de succès MVP

Le MVP est considéré comme réussi si:

1. ✅ Un utilisateur peut créer une propriété
2. ✅ Un utilisateur peut créer un bail lié à une propriété
3. ✅ Un utilisateur peut voir ses propriétés et baux dans le dashboard
4. ✅ Le dashboard affiche les KPIs basiques
5. ✅ La navigation permet d'accéder à tous les modules
6. ✅ Le système de crédits fonctionne pour générer des baux
7. ✅ L'app est responsive (mobile-first)

---

## 🔄 Session suivante - Quick Start

Pour reprendre le développement en Session 2:

```bash
# 1. Pull latest
git pull origin claude/essayons-a-partir-011CV666KokRQVMd1Dd2dzmz

# 2. Lire ce fichier
cat apps/immo/MVP_ROADMAP.md

# 3. Commencer par Properties pages
# Créer: apps/immo/src/app/dashboard/properties/page.tsx

# 4. Suivre l'ordre d'exécution ci-dessus

# 5. Tester au fur et à mesure
cd apps/immo
npm run dev
# http://localhost:3002
```

---

**Document créé le:** 2025-11-19
**Par:** Claude (Session 1)
**Pour:** Continuation Session 2
**Objectif:** MVP Gestion Locative Immo
**Status:** Ready for implementation
