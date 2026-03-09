/**
 * Client-side database client for Osteoflow desktop.
 *
 * Returns a browser-safe client that proxies database operations
 * through API routes (/api/osteoflow/db, /api/osteoflow/auth/*).
 */

import { createBrowserClient } from '@/lib/osteoflow/database/client-query-builder'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createBrowserClient()
}
