import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Building2, Home, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

async function getProperties() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  // Get tenant_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  if (!tenant) {
    throw new Error('Tenant non trouvé')
  }

  // Get all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      *,
      countries (
        name
      )
    `)
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  return properties || []
}

async function getStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, available: 0, rented: 0 }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  if (!tenant) return { total: 0, available: 0, rented: 0 }

  // Count total properties
  const { count: total } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)

  // Count rented properties (those with active leases)
  const { data: activeLeases } = await supabase
    .from('generated_leases')
    .select('property_id')
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'generated'])
    .is('deleted_at', null)

  const rentedPropertyIds = new Set(activeLeases?.map(l => l.property_id) || [])
  const rented = rentedPropertyIds.size

  return {
    total: total || 0,
    rented,
    available: (total || 0) - rented,
  }
}

function PropertyTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'apartment':
      return <Building2 className="h-4 w-4" />
    case 'house':
      return <Home className="h-4 w-4" />
    case 'commercial':
    case 'office':
      return <Briefcase className="h-4 w-4" />
    default:
      return <Building2 className="h-4 w-4" />
  }
}

function PropertyTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    apartment: 'Appartement',
    house: 'Maison',
    commercial: 'Commercial',
    office: 'Bureau',
    parking: 'Parking',
    storage: 'Box/Cave',
    land: 'Terrain',
    other: 'Autre',
  }
  return <span>{labels[type] || type}</span>
}

async function PropertiesContent() {
  const [properties, stats] = await Promise.all([
    getProperties(),
    getStats(),
  ])

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biens</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Home className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loués</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rented}</div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun bien immobilier</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commencez par ajouter votre premier bien
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un bien
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mes Biens Immobiliers</CardTitle>
            <CardDescription>
              Gérez votre parc immobilier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Adresse</th>
                    <th className="text-left py-3 px-4 font-medium">Ville</th>
                    <th className="text-left py-3 px-4 font-medium">Surface</th>
                    <th className="text-left py-3 px-4 font-medium">Pièces</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <PropertyTypeIcon type={property.property_type} />
                          <PropertyTypeBadge type={property.property_type} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate">
                          {property.address_line1}
                          {property.address_line2 && `, ${property.address_line2}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {property.city}
                        <div className="text-xs text-muted-foreground">
                          {property.postal_code}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {property.surface_area ? `${property.surface_area} m²` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {property.rooms ? `${property.rooms} pièce${property.rooms > 1 ? 's' : ''}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/properties/${property.id}`}>
                            Voir
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biens Immobiliers</h1>
          <p className="text-muted-foreground">
            Gérez votre parc immobilier
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau bien
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <PropertiesContent />
      </Suspense>
    </div>
  )
}
