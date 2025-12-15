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
    const requiredHeaders = ['client_type', 'phone', 'address_line1', 'postal_code', 'city']
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
        if (!row.phone) {
          errors.push(`Ligne ${lineNumber}: phone requis`)
          continue
        }

        if (!row.client_type || !['b2b', 'b2c'].includes(row.client_type)) {
          errors.push(`Ligne ${lineNumber}: client_type doit être b2b ou b2c`)
          continue
        }

        const clientType = row.client_type

        // Préparer les données du client
        const clientData: any = {
          tenant_id: tenantId,
          client_type: clientType,
          phone: row.phone,
          email: row.email || null,
          address_line1: row.address_line1,
          postal_code: row.postal_code,
          city: row.city,
          country_code: 'FR',
          is_active: true,
          created_by: session.user.id
        }

        // Ajouter les champs spécifiques selon le type
        if (clientType === 'b2c') {
          // Client particulier
          if (!row.first_name || !row.last_name) {
            errors.push(`Ligne ${lineNumber}: first_name et last_name requis pour client B2C`)
            continue
          }
          clientData.first_name = row.first_name
          clientData.last_name = row.last_name
        } else {
          // Client entreprise
          if (!row.company_name) {
            errors.push(`Ligne ${lineNumber}: company_name requis pour client B2B`)
            continue
          }
          clientData.company_name = row.company_name
          clientData.siret = row.siret || null
          clientData.vat_number = row.vat_number || null
        }

        // Insérer le client
        const { error: insertError } = await supabase
          .schema('inter_app')
          .from('clients')
          .insert(clientData)

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
