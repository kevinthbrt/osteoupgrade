/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-browser Supabase-compatible query builder for Osteoflow.
 *
 * Executes SQL directly against the sql.js WASM database in the browser.
 * Mimics the Supabase PostgREST client API so that Osteoflow components
 * work unchanged.
 */

import { getDatabase, persistDatabase, generateUUID, queryRows, processRow } from './browser-db'
import { BOOLEAN_FIELDS } from './schema'

interface Condition {
  type: string
  column: string
  value: any
}

interface OrderClause {
  column: string
  ascending: boolean
}

/**
 * Parse a select string that may include joins like:
 * "*, patients(*), session_types(name, price)"
 *
 * Returns { columns, joins } where joins describe related tables.
 */
function parseSelect(selectStr: string): {
  columns: string[]
  joins: { table: string; columns: string[]; alias?: string }[]
} {
  const joins: { table: string; columns: string[]; alias?: string }[] = []
  const columns: string[] = []

  // Match patterns like "table_name(col1, col2)" or "table_name(*)"
  const joinRegex = /(\w+)\(([^)]+)\)/g
  let remaining = selectStr

  let match
  while ((match = joinRegex.exec(selectStr)) !== null) {
    const tableName = match[1]
    const cols = match[2].split(',').map(c => c.trim())
    joins.push({ table: tableName, columns: cols })
    remaining = remaining.replace(match[0], '')
  }

  // Parse remaining columns
  remaining.split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0)
    .forEach(c => columns.push(c))

  return { columns, joins }
}

class BrowserQueryChain {
  private _table: string
  private _operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private _columns = '*'
  private _selectOptions?: { count?: string; head?: boolean }
  private _data?: any
  private _conditions: Condition[] = []
  private _orders: OrderClause[] = []
  private _limitCount?: number
  private _offsetCount?: number
  private _singleResult = false
  private _returnSelect = false
  private _returnSelectColumns?: string

  constructor(table: string) {
    this._table = table
  }

  select(columns?: string, options?: { count?: string; head?: boolean }): BrowserQueryChain {
    if (this._operation === 'select') {
      this._columns = columns || '*'
      this._selectOptions = options
    } else {
      this._returnSelect = true
      this._returnSelectColumns = columns
    }
    return this
  }

  insert(data: any): BrowserQueryChain {
    this._operation = 'insert'
    this._data = data
    return this
  }

  update(data: any): BrowserQueryChain {
    this._operation = 'update'
    this._data = data
    return this
  }

  delete(): BrowserQueryChain {
    this._operation = 'delete'
    return this
  }

  eq(column: string, value: any): BrowserQueryChain {
    this._conditions.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any): BrowserQueryChain {
    this._conditions.push({ type: 'neq', column, value })
    return this
  }

  gt(column: string, value: any): BrowserQueryChain {
    this._conditions.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: any): BrowserQueryChain {
    this._conditions.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: any): BrowserQueryChain {
    this._conditions.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: any): BrowserQueryChain {
    this._conditions.push({ type: 'lte', column, value })
    return this
  }

  is(column: string, value: null): BrowserQueryChain {
    this._conditions.push({ type: 'is', column, value })
    return this
  }

  isNot(column: string, value: null): BrowserQueryChain {
    this._conditions.push({ type: 'isNot', column, value })
    return this
  }

  like(column: string, value: string): BrowserQueryChain {
    this._conditions.push({ type: 'like', column, value })
    return this
  }

  ilike(column: string, value: string): BrowserQueryChain {
    this._conditions.push({ type: 'ilike', column, value })
    return this
  }

  in(column: string, values: any[]): BrowserQueryChain {
    this._conditions.push({ type: 'in', column, value: values })
    return this
  }

  or(conditionStr: string): BrowserQueryChain {
    this._conditions.push({ type: 'or', column: conditionStr, value: conditionStr })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): BrowserQueryChain {
    this._orders.push({
      column,
      ascending: options?.ascending !== false,
    })
    return this
  }

  limit(count: number): BrowserQueryChain {
    this._limitCount = count
    return this
  }

  range(from: number, to: number): BrowserQueryChain {
    this._offsetCount = from
    this._limitCount = to - from + 1
    return this
  }

  single(): BrowserQueryChain {
    this._singleResult = true
    return this
  }

