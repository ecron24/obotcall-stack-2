#!/usr/bin/env node

/**
 * Script pour générer un fichier SQL combiné de toutes les migrations
 *
 * Usage: node scripts/generate-migration-sql.js [migration-range]
 *
 * Examples:
 *   node scripts/generate-migration-sql.js           # Génère toutes les migrations
 *   node scripts/generate-migration-sql.js 016       # Génère uniquement la migration 016
 *   node scripts/generate-migration-sql.js 016-020   # Génère les migrations 016 à 020
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations')
const OUTPUT_FILE = path.join(__dirname, '../supabase/combined-migrations.sql')

// Parse command line arguments
const args = process.argv.slice(2)
let migrationFilter = null

if (args.length > 0) {
  const arg = args[0]
  if (arg.includes('-')) {
    // Range: 016-020
    const [start, end] = arg.split('-').map(Number)
    migrationFilter = (num) => num >= start && num <= end
  } else {
    // Single migration: 016
    const num = parseInt(arg)
    migrationFilter = (n) => n === num
  }
}

/**
 * Get list of migration files
 */
function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()

  if (migrationFilter) {
    return files.filter(file => {
      const match = file.match(/^(\d+)_/)
      if (match) {
        const num = parseInt(match[1])
        return migrationFilter(num)
      }
      return false
    })
  }

  return files
}

/**
 * Main function
 */
function main() {
  console.log('📝 Supabase Migration SQL Generator')
  console.log('=' .repeat(50))

  const migrationFiles = getMigrationFiles()

  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migrations found')
    return
  }

  console.log(`\n📋 Found ${migrationFiles.length} migration(s):\n`)
  migrationFiles.forEach(file => console.log(`   ✓ ${file}`))

  let combinedSQL = `-- ============================================
-- COMBINED MIGRATIONS
-- Generated: ${new Date().toISOString()}
-- Total migrations: ${migrationFiles.length}
-- ============================================

`

  migrationFiles.forEach(file => {
    const filepath = path.join(MIGRATIONS_DIR, file)
    const sql = fs.readFileSync(filepath, 'utf-8')

    combinedSQL += `
-- ============================================
-- Migration: ${file}
-- ============================================

${sql}

`
  })

  combinedSQL += `
-- ============================================
-- END OF MIGRATIONS
-- ============================================
`

  // Write combined SQL file
  fs.writeFileSync(OUTPUT_FILE, combinedSQL, 'utf-8')

  console.log(`\n✅ Combined SQL generated successfully!`)
  console.log(`📄 Output file: ${OUTPUT_FILE}`)
  console.log(`\n📋 Next steps:`)
  console.log(`   1. Open Supabase Dashboard → SQL Editor`)
  console.log(`   2. Create a new query`)
  console.log(`   3. Copy-paste the content of: supabase/combined-migrations.sql`)
  console.log(`   4. Run the query`)
  console.log(`\n   OR use psql:`)
  console.log(`   psql "postgresql://..." -f supabase/combined-migrations.sql`)
}

main()
