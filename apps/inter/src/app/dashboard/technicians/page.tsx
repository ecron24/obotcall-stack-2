'use client'

export default function TechniciansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Techniciens</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez votre équipe de techniciens
        </p>
      </div>

      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <span className="text-6xl mb-4 block">👷</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Section en développement
        </h3>
        <p className="text-gray-500">
          La gestion des techniciens sera bientôt disponible
        </p>
      </div>
    </div>
  )
}
