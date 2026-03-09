/**
 * Osteoflow database client for the web version.
 *
 * All Osteoflow components import from here.
 * Uses in-browser sql.js WASM — no server-side database.
 */

export { createBrowserClient as createClient } from './database/query-builder'
export { setCurrentUser } from './database/query-builder'
export {
  getDatabase,
  persistDatabase,
  exportDatabase,
  importDatabase,
  generateUUID,
} from './database/browser-db'
