'use client'

import { useState, useEffect } from 'react'
import { getCompanySettings, updateCompanySettings, type CompanySettings } from '@/lib/actions/settings'

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    legal_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'France',
    siret: '',
    tva_number: '',
    legal_form: 'SARL',
    share_capital: undefined,
    rcs_number: '',
    rcs_city: '',
    invoice_prefix: 'PRO',
    quote_prefix: 'DE',
    intervention_prefix: 'INT',
    payment_delay_days: 30,
    late_penalty_rate: 12,
    recovery_fee: 40,
    business_type_id: '',
    default_labor_rate: 50,
    default_tax_rate: 20,
    default_warranty: '1 an',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#10B981',
    custom_domain: '',
    invoice_footer_note: 'Conditions de paiement : règlement sous 30 jours à compter de la date d\'émission de la facture.',
    legal_mentions: 'En cas de retard de paiement, seront exigibles conformément à l\'article L441-6 du Code de Commerce : une indemnité forfaitaire de 40€ pour frais de recouvrement, ainsi que des pénalités de retard au taux de 12% l\'an (soit 3 fois le taux d\'intérêt légal), applicables dès le lendemain de la date d\'échéance figurant sur la facture. Tout mois commencé est dû en entier. Escompte pour paiement anticipé : néant. Clause de réserve de propriété : les marchandises restent la propriété du vendeur jusqu\'au paiement intégral du prix.',
    terms_and_conditions: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getCompanySettings()

      if (data) {
        setSettings(prev => ({ ...prev, ...data }))
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
      await updateCompanySettings(settings)
      alert('✅ Paramètres enregistrés avec succès')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('❌ Erreur lors de la sauvegarde des paramètres')
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

  // Vérifie si le capital social est requis selon la forme juridique
  const requiresShareCapital = ['SARL', 'SAS', 'SA'].includes(settings.legal_form)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres de l'entreprise</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configuration white label pour vos factures et documents
        </p>
      </div>

      {/* Bouton Sauvegarder en haut */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={saving}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
        </button>
      </div>

      {/* Informations générales */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Informations générales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSetting('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PISCINE DELMAS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@piscine-delmas.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => updateSetting('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="06 87 84 24 99"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <input
              type="url"
              value={settings.website}
              onChange={(e) => updateSetting('website', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://piscine-delmas.fr"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse *
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => updateSetting('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Le bois Simon (les linguettes)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal *
            </label>
            <input
              type="text"
              value={settings.postal_code}
              onChange={(e) => updateSetting('postal_code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="24370"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville *
            </label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => updateSetting('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Pechs de l'esperance"
            />
          </div>
        </div>
      </section>

      {/* Informations légales */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Informations légales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SIRET *
            </label>
            <input
              type="text"
              value={settings.siret}
              onChange={(e) => updateSetting('siret', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="483 093 118"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro TVA *
            </label>
            <input
              type="text"
              value={settings.tva_number}
              onChange={(e) => updateSetting('tva_number', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="FR38483093118"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forme juridique
            </label>
            <select
              value={settings.legal_form}
              onChange={(e) => updateSetting('legal_form', e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="SARL">SARL</option>
              <option value="SAS">SAS</option>
              <option value="SA">SA</option>
              <option value="EURL">EURL</option>
              <option value="SASU">SASU</option>
              <option value="SCI">SCI</option>
              <option value="Auto-Entrepreneur">Auto-Entrepreneur</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capital social
            </label>
            <input
              type="number"
              value={settings.share_capital || ''}
              onChange={(e) => updateSetting('share_capital', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5000"
              disabled={!requiresShareCapital}
            />
            <p className="mt-1 text-xs text-gray-500">
              Uniquement pour SARL, SAS, SA
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro RCS
            </label>
            <input
              type="text"
              value={settings.rcs_number}
              onChange={(e) => updateSetting('rcs_number', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="RCS 483 093 118"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville RCS
            </label>
            <input
              type="text"
              value={settings.rcs_city}
              onChange={(e) => updateSetting('rcs_city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Périgueux"
            />
          </div>
        </div>
      </section>

      {/* Paramètres de facturation */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Paramètres de facturation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Préfixe facture *
            </label>
            <input
              type="text"
              value={settings.invoice_prefix}
              onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PRO"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ex: PRO-2025-0001
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai de paiement (jours) *
            </label>
            <input
              type="number"
              value={settings.payment_delay_days}
              onChange={(e) => updateSetting('payment_delay_days', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux pénalités retard (%) *
            </label>
            <input
              type="number"
              value={settings.late_penalty_rate}
              onChange={(e) => updateSetting('late_penalty_rate', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Légal: 3x taux BCE = 12%
            </p>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indemnité forfaitaire de recouvrement (€) *
            </label>
            <input
              type="number"
              value={settings.recovery_fee}
              onChange={(e) => updateSetting('recovery_fee', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="40"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum légal: 40€
            </p>
          </div>
        </div>
      </section>

      {/* Conditions de vente et mentions légales */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Conditions de vente et mentions légales</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note de bas de page (facture) *
            </label>
            <textarea
              value={settings.invoice_footer_note}
              onChange={(e) => updateSetting('invoice_footer_note', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Conditions de paiement : règlement sous 30 jours à compter de la date d'émission de la facture."
            />
            <p className="mt-1 text-xs text-gray-500">
              Apparaît en bas de chaque facture
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentions légales obligatoires *
            </label>
            <textarea
              value={settings.legal_mentions}
              onChange={(e) => updateSetting('legal_mentions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              placeholder="En cas de retard de paiement, seront exigibles conformément à l'article L441-6 du Code de Commerce..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Pénalités de retard, indemnité de recouvrement, clause de réserve de propriété
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conditions générales de vente (CGV complètes)
            </label>
            <textarea
              value={settings.terms_and_conditions}
              onChange={(e) => updateSetting('terms_and_conditions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
              placeholder="Vos conditions générales de vente complètes (optionnel, peut être ajouté en annexe des devis)..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Optionnel - Peut être ajouté en annexe des devis
            </p>
          </div>
        </div>
      </section>

      {/* Info box White Label */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">📋 Configuration White Label</h3>
            <p className="text-sm text-blue-800">
              Ces paramètres seront utilisés automatiquement dans toutes vos factures, devis et documents officiels.
              Vous pouvez les modifier à tout moment. Les champs marqués d'un astérisque (*) sont obligatoires.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton Sauvegarder en bas */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={saving}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  )
}
