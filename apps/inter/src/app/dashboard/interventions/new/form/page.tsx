'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProductCatalog } from '@/components/business'

interface InterventionType {
  id: string
  code: string
  name: string
  emoji: string
  business_type_id: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function NewInterventionFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id')
  const isNewClient = searchParams.get('new_client') === 'true'

  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState<any>(null)
  const [businessType, setBusinessType] = useState<any>(null) // Objet complet business type
  const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([])

  // Form data - Client
  const [clientForm, setClientForm] = useState({
    type: 'individual' as 'individual' | 'company',
    civilite: 'M.',
    name: '',
    prenom: '',
    email: '',
    phone_fixe: '',
    phone_mobile: '',
    address: '',
    postal_code: '',
    city: '',
    notes: '',
  })

  // Form data - Piscine (optionnel, selon métier)
  const [poolForm, setPoolForm] = useState({
    has_pool: false,
    pool_type: '',
    pool_volume: '',
    pool_equipment: '',
  })

  // Form data - Intervention
  const [interventionForm, setInterventionForm] = useState({
    date: '',
    heure_debut: '',
    heure_fin: '',
    intervention_types: [] as string[],
    duree_estimee: '',
    taux_horaire: '45.00',
    technician_id: '',
    deplacement_type: 'forfait' as 'forfait' | 'km',
    deplacement_montant: '',
    description: '',
    notes_complementaires: '',
  })

