/**
 * EXEMPLE D'INTÉGRATION - Page détail d'intervention
 *
 * Ce fichier montre comment intégrer les composants multi-métiers
 * dans une page d'intervention complète.
 *
 * Pour l'utiliser :
 * 1. Renommer en page.tsx
 * 2. Adapter les imports selon votre structure
 * 3. Ajuster le style selon votre design system
 */

'use client'

import { use, useState } from 'react'
import {
  InterventionTypeSelector,
  InterventionItems
} from '@/components/business'
import { useBusinessType } from '@/hooks'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InterventionDetailPage(props: PageProps) {
  const params = use(props.params)
  const interventionId = params.id

  // État local de l'intervention (à remplacer par votre logique)
  const [intervention, setIntervention] = useState({
    id: interventionId,
    intervention_type_id: null,
    status: 'draft',
    // ... autres champs
  })

  // Récupérer le business type du tenant (depuis contexte/session)
  // const { businessType } = useBusinessType(tenantBusinessTypeId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Intervention #{interventionId}
            </h1>
            <p className="text-gray-600 mt-1">
              Créée le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Annuler
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              Enregistrer
            </button>
          </div>
        </div>

        {/* Type d'intervention */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Type d'intervention</h2>
          <InterventionTypeSelector
            // businessTypeId={businessType?.id}
            value={intervention.intervention_type_id || undefined}
            onChange={(type) => {
              setIntervention(prev => ({
                ...prev,
                intervention_type_id: type.id
              }))
            }}
          />
        </section>

        {/* Détails client */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Client</h2>
          {/* Votre composant de sélection client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du client
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Nom et prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
        </section>

        {/* Planning */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Planning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technicien
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Sélectionner un technicien</option>
              </select>
            </div>
          </div>
        </section>

        {/* Items d'intervention - LE COMPOSANT PRINCIPAL */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <InterventionItems
            interventionId={interventionId}
            readonly={intervention.status === 'completed'}
          />
        </section>

        {/* Notes */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={4}
            placeholder="Notes internes ou observations..."
          />
        </section>

        {/* Actions finales */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600">
            Dernière modification : {new Date().toLocaleString('fr-FR')}
          </div>
          <div className="flex gap-2">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold">
              Brouillon
            </button>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
              Valider l'intervention
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
