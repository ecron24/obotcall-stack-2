import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Building2, TrendingUp, Euro, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get tenant_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  if (!tenant) {
    return <div>Tenant non trouvé</div>
  }

  // Fetch KPIs
  const { count: totalProperties } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)

  const { data: activeLeases } = await supabase
    .from('generated_leases')
    .select('*, properties(address_line1, city)')
    .eq('tenant_id', tenant.id)
    .in('status', ['active', 'generated'])
    .is('deleted_at', null)

  // Calculate occupancy rate
  const activeLeaseCount = activeLeases?.length || 0
  const occupancyRate = totalProperties && totalProperties > 0
    ? Math.round((activeLeaseCount / totalProperties) * 100)
    : 0

  // Calculate total monthly rent
  const totalMonthlyRent = activeLeases?.reduce((sum, lease) => {
    return sum + (parseFloat(lease.monthly_rent) || 0)
  }, 0) || 0

  // Fetch recent leases
  const { data: recentLeases } = await supabase
    .from('generated_leases')
    .select(`
      *,
      properties(address_line1, city),
      lease_parties!generated_leases_lessee_id_fkey(first_name, last_name, company_name)
    `)
    .eq('tenant_id', tenant.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre gestion locative
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biens</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              Biens immobiliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baux Actifs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeaseCount}</div>
            <p className="text-xs text-muted-foreground">
              Contrats en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {activeLeaseCount}/{totalProperties || 0} biens loués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyers Mensuels</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonthlyRent.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">
              Revenus mensuels totaux
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau bien
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/leases/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau bail
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Leases */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Baux Récents</CardTitle>
            <CardDescription>Derniers baux créés</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeases && recentLeases.length > 0 ? (
              <div className="space-y-4">
                {recentLeases.map((lease: any) => (
                  <Link
                    key={lease.id}
                    href={`/dashboard/leases/${lease.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {lease.lease_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lease.properties?.address_line1}, {lease.properties?.city}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Locataire: {lease.lease_parties?.company_name ||
                          `${lease.lease_parties?.first_name} ${lease.lease_parties?.last_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{lease.monthly_rent} €/mois</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lease.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun bail créé</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
