#!/usr/bin/env node

/**
 * Script d'application des migrations SQL vers Supabase
 *
 * Usage: node scripts/apply-migrations.js [migration-number]
 *
 * Examples:
 *   node scripts/apply-migrations.js           # Applique toutes les migrations non appliquées
 *   node scripts/apply-migrations.js 016       # Applique uniquement la migration 016
 *   node scripts/apply-migrations.js 016-020   # Applique les migrations 016 à 020
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment')
  console.error('Please set them in your .env file or export them:')
  console.error('  export SUPABASE_URL="your-project-url"')
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations')

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
 * Check if migration has already been applied
 */
async function isMigrationApplied(migrationName) {
  // Check if migrations tracking table exists
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', '_migrations')

  if (tablesError || !tables || tables.length === 0) {
    // Migrations table doesn't exist yet
    return false
  }

  const { data, error } = await supabase
    .from('_migrations')
    .select('name')
    .eq('name', migrationName)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.warn(`⚠️  Warning checking migration ${migrationName}:`, error.message)
  }

  return !!data
}

/**
 * Record that a migration has been applied
 */
async function recordMigration(migrationName) {
  // Create migrations table if it doesn't exist
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  })

  const { error } = await supabase
    .from('_migrations')
    .insert({ name: migrationName })

  if (error) {
    throw new Error(`Failed to record migration ${migrationName}: ${error.message}`)
  }
}

/**
 * Apply a single migration file
 */
async function applyMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename)
  const sql = fs.readFileSync(filepath, 'utf-8')

  console.log(`\n📄 Applying migration: ${filename}`)

  // Check if already applied
  const applied = await isMigrationApplied(filename)
  if (applied) {
    console.log(`   ⏭️  Already applied, skipping...`)
    return { success: true, skipped: true }
  }

  try {
    // Execute SQL using raw query
    // Note: Supabase client doesn't have direct SQL execution,
    // so we need to use the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    // Record successful migration
    await recordMigration(filename)

    console.log(`   ✅ Successfully applied`)
    return { success: true, skipped: false }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Supabase Migration Tool')
  console.log('=' .repeat(50))
  console.log(`📂 Migrations directory: ${MIGRATIONS_DIR}`)
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`)
  console.log('=' .repeat(50))

  const migrationFiles = getMigrationFiles()

  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migrations found to apply')
    return
  }

  console.log(`\n📋 Found ${migrationFiles.length} migration(s) to process:\n`)
  migrationFiles.forEach(file => console.log(`   - ${file}`))

  const results = []

  for (const file of migrationFiles) {
    const result = await applyMigration(file)
    results.push({ file, ...result })
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.success && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length
  const failed = results.filter(r => !r.success).length

  console.log(`✅ Successful: ${successful}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n❌ Failed migrations:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.file}: ${r.error}`)
    })
    process.exit(1)
  }

  console.log('\n✅ All migrations applied successfully!')
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
