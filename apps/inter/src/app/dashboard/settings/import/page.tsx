'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type TabType = 'products' | 'categories' | 'equipment' | 'clients'

interface ImportStats {
  total: number
  success: number
  errors: string[]
}

export default function ImportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [file, setFile] = useState<File | null>(null)
  const [separator, setSeparator] = useState<',' | ';'>(';')
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabConfig = {
    products: {
      label: 'Produits',
      icon: '📦',
      format: 'code;name;description;type;unit;unit_price_ht;tax_rate;category_id',
      example: 'CHLORE-001;Chlore granulé 5kg;Chlore rapide;product;kg;25.50;20.00;',
      template: '/templates/products_template.csv'
    },
    categories: {
      label: 'Catégories',
      icon: '📁',
      format: 'name;description;parent_id',
      example: 'Produits chimiques;Produits pour traitement eau;',
      template: '/templates/categories_template.csv'
    },
    equipment: {
      label: 'Équipements',
      icon: '🔧',
      format: 'equipment_type;brand;model;serial_number;client_email;installation_date;status',
      example: 'pompe;Hayward;SP2810X15;SN12345;client@email.com;2024-01-15;active',
      template: '/templates/equipment_template.csv'
    },
    clients: {
      label: 'Clients',
      icon: '👥',
      format: 'client_type;first_name;last_name;company_name;email;phone;address_line1;postal_code;city',
      example: 'b2c;Jean;Dupont;;jean.dupont@email.com;0612345678;12 rue de la Paix;75001;Paris',
      template: '/templates/clients_template.csv'
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportStats(null)
      parseCSVPreview(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      setImportStats(null)
      parseCSVPreview(droppedFile)
    }
  }

  const parseCSVPreview = async (csvFile: File) => {
    const text = await csvFile.text()
    const lines = text.split('\n').filter(line => line.trim())
    const rows = lines.slice(0, 6).map(line => line.split(separator))
    setPreview(rows)
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setImportStats(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('separator', separator)

      const response = await fetch(`/api/import/${activeTab}`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'import')
      }

      setImportStats({
        total: result.total || 0,
        success: result.success || 0,
        errors: result.errors || []
      })

      // Reset file after successful import
      if (result.success > 0) {
        setTimeout(() => {
          setFile(null)
          setPreview(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 3000)
      }
    } catch (error: any) {
      setImportStats({
        total: 0,
        success: 0,
        errors: [error.message || 'Erreur inconnue']
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (templatePath: string) => {
    const link = document.createElement('a')
    link.href = templatePath
    link.download = templatePath.split('/').pop() || 'template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentTab = tabConfig[activeTab]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Import de données</h1>
          <p className="mt-1 text-sm text-gray-500">
            Importer des produits, catégories, équipements ou clients en masse
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(Object.keys(tabConfig) as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setFile(null)
                  setPreview(null)
                  setImportStats(null)
                }}
                className={`
                  flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tabConfig[tab].icon}</span>
                <span>{tabConfig[tab].label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* Format CSV */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Format CSV requis</h3>
            <div className="space-y-2">
              <div className="font-mono text-sm text-blue-800 bg-white px-3 py-2 rounded border border-blue-200">
                {currentTab.format}
              </div>
              <div className="text-sm text-blue-700">
                <strong>Exemple :</strong>
                <div className="font-mono text-xs mt-1 bg-white px-3 py-2 rounded border border-blue-200">
                  {currentTab.example}
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Séparateur :</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSeparator(';')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  separator === ';'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Point-virgule (;)
              </button>
              <button
                onClick={() => setSeparator(',')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  separator === ','
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Virgule (,)
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-2">
                <svg
                  className={`mx-auto h-12 w-12 ${file ? 'text-green-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {file ? (
                  <div>
                    <p className="text-green-600 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 font-medium">
                      Glissez votre fichier CSV ici ou cliquez pour sélectionner
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Format .csv uniquement</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">👁️ Aperçu (premières lignes)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'font-semibold bg-blue-100' : 'bg-white'}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border border-gray-200">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Stats */}
          {importStats && (
            <div
              className={`rounded-lg p-4 ${
                importStats.errors.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  importStats.errors.length > 0 ? 'text-red-900' : 'text-green-900'
                }`}
              >
                {importStats.errors.length > 0 ? '⚠️ Import terminé avec erreurs' : '✅ Import réussi'}
              </h3>
              <div className="text-sm space-y-1">
                <p className="text-gray-700">
                  <strong>Total :</strong> {importStats.total} lignes traitées
                </p>
                <p className="text-green-700">
                  <strong>Succès :</strong> {importStats.success} lignes importées
                </p>
                {importStats.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-red-700 font-semibold mb-1">Erreurs :</p>
                    <ul className="list-disc list-inside space-y-1 text-red-600">
                      {importStats.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {importStats.errors.length > 10 && (
                        <li className="text-red-500">
                          ... et {importStats.errors.length - 10} autres erreurs
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className={`
                flex-1 px-6 py-3 rounded-lg font-medium transition-colors
                ${!file || importing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {importing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Import en cours...
                </span>
              ) : (
                '🚀 Lancer l\'import'
              )}
            </button>

            <button
              onClick={() => downloadTemplate(currentTab.template)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              📥 Télécharger le modèle
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 Instructions</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>La première ligne doit contenir les en-têtes de colonnes</li>
              <li>Utilisez le séparateur sélectionné (point-virgule ou virgule)</li>
              <li>Encodage UTF-8 recommandé pour éviter les problèmes d'accents</li>
              <li>Les données seront importées uniquement pour votre entreprise</li>
              <li>Téléchargez le modèle pour voir un exemple complet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