  // Produits sélectionnés
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  // Photos
  const [photos, setPhotos] = useState<File[]>([])

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
    loadBusinessType()
  }, [clientId])

  const loadClient = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setClient(data)
        // Pré-remplir le formulaire
        setClientForm({
          type: data.type || 'individual',
          civilite: 'M.',
          name: data.name || '',
          prenom: data.prenom || '',
          email: data.email || '',
          phone_fixe: data.phone_fixe || '',
          phone_mobile: data.phone || '',
          address: data.address || '',
          postal_code: data.postal_code || '',
          city: data.city || '',
          notes: data.notes || '',
        })
      }
    } catch (err) {
      console.error('Error loading client:', err)
    }
  }

  const loadBusinessType = async () => {
    try {
      // Charger le type de métier depuis localStorage
      const stored = localStorage.getItem('selected_business_type')
      if (stored) {
        const business = JSON.parse(stored)
        setBusinessType(business)
        setInterventionForm(prev => ({
          ...prev,
          taux_horaire: business.default_labor_rate?.toString() || '45.00'
        }))

        // Charger les types d'intervention pour ce métier
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${API_URL}/api/intervention-types?business_type_id=${business.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const types = await response.json()
          setInterventionTypes(Array.isArray(types) ? types : [])
        }
      }
    } catch (err) {
      console.error('Error loading business type:', err)
    }
  }

  const toggleInterventionType = (typeId: string) => {
    setInterventionForm(prev => ({
      ...prev,
      intervention_types: prev.intervention_types.includes(typeId)
        ? prev.intervention_types.filter(t => t !== typeId)
        : [...prev.intervention_types, typeId]
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (isNewClient && !clientForm.name) {
      alert('⚠️ Veuillez remplir le nom du client')
      return
    }

    if (!interventionForm.date) {
      alert('⚠️ Veuillez sélectionner une date')
      return
    }

    if (interventionForm.intervention_types.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins un type d\'intervention')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')

      // 1. Créer le client si nécessaire
      let finalClientId = clientId
      if (isNewClient) {
        const clientResponse = await fetch(`${API_URL}/api/clients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(clientForm)
        })
        if (!clientResponse.ok) throw new Error('Erreur création client')
        const newClient = await clientResponse.json()
        finalClientId = newClient.id
      }

      // 2. Créer l'intervention
      const interventionData = {
        client_id: finalClientId,
        ...interventionForm,
        products: selectedProducts,
        pool: poolForm.has_pool ? poolForm : null,
      }

      const response = await fetch(`${API_URL}/api/interventions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interventionData)
      })

      if (!response.ok) throw new Error('Erreur création intervention')

      const intervention = await response.json()

      // 3. Upload photos si présentes
      if (photos.length > 0) {
        const formData = new FormData()
        photos.forEach(photo => formData.append('photos', photo))

        await fetch(`${API_URL}/api/interventions/${intervention.id}/photos`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
      }

      alert('✅ Intervention créée avec succès !')
      router.push(`/dashboard/interventions/${intervention.id}`)
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/interventions/new"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Retour
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle intervention</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isNewClient ? 'Nouveau client + intervention' : `Client: ${client?.name || 'Chargement...'}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION: Informations Client (si nouveau) */}
        {isNewClient && (
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>👤</span> Informations Client
            </h2>

            {/* Type de client */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de client
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClientForm(prev => ({ ...prev, type: 'individual' }))}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    clientForm.type === 'individual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Particulier
                </button>
                <button
                  type="button"
                  onClick={() => setClientForm(prev => ({ ...prev, type: 'company' }))}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    clientForm.type === 'company'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Professionnel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civilité <span className="text-red-500">*</span>
                </label>
                <select
                  value={clientForm.civilite}
                  onChange={(e) => setClientForm(prev => ({ ...prev, civilite: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                  <option value="Mlle">Mlle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Nom de famille"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={clientForm.prenom}
                  onChange={(e) => setClientForm(prev => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Prénom (optionnel)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone fixe
                </label>
                <input
                  type="tel"
                  value={clientForm.phone_fixe}
                  onChange={(e) => setClientForm(prev => ({ ...prev, phone_fixe: e.target.value }))}
                  placeholder="01 23 45 67 89"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="tel"
                  value={clientForm.phone_mobile}
                  onChange={(e) => setClientForm(prev => ({ ...prev, phone_mobile: e.target.value }))}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="15 rue de la Piscine"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  value={clientForm.postal_code}
                  onChange={(e) => setClientForm(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="75001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={clientForm.city}
                  onChange={(e) => setClientForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Paris"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes client
                </label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) => setClientForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Type de piscine, équipements, remarques..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        )}

        {/* SECTION: Piscine (si métier pisciniste) */}
        {businessType === 'pisciniste' && (
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🏊</span> Piscine <span className="text-sm font-normal text-gray-500">(optionnel)</span>
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>La piscine est optionnelle</strong> - Vous pouvez créer l'intervention sans renseigner de piscine.
                Pour un nouveau client, les informations piscine seront associées automatiquement après création du client.
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setPoolForm(prev => ({ ...prev, has_pool: !prev.has_pool }))}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  !poolForm.has_pool
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">🚫 Pas de piscine pour le moment</div>
                    <div className="text-sm text-gray-600">Continuer sans renseigner de piscine</div>
                  </div>
                  {!poolForm.has_pool && <span className="text-2xl">✔️</span>}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPoolForm(prev => ({ ...prev, has_pool: true }))}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  poolForm.has_pool
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">➕ Créer une piscine maintenant</div>
                    <div className="text-sm text-gray-600">Renseigner les informations de la piscine</div>
                  </div>
                  {poolForm.has_pool && <span className="text-2xl">✔️</span>}
                </div>
              </button>

              {poolForm.has_pool && (
                <div className="mt-4 p-4 border border-blue-200 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de piscine
                    </label>
                    <input
                      type="text"
                      value={poolForm.pool_type}
                      onChange={(e) => setPoolForm(prev => ({ ...prev, pool_type: e.target.value }))}
                      placeholder="Ex: Enterrée, hors-sol..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume (m³)
                    </label>
                    <input
                      type="number"
                      value={poolForm.pool_volume}
                      onChange={(e) => setPoolForm(prev => ({ ...prev, pool_volume: e.target.value }))}
                      placeholder="Ex: 50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Équipements
                    </label>
                    <textarea
                      value={poolForm.pool_equipment}
                      onChange={(e) => setPoolForm(prev => ({ ...prev, pool_equipment: e.target.value }))}
                      rows={3}
                      placeholder="Ex: Pompe Hayward, Filtre à sable..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION: Détails de l'intervention */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🔧</span> Détails de l'intervention
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={interventionForm.date}
                onChange={(e) => setInterventionForm(prev => ({ ...prev, date: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure début
              </label>
              <input
                type="time"
                value={interventionForm.heure_debut}
                onChange={(e) => setInterventionForm(prev => ({ ...prev, heure_debut: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure fin
              </label>
              <input
                type="time"
                value={interventionForm.heure_fin}
                onChange={(e) => setInterventionForm(prev => ({ ...prev, heure_fin: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Types d'intervention - Chargés dynamiquement selon le métier */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type(s) d'intervention <span className="text-red-500">*</span>
            </label>
            {interventionTypes.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement des types...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interventionTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleInterventionType(type.id)}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      interventionForm.intervention_types.includes(type.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-xl mb-1">{type.emoji}</div>
                    {type.name}
                  </button>
                ))}
              </div>
            )}
            {interventionForm.intervention_types.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Sélectionnez au moins un type d'intervention
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée estimée (heures)
              </label>
              <input
                type="number"
                step="0.5"
                value={interventionForm.duree_estimee}
                onChange={(e) => setInterventionForm(prev => ({ ...prev, duree_estimee: e.target.value }))}
                placeholder="2.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux horaire (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={interventionForm.taux_horaire}
                onChange={(e) => setInterventionForm(prev => ({ ...prev, taux_horaire: e.target.value }))}
                placeholder="45.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technicien
            </label>
            <select
              value={interventionForm.technician_id}
              onChange={(e) => setInterventionForm(prev => ({ ...prev, technician_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Non assigné</option>
              {/* Liste des techniciens sera chargée dynamiquement */}
            </select>
          </div>

          {/* Déplacement */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Déplacement
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setInterventionForm(prev => ({ ...prev, deplacement_type: 'forfait' }))}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  interventionForm.deplacement_type === 'forfait'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Forfait
              </button>
              <button
                type="button"
                onClick={() => setInterventionForm(prev => ({ ...prev, deplacement_type: 'km' }))}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  interventionForm.deplacement_type === 'km'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Au km
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              value={interventionForm.deplacement_montant}
              onChange={(e) => setInterventionForm(prev => ({ ...prev, deplacement_montant: e.target.value }))}
              placeholder={interventionForm.deplacement_type === 'forfait' ? 'Montant (€)' : 'Distance (km)'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description des travaux <span className="text-red-500">*</span>
            </label>
            <textarea
              value={interventionForm.description}
              onChange={(e) => setInterventionForm(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={4}
              placeholder="Détails de l'intervention..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* SECTION: Produits utilisés */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Produits utilisés</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez une catégorie pour ajouter des produits
          </p>
          {/* Le composant ProductCatalog sera intégré ici */}
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Fonctionnalité disponible après création de l'intervention</p>
          </div>
        </section>

        {/* SECTION: Notes complémentaires */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Notes complémentaires</h2>
          <textarea
            value={interventionForm.notes_complementaires}
            onChange={(e) => setInterventionForm(prev => ({ ...prev, notes_complementaires: e.target.value }))}
            rows={4}
            placeholder="Observations, recommandations..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </section>

        {/* SECTION: Photos */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📷</span> Photos <span className="text-sm font-normal text-gray-500">(optionnel)</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-colors">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm font-medium text-gray-700">Prendre une photo</div>
              <div className="text-xs text-gray-500">Caméra</div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
              <div className="text-4xl mb-2">📁</div>
              <div className="text-sm font-medium text-gray-700">Choisir fichier(s)</div>
              <div className="text-xs text-gray-500">Galerie</div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>
          {photos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">{photos.length} photo(s) sélectionnée(s)</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="text-xs bg-gray-100 px-3 py-1 rounded">
                    {photo.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">JPG, PNG • Max 5MB par photo</p>
        </section>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/interventions/new"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Retour
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-lg shadow-md"
            >
              {loading ? '⏳ Création...' : '✔️ Créer l\'intervention'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