  /**
   * Build WHERE clause from conditions.
   */
  private buildWhere(): { sql: string; params: any[] } {
    if (this._conditions.length === 0) return { sql: '', params: [] }

    const parts: string[] = []
    const params: any[] = []

    for (const cond of this._conditions) {
      switch (cond.type) {
        case 'eq':
          parts.push(`${cond.column} = ?`)
          params.push(cond.value)
          break
        case 'neq':
          parts.push(`${cond.column} != ?`)
          params.push(cond.value)
          break
        case 'gt':
          parts.push(`${cond.column} > ?`)
          params.push(cond.value)
          break
        case 'gte':
          parts.push(`${cond.column} >= ?`)
          params.push(cond.value)
          break
        case 'lt':
          parts.push(`${cond.column} < ?`)
          params.push(cond.value)
          break
        case 'lte':
          parts.push(`${cond.column} <= ?`)
          params.push(cond.value)
          break
        case 'is':
          parts.push(`${cond.column} IS NULL`)
          break
        case 'isNot':
          parts.push(`${cond.column} IS NOT NULL`)
          break
        case 'like':
          parts.push(`${cond.column} LIKE ?`)
          params.push(cond.value)
          break
        case 'ilike':
          parts.push(`${cond.column} LIKE ? COLLATE NOCASE`)
          params.push(cond.value)
          break
        case 'in':
          if (Array.isArray(cond.value) && cond.value.length > 0) {
            const placeholders = cond.value.map(() => '?').join(',')
            parts.push(`${cond.column} IN (${placeholders})`)
            params.push(...cond.value)
          } else {
            parts.push('0=1') // empty IN = no match
          }
          break
        case 'or': {
          // Parse simple or conditions like "first_name.ilike.%val%,last_name.ilike.%val%"
          const orParts: string[] = []
          const orConditions = cond.column.split(',')
          for (const oc of orConditions) {
            const segments = oc.trim().split('.')
            if (segments.length >= 3) {
              const col = segments[0]
              const op = segments[1]
              const val = segments.slice(2).join('.')
              switch (op) {
                case 'eq':
                  orParts.push(`${col} = ?`)
                  params.push(val)
                  break
                case 'ilike':
                  orParts.push(`${col} LIKE ? COLLATE NOCASE`)
                  params.push(val)
                  break
                case 'like':
                  orParts.push(`${col} LIKE ?`)
                  params.push(val)
                  break
                case 'is':
                  if (val === 'null') orParts.push(`${col} IS NULL`)
                  else orParts.push(`${col} IS NOT NULL`)
                  break
                default:
                  orParts.push(`${col} = ?`)
                  params.push(val)
              }
            }
          }
          if (orParts.length > 0) {
            parts.push(`(${orParts.join(' OR ')})`)
          }
          break
        }
      }
    }

    return {
      sql: parts.length > 0 ? ` WHERE ${parts.join(' AND ')}` : '',
      params,
    }
  }

  /**
   * Build ORDER BY clause.
   */
  private buildOrderBy(): string {
    if (this._orders.length === 0) return ''
    const parts = this._orders.map(o => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`)
    return ` ORDER BY ${parts.join(', ')}`
  }

  /**
   * Build LIMIT/OFFSET clause.
   */
  private buildLimit(): string {
    let sql = ''
    if (this._limitCount !== undefined) sql += ` LIMIT ${this._limitCount}`
    if (this._offsetCount !== undefined) sql += ` OFFSET ${this._offsetCount}`
    return sql
  }

  /**
   * Convert boolean values for SQLite storage.
   */
  private convertBoolsForStorage(data: Record<string, any>): Record<string, any> {
    const boolFields = BOOLEAN_FIELDS[this._table]
    if (!boolFields) return data

    const result = { ...data }
    for (const field of boolFields) {
      if (field in result) {
        result[field] = result[field] ? 1 : 0
      }
    }
    return result
  }

  /**
   * Execute the query.
   */
  private async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      const database = await getDatabase()

      switch (this._operation) {
        case 'select': {
          const { columns } = parseSelect(this._columns)
          const colStr = columns.includes('*') ? '*' : columns.join(', ')
          const where = this.buildWhere()
          const orderBy = this.buildOrderBy()
          const limit = this.buildLimit()

          // Count query
          if (this._selectOptions?.count) {
            const countSql = `SELECT COUNT(*) as count FROM ${this._table}${where.sql}`
            const countRows = queryRows(database, countSql, where.params)
            const count = (countRows[0]?.count as number) || 0

            if (this._selectOptions.head) {
              return { data: null, error: null, count }
            }

            const sql = `SELECT ${colStr} FROM ${this._table}${where.sql}${orderBy}${limit}`
            const rows = queryRows(database, sql, where.params).map(r => processRow(this._table, r))

            if (this._singleResult) {
              return { data: rows[0] || null, error: rows.length === 0 ? { code: 'PGRST116', message: 'No rows found' } : null, count }
            }
            return { data: rows, error: null, count }
          }

          const sql = `SELECT ${colStr} FROM ${this._table}${where.sql}${orderBy}${limit}`
          const rows = queryRows(database, sql, where.params).map(r => processRow(this._table, r))

          if (this._singleResult) {
            return {
              data: rows[0] || null,
              error: rows.length === 0 ? { code: 'PGRST116', message: 'No rows found' } : null,
            }
          }
          return { data: rows, error: null }
        }

        case 'insert': {
          const records = Array.isArray(this._data) ? this._data : [this._data]
          const insertedRows: any[] = []

          for (const rawRecord of records) {
            const record = this.convertBoolsForStorage(rawRecord)
            // Generate ID if not provided
            if (!record.id) {
              record.id = generateUUID()
            }

            const keys = Object.keys(record)
            const values = keys.map(k => {
              const v = record[k]
              if (v === null || v === undefined) return null
              if (typeof v === 'object') return JSON.stringify(v)
              return v
            })
            const placeholders = keys.map(() => '?').join(', ')

            const sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})`
            database.run(sql, values)

            if (this._returnSelect) {
              const inserted = queryRows(database, `SELECT * FROM ${this._table} WHERE id = ?`, [record.id])
              insertedRows.push(...inserted.map(r => processRow(this._table, r)))
            } else {
              insertedRows.push(record)
            }
          }

          await persistDatabase()

          const data = Array.isArray(this._data) ? insertedRows : insertedRows[0]
          if (this._singleResult) {
            return { data: insertedRows[0] || null, error: null }
          }
          return { data, error: null }
        }

