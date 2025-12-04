'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessTypeSelector } from '@/components/business'
import type { BusinessType } from '@/types'

interface CompanySettings {
  // Informations de base
  name: string
  legal_name: string
  siret: string
  tva_number: string
  address: string
  postal_code: string
  city: string
  country: string
  phone: string
  email: string
  website: string

  // White Label
  logo_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  custom_domain: string

  // Paramètres métier
  business_type_id: string
  default_labor_rate: number
  default_tax_rate: number
  invoice_prefix: string
  quote_prefix: string
  intervention_prefix: string

  // Conditions
  payment_terms: string
  default_warranty: string
  terms_and_conditions: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function CompanySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null)
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    legal_name: '',
    siret: '',
    tva_number: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#10B981',
    custom_domain: '',
    business_type_id: '',
    default_labor_rate: 50,
    default_tax_rate: 20,
    invoice_prefix: 'FA',
    quote_prefix: 'DE',
    intervention_prefix: 'INT',
    payment_terms: 'Paiement à 30 jours',
    default_warranty: '1 an',
    terms_and_conditions: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/settings/company`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('company_settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
        }
      }

      // Load selected business type
      const savedBusiness = localStorage.getItem('selected_business_type')
      if (savedBusiness) {
        setSelectedBusiness(JSON.parse(savedBusiness))
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`${API_URL}/api/settings/company`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (response.ok) {
        alert('✅ Paramètres enregistrés avec succès')
      } else {
        throw new Error('Erreur lors de la sauvegarde')
      }

      // Also save to localStorage as backup
      localStorage.setItem('company_settings', JSON.stringify(settings))
    } catch (err) {
      console.error('Error saving settings:', err)
      // Fallback to localStorage only
      localStorage.setItem('company_settings', JSON.stringify(settings))
      alert('✅ Paramètres enregistrés localement')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof CompanySettings>(
    key: K,
    value: CompanySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuration Entreprise</h1>
        <p className="mt-1 text-sm text-gray-500">
          ℹ️ Configuration White Label et informations légales
        </p>
      </div>

      {/* Type de métier */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">🔧 Type de métier</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez le type d'activité principale de votre entreprise
        </p>
        <BusinessTypeSelector
          onChange={(business) => {
            setSelectedBusiness(business)
            updateSetting('business_type_id', business.id)
            localStorage.setItem('selected_business_type', JSON.stringify(business))
          }}
        />
        {selectedBusiness && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900">
              {selectedBusiness.emoji} {selectedBusiness.name}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Tarif horaire par défaut: {selectedBusiness.default_labor_rate}€/h
            </div>
          </div>
        )}
      </section>

      {/* Informations légales */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Informations légales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom commercial
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSetting('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mon Entreprise"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison sociale
            </label>
            <input
              type="text"
              value={settings.legal_name}
              onChange={(e) => updateSetting('legal_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mon Entreprise SARL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SIRET
            </label>
            <input
              type="text"
              value={settings.siret}
              onChange={(e) => updateSetting('siret', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 456 789 00012"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro TVA
            </label>
            <input
              type="text"
              value={settings.tva_number}
              onChange={(e) => updateSetting('tva_number', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="FR 12 345678901"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => updateSetting('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 rue de la République"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal
            </label>
            <input
              type="text"
              value={settings.postal_code}
              onChange={(e) => updateSetting('postal_code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="75001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => updateSetting('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paris"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => updateSetting('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@monentreprise.fr"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <input
              type="url"
              value={settings.website}
              onChange={(e) => updateSetting('website', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.monentreprise.fr"
            />
          </div>
        </div>
      </section>

      {/* White Label */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">🎨 White Label</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={settings.logo_url}
              onChange={(e) => updateSetting('logo_url', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
            {settings.logo_url && (
              <div className="mt-2">
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-16 object-contain border border-gray-200 rounded p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur principale
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => updateSetting('primary_color', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => updateSetting('primary_color', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur secondaire
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => updateSetting('secondary_color', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => updateSetting('secondary_color', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#1E40AF"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur accent
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => updateSetting('accent_color', e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accent_color}
                  onChange={(e) => updateSetting('accent_color', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaine personnalisé (optionnel)
            </label>
            <input
              type="text"
              value={settings.custom_domain}
              onChange={(e) => updateSetting('custom_domain', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="app.monentreprise.fr"
            />
            <p className="mt-1 text-xs text-gray-500">
              Configurez un domaine personnalisé pour votre application
            </p>
          </div>
        </div>
      </section>

      {/* Paramètres de facturation */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">💰 Paramètres de facturation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux horaire par défaut (€)
            </label>
            <input
              type="number"
              value={settings.default_labor_rate}
              onChange={(e) => updateSetting('default_labor_rate', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de TVA par défaut (%)
            </label>
            <input
              type="number"
              value={settings.default_tax_rate}
              onChange={(e) => updateSetting('default_tax_rate', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Préfixe factures
            </label>
            <input
              type="text"
              value={settings.invoice_prefix}
              onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="FA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Préfixe devis
            </label>
            <input
              type="text"
              value={settings.quote_prefix}
              onChange={(e) => updateSetting('quote_prefix', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="DE"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Préfixe interventions
            </label>
            <input
              type="text"
              value={settings.intervention_prefix}
              onChange={(e) => updateSetting('intervention_prefix', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="INT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditions de paiement
            </label>
            <input
              type="text"
              value={settings.payment_terms}
              onChange={(e) => updateSetting('payment_terms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paiement à 30 jours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Garantie par défaut
            </label>
            <input
              type="text"
              value={settings.default_warranty}
              onChange={(e) => updateSetting('default_warranty', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1 an"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditions générales de vente
            </label>
            <textarea
              value={settings.terms_and_conditions}
              onChange={(e) => updateSetting('terms_and_conditions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              placeholder="Saisissez vos conditions générales de vente..."
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={loadSettings}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          disabled={saving}
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  )
}
