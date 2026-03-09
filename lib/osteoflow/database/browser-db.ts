/**
 * Browser-based SQLite database using sql.js (SQLite compiled to WASM).
 * Data is persisted to IndexedDB for durability across sessions.
 *
 * This replaces the Electron desktop's better-sqlite3 connection
 * for the web deployment on osteo-upgrade.fr.
 */

import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { SCHEMA_SQL, BOOLEAN_FIELDS, JSON_FIELDS } from './schema'

const DB_NAME = 'osteoflow_db'
const DB_STORE = 'database'
const DB_KEY = 'main'

let db: SqlJsDatabase | null = null
let initPromise: Promise<SqlJsDatabase> | null = null

/**
 * Generate a UUID v4 string.
 */
export function generateUUID(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

/**
 * Save the database to IndexedDB for persistence.
 */
async function saveToIndexedDB(database: SqlJsDatabase): Promise<void> {
  const data = database.export()
  const buffer = new Uint8Array(data)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const idb = request.result
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        idb.createObjectStore(DB_STORE)
      }
    }
    request.onsuccess = () => {
      const idb = request.result
      const tx = idb.transaction(DB_STORE, 'readwrite')
      tx.objectStore(DB_STORE).put(buffer, DB_KEY)
      tx.oncomplete = () => {
        idb.close()
        resolve()
      }
      tx.onerror = () => {
        idb.close()
        reject(tx.error)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Load the database from IndexedDB if it exists.
 */
async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const idb = request.result
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        idb.createObjectStore(DB_STORE)
      }
    }
    request.onsuccess = () => {
      const idb = request.result
      const tx = idb.transaction(DB_STORE, 'readonly')
      const getRequest = tx.objectStore(DB_STORE).get(DB_KEY)
      getRequest.onsuccess = () => {
        idb.close()
        resolve(getRequest.result || null)
      }
      getRequest.onerror = () => {
        idb.close()
        reject(getRequest.error)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Initialize the sql.js database. Returns a singleton.
 * Loads existing data from IndexedDB or creates a fresh database.
 */
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  if (initPromise) return initPromise

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    })

    const existingData = await loadFromIndexedDB()

    if (existingData) {
      db = new SQL.Database(existingData)
      console.log('[Osteoflow DB] Loaded existing database from IndexedDB')
    } else {
      db = new SQL.Database()
      console.log('[Osteoflow DB] Created new database')
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;')

    // Initialize schema (CREATE IF NOT EXISTS is safe to run every time)
    db.run(SCHEMA_SQL)

    // Persist
    await saveToIndexedDB(db)

    console.log('[Osteoflow DB] Schema initialized')
    return db
  })()

  return initPromise
}

/**
 * Persist current database state to IndexedDB.
 * Called after every write operation.
 */
export async function persistDatabase(): Promise<void> {
  if (db) {
    await saveToIndexedDB(db)
  }
}

/**
 * Export the database as a Uint8Array (for backup/download).
 */
export async function exportDatabase(): Promise<Uint8Array> {
  const database = await getDatabase()
  return new Uint8Array(database.export())
}

/**
 * Import a database from a Uint8Array (restore from backup).
 */
export async function importDatabase(data: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  })

  if (db) {
    db.close()
  }

  db = new SQL.Database(data)
  db.run('PRAGMA foreign_keys = ON;')
  await saveToIndexedDB(db)
  initPromise = Promise.resolve(db)
}

/**
 * Execute a SELECT query and return results as an array of objects.
 */
export function queryRows(database: SqlJsDatabase, sql: string, params?: unknown[]): Record<string, unknown>[] {
  const stmt = database.prepare(sql)
  if (params) stmt.bind(params)

  const rows: Record<string, unknown>[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Record<string, unknown>)
  }
  stmt.free()
  return rows
}

/**
 * Convert boolean fields from SQLite 0/1 to JS true/false.
 */
export function convertBooleans(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const boolFields = BOOLEAN_FIELDS[table]
  if (!boolFields) return row

  const result = { ...row }
  for (const field of boolFields) {
    if (field in result) {
      result[field] = result[field] === 1 || result[field] === true
    }
  }
  return result
}

/**
 * Convert JSON fields from TEXT to parsed objects.
 */
export function convertJsonFields(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const jsonFields = JSON_FIELDS[table]
  if (!jsonFields) return row

  const result = { ...row }
  for (const field of jsonFields) {
    if (field in result && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field] as string)
      } catch {
        // leave as-is
      }
    }
  }
  return result
}

/**
 * Process a row through boolean and JSON conversions.
 */
export function processRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  return convertJsonFields(table, convertBooleans(table, row))
}