        case 'update': {
          const record = this.convertBoolsForStorage(this._data)
          const keys = Object.keys(record)
          const setClauses = keys.map(k => `${k} = ?`)
          const values = keys.map(k => {
            const v = record[k]
            if (v === null || v === undefined) return null
            if (typeof v === 'object') return JSON.stringify(v)
            return v
          })

          const where = this.buildWhere()
          const sql = `UPDATE ${this._table} SET ${setClauses.join(', ')}${where.sql}`
          database.run(sql, [...values, ...where.params])

          let data: any = null
          if (this._returnSelect) {
            const selectSql = `SELECT * FROM ${this._table}${where.sql}${this.buildOrderBy()}${this.buildLimit()}`
            const rows = queryRows(database, selectSql, where.params).map(r => processRow(this._table, r))
            data = this._singleResult ? (rows[0] || null) : rows
          }

          await persistDatabase()
          return { data, error: null }
        }

        case 'delete': {
          const where = this.buildWhere()

          let data: any = null
          if (this._returnSelect) {
            const selectSql = `SELECT * FROM ${this._table}${where.sql}`
            const rows = queryRows(database, selectSql, where.params).map(r => processRow(this._table, r))
            data = this._singleResult ? (rows[0] || null) : rows
          }

          const sql = `DELETE FROM ${this._table}${where.sql}`
          database.run(sql, where.params)

          await persistDatabase()
          return { data, error: null }
        }

        default:
          return { data: null, error: { message: `Unknown operation: ${this._operation}` } }
      }
    } catch (error) {
      console.error(`[Osteoflow DB] Error in ${this._operation} on ${this._table}:`, error)
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Database error' },
      }
    }
  }

  /**
   * Make this object thenable so `await` triggers execution.
   */
  then(
    resolve: (value: any) => any,
    reject?: (reason: any) => any,
  ): Promise<any> {
    return this.execute().then(resolve, reject)
  }
}

/**
 * Current user state for the browser client.
 * Stored in memory + localStorage for persistence.
 */
let _currentUser: { id: string; email: string } | null = null

function getCurrentUser(): { id: string; email: string } | null {
  if (_currentUser) return _currentUser
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('osteoflow_user')
    if (stored) {
      try {
        _currentUser = JSON.parse(stored)
        return _currentUser
      } catch {
        // ignore
      }
    }
  }
  return null
}

export function setCurrentUser(user: { id: string; email: string }): void {
  _currentUser = user
  if (typeof window !== 'undefined') {
    localStorage.setItem('osteoflow_user', JSON.stringify(user))
  }
}

/**
 * Create the browser database client.
 * Returns a Supabase-compatible API that executes against in-browser sql.js.
 */
let _client: ReturnType<typeof _createClient> | null = null

function _createClient() {
  return {
    from: (table: string) => new BrowserQueryChain(table),

    auth: {
      getUser: async () => {
        const user = getCurrentUser()
        if (user) {
          return { data: { user }, error: null }
        }
        return { data: { user: null }, error: { message: 'Not authenticated' } }
      },

      signInWithPassword: async ({ email }: { email: string; password?: string }) => {
        // In web mode, auth is handled by Supabase on the osteo-upgrade side.
        // This just sets the local user context.
        const user = { id: email, email }
        setCurrentUser(user)
        return { data: { user }, error: null }
      },

      signOut: async () => {
        _currentUser = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem('osteoflow_user')
        }
        return { error: null }
      },

      exchangeCodeForSession: async () => {
        return { error: null }
      },
    },

    channel: (_name: string) => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {},
        }),
      }),
      subscribe: () => ({
        unsubscribe: () => {},
      }),
    }),
    removeChannel: () => {},

    rpc: (_fn: string, _args?: any) => ({
      data: null,
      error: { message: 'RPC not available in browser mode' },
      then(resolve: (value: any) => any) {
        return Promise.resolve({ data: null, error: { message: 'RPC not available in browser mode' } }).then(resolve)
      },
    }),
  }
}

export function createBrowserClient() {
  if (!_client) {
    _client = _createClient()
  }
  return _client
}
