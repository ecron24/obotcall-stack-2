import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le tenant_id de l'utilisateur
    const { data: userTenant } = await supabase
      .from('user_tenant_roles')
      .select('tenant_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (!userTenant) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 })
    }

    const tenantId = userTenant.tenant_id

    // Parser le form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const separator = formData.get('separator') as string || ';'

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Lire et parser le CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'Le fichier CSV doit contenir au moins une ligne de données' },
        { status: 400 }
      )
    }

    // Extraire headers et data
    const headers = lines[0].split(separator).map(h => h.trim())
    const dataLines = lines.slice(1)

    let successCount = 0
    const errors: string[] = []

    // Valider les headers requis
    const requiredHeaders = ['nom', 'type']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Colonnes manquantes: ${missingHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    // Traiter chaque ligne
    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2 // +2 car ligne 1 = headers
      const line = dataLines[i].trim()
      if (!line) continue

      try {
        const values = line.split(separator).map(v => v.trim())
        const row: Record<string, string> = {}

        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        // Valider les données requises
        if (!row.nom) {
          errors.push(`Ligne ${lineNumber}: nom requis`)
          continue
        }

        if (!row.type) {
          errors.push(`Ligne ${lineNumber}: type requis`)
          continue
        }

        // Préparer les données de l'équipement
        const equipmentData: any = {
          tenant_id: tenantId,
          client_id: row.client_id || null,
          equipment_type: row.type,
          name: row.nom,
          brand: row.marque || null,
          model: row.modele || null,
          serial_number: row.numero_serie || null,
          is_active: true,
          created_by: session.user.id
        }

        // Insérer l'équipement
        const { error: insertError } = await supabase
          .schema('inter_app')
          .from('equipment')
          .insert(equipmentData)

        if (insertError) {
          errors.push(`Ligne ${lineNumber}: ${insertError.message}`)
        } else {
          successCount++
        }
      } catch (error: any) {
        errors.push(`Ligne ${lineNumber}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: successCount,
      total: dataLines.length,
      errors
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
