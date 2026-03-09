/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-side Supabase-compatible query builder for Osteoflow.
 *
 * This module provides a query builder that mimics the Supabase PostgREST API,
 * allowing existing code to work with minimal changes. It translates the
 * chained method calls into SQL queries executed against the local SQLite database.
 *
 * Supported Supabase patterns:
 * - .from('table').select('*').eq('col', val).order('col').limit(n)
 * - .from('table').select('*', { count: 'exact', head: true })
 * - .from('table').select('*, relation:table (*)').eq('col', val).single()
 * - .from('table').insert({}).select().single()
 * - .from('table').update({}).eq('col', val)
 * - .from('table').delete().eq('col', val)
 */

import { getDatabase, generateUUID } from './connection'
import { BOOLEAN_FIELDS, JSON_FIELDS } from './schema'

interface Condition {
  type: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'is' | 'isNot' | 'like' | 'ilike' | 'in' | 'or'
  column: string
  value: any
}

interface OrderClause {
  column: string
  ascending: boolean
}

interface RelationSpec {
  alias: string
  table: string
  columns: string
  nestedRelations: RelationSpec[]
}

/**
 * Parse a Supabase-style select string to extract relation specifications.
 */
function parseSelectString(selectStr: string): { columns: string[]; relations: RelationSpec[] } {
  const relations: RelationSpec[] = []
  let remaining = selectStr.trim()

  const relationRegex = /(\w+):(\w+)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g
  const simpleRelationRegex = /(?<![:\w])(\w+)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g

  let match: RegExpExecArray | null

  while ((match = relationRegex.exec(selectStr)) !== null) {
    const alias = match[1]
    const table = match[2]
    const innerColumns = match[3]
    const parsed = parseSelectString(innerColumns)

    relations.push({
      alias,
      table,
      columns: parsed.columns.length > 0 ? parsed.columns.join(', ') : '*',
      nestedRelations: parsed.relations,
    })

    remaining = remaining.replace(match[0], '')
  }

  simpleRelationRegex.lastIndex = 0
  const tempRemaining = remaining
  while ((match = simpleRelationRegex.exec(tempRemaining)) !== null) {
    const table = match[1]
    const innerColumns = match[2]
    if (relations.some((r) => r.table === table)) continue

    const parsed = parseSelectString(innerColumns)

    relations.push({
      alias: table,
      table,
      columns: parsed.columns.length > 0 ? parsed.columns.join(', ') : '*',
      nestedRelations: parsed.relations,
    })

    remaining = remaining.replace(match[0], '')
  }

  const columns = remaining
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c && c !== '')

  return { columns, relations }
}

/**
 * Determine the foreign key relationship between two tables.
 */
function findForeignKey(
  parentTable: string,
  childTable: string
): { column: string; referencedColumn: string; direction: 'parent' | 'child' } {
  const relationships: Record<string, Record<string, { column: string; ref: string; dir: 'parent' | 'child' }>> = {
    consultations: {
      patients: { column: 'patient_id', ref: 'id', dir: 'parent' },
      session_types: { column: 'session_type_id', ref: 'id', dir: 'parent' },
    },
    invoices: {
      consultations: { column: 'consultation_id', ref: 'id', dir: 'parent' },
    },
    payments: {
      invoices: { column: 'invoice_id', ref: 'id', dir: 'parent' },
    },
    patients: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
    conversations: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
      patients: { column: 'patient_id', ref: 'id', dir: 'parent' },
    },
    messages: {
      conversations: { column: 'conversation_id', ref: 'id', dir: 'parent' },
      consultations: { column: 'consultation_id', ref: 'id', dir: 'parent' },
    },
    email_settings: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
    email_templates: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
    message_templates: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
    scheduled_tasks: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
      consultations: { column: 'consultation_id', ref: 'id', dir: 'parent' },
    },
    medical_history_entries: {
      patients: { column: 'patient_id', ref: 'id', dir: 'parent' },
    },
    saved_reports: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
    audit_logs: {
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
    survey_responses: {
      consultations: { column: 'consultation_id', ref: 'id', dir: 'parent' },
      patients: { column: 'patient_id', ref: 'id', dir: 'parent' },
      practitioners: { column: 'practitioner_id', ref: 'id', dir: 'parent' },
    },
  }

  if (relationships[parentTable]?.[childTable]) {
    const rel = relationships[parentTable][childTable]
    return { column: rel.column, referencedColumn: rel.ref, direction: rel.dir }
  }

  if (relationships[childTable]?.[parentTable]) {
    const rel = relationships[childTable][parentTable]
    return { column: rel.ref, referencedColumn: rel.column, direction: 'child' }
  }

  const singularParent = parentTable.replace(/s$/, '')
  return { column: `${singularParent}_id`, referencedColumn: 'id', direction: 'child' }
}

/**
 * Convert a SQLite row's boolean and JSON fields to their JS equivalents.
 */
function convertRow(table: string, row: any): any {
  if (!row) return row

  const boolFields = BOOLEAN_FIELDS[table] || []
  const jsonFields = JSON_FIELDS[table] || []

  const converted = { ...row }

  for (const field of boolFields) {
    if (field in converted) {
      converted[field] = Boolean(converted[field])
    }
  }

  for (const field of jsonFields) {
    if (field in converted && typeof converted[field] === 'string') {
      try {
        converted[field] = JSON.parse(converted[field])
      } catch {
        // Leave as string if not valid JSON
      }
    }
  }

  return converted
}

/**
 * Convert JS values to SQLite-compatible values for insertion/update.
 */
function convertValueForSQLite(table: string, column: string, value: any): any {
  const boolFields = BOOLEAN_FIELDS[table] || []
  const jsonFields = JSON_FIELDS[table] || []

  if (boolFields.includes(column) && typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (jsonFields.includes(column) && typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }

  return value
}

/**
 * Fetch related rows for a relation spec.
 */
function fetchRelation(
  parentTable: string,
  parentRows: any[],
  relation: RelationSpec
): void {
  if (parentRows.length === 0) return

  const db = getDatabase()
  const fk = findForeignKey(parentTable, relation.table)

  if (fk.direction === 'parent') {
    const ids = [...new Set(parentRows.map((r) => r[fk.column]).filter(Boolean))]
    if (ids.length === 0) {
      parentRows.forEach((r) => (r[relation.alias] = null))
      return
    }

    const placeholders = ids.map(() => '?').join(',')
    const relatedRows = db
      .prepare(`SELECT * FROM ${relation.table} WHERE ${fk.referencedColumn} IN (${placeholders})`)
      .all(...ids) as any[]

    const indexed = new Map<string, any>()
    for (const row of relatedRows) {
      indexed.set(row[fk.referencedColumn], convertRow(relation.table, row))
    }

    for (const parentRow of parentRows) {
      const related = indexed.get(parentRow[fk.column]) || null
      parentRow[relation.alias] = related
    }

    if (relation.nestedRelations.length > 0 && relatedRows.length > 0) {
      const convertedRelated = relatedRows.map((r) => convertRow(relation.table, r))
      for (const nested of relation.nestedRelations) {
        fetchRelation(relation.table, convertedRelated, nested)
      }
      for (const parentRow of parentRows) {
        const relId = parentRow[fk.column]
        if (relId) {
          parentRow[relation.alias] = convertedRelated.find(
            (r) => r[fk.referencedColumn] === relId
          ) || null
        }
      }
    }
  } else {
    const ids = [...new Set(parentRows.map((r) => r.id).filter(Boolean))]
    if (ids.length === 0) {
      parentRows.forEach((r) => (r[relation.alias] = []))
      return
    }

    const placeholders = ids.map(() => '?').join(',')
    const relatedRows = db
      .prepare(`SELECT * FROM ${relation.table} WHERE ${fk.referencedColumn} IN (${placeholders})`)
      .all(...ids) as any[]

    const convertedRelated = relatedRows.map((r) => convertRow(relation.table, r))

    const grouped = new Map<string, any[]>()
    for (let i = 0; i < relatedRows.length; i++) {
      const key = relatedRows[i][fk.referencedColumn]
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(convertedRelated[i])
    }

    for (const parentRow of parentRows) {
      parentRow[relation.alias] = grouped.get(parentRow.id) || []
    }

    if (relation.nestedRelations.length > 0 && convertedRelated.length > 0) {
      for (const nested of relation.nestedRelations) {
        fetchRelation(relation.table, convertedRelated, nested)
      }
    }
  }
}

/**
 * Parse a Supabase-style OR condition string.
 */
function parseOrCondition(orStr: string): Array<{ column: string; operator: string; value: string }> {
  const conditions: Array<{ column: string; operator: string; value: string }> = []
  const parts = orStr.split(',')

  for (const part of parts) {
    const trimmed = part.trim()
    const firstDot = trimmed.indexOf('.')
    if (firstDot === -1) continue
    const column = trimmed.substring(0, firstDot)
    const rest = trimmed.substring(firstDot + 1)
    const secondDot = rest.indexOf('.')
    if (secondDot === -1) continue
    const operator = rest.substring(0, secondDot)
    const value = rest.substring(secondDot + 1)

    conditions.push({ column, operator, value })
  }

  return conditions
}

/**
 * The main query builder class that mimics Supabase's PostgREST API.
 */
export class QueryBuilder {
  private _table = ''
  private _conditions: Condition[] = []
  private _orders: OrderClause[] = []
  private _limitValue: number | null = null
  private _offsetValue: number | null = null
  private _selectColumns = '*'
  private _operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private _insertData: any = null
  private _updateData: any = null
  private _countMode = false
  private _headMode = false
  private _singleMode = false
  private _returnData = false
  private _relations: RelationSpec[] = []

  from(table: string): QueryBuilder {
    const qb = new QueryBuilder()
    qb._table = table
    return qb
  }

  select(columns?: string, options?: { count?: string; head?: boolean }): QueryBuilder {
    if (columns) {
      const parsed = parseSelectString(columns)
      this._selectColumns = parsed.columns.filter((c) => c !== '').join(', ') || '*'
      this._relations = parsed.relations
    }
    if (options?.count === 'exact') {
      this._countMode = true
    }
    if (options?.head) {
      this._headMode = true
    }
    if (this._operation === 'insert' || this._operation === 'update') {
      this._returnData = true
    }
    return this
  }

  insert(data: any): QueryBuilder {
    this._operation = 'insert'
    this._insertData = data
    return this
  }

  update(data: any): QueryBuilder {
    this._operation = 'update'
    this._updateData = data
    return this
  }

  delete(): QueryBuilder {
    this._operation = 'delete'
    return this
  }

  eq(column: string, value: any): QueryBuilder {
    this._conditions.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any): QueryBuilder {
    this._conditions.push({ type: 'neq', column, value })
    return this
  }

  gt(column: string, value: any): QueryBuilder {
    this._conditions.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: any): QueryBuilder {
    this._conditions.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: any): QueryBuilder {
    this._conditions.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: any): QueryBuilder {
    this._conditions.push({ type: 'lte', column, value })
    return this
  }

  is(column: string, value: null): QueryBuilder {
    this._conditions.push({ type: 'is', column, value })
    return this
  }

  isNot(column: string, value: null): QueryBuilder {
    this._conditions.push({ type: 'isNot', column, value })
    return this
  }

  like(column: string, value: string): QueryBuilder {
    this._conditions.push({ type: 'like', column, value })
    return this
  }

  ilike(column: string, value: string): QueryBuilder {
    this._conditions.push({ type: 'ilike', column, value })
    return this
  }

  in(column: string, values: any[]): QueryBuilder {
    this._conditions.push({ type: 'in', column, value: values })
    return this
  }

  or(conditionStr: string): QueryBuilder {
    this._conditions.push({ type: 'or', column: '', value: conditionStr })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this._orders.push({
      column,
      ascending: options?.ascending ?? true,
    })
    return this
  }

  limit(count: number): QueryBuilder {
    this._limitValue = count
    return this
  }

  range(from: number, to: number): QueryBuilder {
    this._offsetValue = from
    this._limitValue = to - from + 1
    return this
  }

  single(): this & PromiseLike<{ data: any; error: any; count?: number }> {
    this._singleMode = true
    const self = this as any
    self.then = (resolve: any, reject: any) => {
      try {
        const result = this.execute()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    return self
  }

  then(resolve: (value: { data: any; error: any; count?: number }) => any, reject?: (error: any) => any): Promise<any> {
    try {
      const result = this.execute()
      return Promise.resolve(resolve(result))
    } catch (error) {
      if (reject) return Promise.resolve(reject(error))
      return Promise.reject(error)
    }
  }

  private execute(): { data: any; error: any; count?: number } {
    try {
      const db = getDatabase()

      switch (this._operation) {
        case 'select':
          return this.executeSelect(db)
        case 'insert':
          return this.executeInsert(db)
        case 'update':
          return this.executeUpdate(db)
        case 'delete':
          return this.executeDelete(db)
        default:
          return { data: null, error: { message: 'Unknown operation' } }
      }
    } catch (error: any) {
      console.error(`[QueryBuilder] Error executing ${this._operation} on ${this._table}:`, error)
      return {
        data: null,
        error: {
          message: error.message || 'Database error',
          code: error.code,
        },
      }
    }
  }

  private buildWhereClause(): { sql: string; params: any[] } {
    if (this._conditions.length === 0) {
      return { sql: '', params: [] }
    }

    const clauses: string[] = []
    const params: any[] = []

    for (const cond of this._conditions) {
      switch (cond.type) {
        case 'eq':
          clauses.push(`${cond.column} = ?`)
          params.push(convertValueForSQLite(this._table, cond.column, cond.value))
          break
        case 'neq':
          clauses.push(`${cond.column} != ?`)
          params.push(convertValueForSQLite(this._table, cond.column, cond.value))
          break
        case 'gt':
          clauses.push(`${cond.column} > ?`)
          params.push(cond.value)
          break
        case 'gte':
          clauses.push(`${cond.column} >= ?`)
          params.push(cond.value)
          break
        case 'lt':
          clauses.push(`${cond.column} < ?`)
          params.push(cond.value)
          break
        case 'lte':
          clauses.push(`${cond.column} <= ?`)
          params.push(cond.value)
          break
        case 'is':
          if (cond.value === null) {
            clauses.push(`${cond.column} IS NULL`)
          } else {
            clauses.push(`${cond.column} IS ?`)
            params.push(cond.value)
          }
          break
        case 'isNot':
          if (cond.value === null) {
            clauses.push(`${cond.column} IS NOT NULL`)
          } else {
            clauses.push(`${cond.column} IS NOT ?`)
            params.push(cond.value)
          }
          break
        case 'like':
          clauses.push(`${cond.column} LIKE ?`)
          params.push(cond.value)
          break
        case 'ilike':
          clauses.push(`${cond.column} LIKE ? COLLATE NOCASE`)
          params.push(cond.value)
          break
        case 'in':
          if (Array.isArray(cond.value) && cond.value.length > 0) {
            const placeholders = cond.value.map(() => '?').join(',')
            clauses.push(`${cond.column} IN (${placeholders})`)
            params.push(...cond.value)
          }
          break
        case 'or': {
          const orConditions = parseOrCondition(cond.value)
          if (orConditions.length > 0) {
            const orParts: string[] = []
            for (const oc of orConditions) {
              switch (oc.operator) {
                case 'eq':
                  orParts.push(`${oc.column} = ?`)
                  params.push(oc.value)
                  break
                case 'ilike':
                  orParts.push(`${oc.column} LIKE ? COLLATE NOCASE`)
                  params.push(oc.value)
                  break
                case 'like':
                  orParts.push(`${oc.column} LIKE ?`)
                  params.push(oc.value)
                  break
                case 'gt':
                  orParts.push(`${oc.column} > ?`)
                  params.push(oc.value)
                  break
                default:
                  orParts.push(`${oc.column} = ?`)
                  params.push(oc.value)
              }
            }
            clauses.push(`(${orParts.join(' OR ')})`)
          }
          break
        }
      }
    }

    return {
      sql: clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '',
      params,
    }
  }

  private executeSelect(db: any): { data: any; error: any; count?: number } {
    const where = this.buildWhereClause()

    if (this._countMode && this._headMode) {
      const countSQL = `SELECT COUNT(*) as count FROM ${this._table}${where.sql}`
      const result = db.prepare(countSQL).get(...where.params) as any
      return { data: null, error: null, count: result?.count || 0 }
    }

    let sql = `SELECT * FROM ${this._table}${where.sql}`

    if (this._orders.length > 0) {
      const orderClauses = this._orders.map(
        (o) => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`
      )
      sql += ` ORDER BY ${orderClauses.join(', ')}`
    }

    if (this._limitValue !== null) {
      sql += ` LIMIT ${this._limitValue}`
    }
    if (this._offsetValue !== null) {
      sql += ` OFFSET ${this._offsetValue}`
    }

    const rows = db.prepare(sql).all(...where.params) as any[]
    const convertedRows = rows.map((r) => convertRow(this._table, r))

    for (const relation of this._relations) {
      fetchRelation(this._table, convertedRows, relation)
    }

    if (this._singleMode) {
      if (convertedRows.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
      }
      return { data: convertedRows[0], error: null }
    }

    const result: { data: any; error: any; count?: number } = {
      data: convertedRows,
      error: null,
    }
    if (this._countMode) {
      const countSQL = `SELECT COUNT(*) as count FROM ${this._table}${where.sql}`
      const countResult = db.prepare(countSQL).get(...where.params) as any
      result.count = countResult?.count || 0
    }
    return result
  }

  private executeInsert(db: any): { data: any; error: any } {
    const dataArray = Array.isArray(this._insertData) ? this._insertData : [this._insertData]
    const insertedRows: any[] = []

    for (const item of dataArray) {
      const row = { ...item }

      if (!row.id) {
        row.id = generateUUID()
      }

      if (!row.created_at) {
        row.created_at = new Date().toISOString()
      }

      const columns = Object.keys(row)
      const values = columns.map((col) => convertValueForSQLite(this._table, col, row[col]))
      const placeholders = columns.map(() => '?').join(', ')

      const sql = `INSERT INTO ${this._table} (${columns.join(', ')}) VALUES (${placeholders})`
      db.prepare(sql).run(...values)

      if (this._returnData) {
        const inserted = db.prepare(`SELECT * FROM ${this._table} WHERE id = ?`).get(row.id) as any
        insertedRows.push(convertRow(this._table, inserted))
      } else {
        insertedRows.push(convertRow(this._table, row))
      }
    }

    if (this._singleMode) {
      return { data: insertedRows[0] || null, error: null }
    }

    if (this._returnData) {
      return { data: insertedRows, error: null }
    }

    return {
      data: Array.isArray(this._insertData) ? insertedRows : insertedRows[0] || null,
      error: null,
    }
  }

  private executeUpdate(db: any): { data: any; error: any } {
    const where = this.buildWhereClause()

    const TABLES_WITH_UPDATED_AT = new Set([
      'practitioners', 'patients', 'session_types', 'consultations',
      'invoices', 'conversations', 'email_settings', 'email_templates',
      'message_templates', 'medical_history_entries',
    ])
    const data = { ...this._updateData }
    if (!data.updated_at && TABLES_WITH_UPDATED_AT.has(this._table)) {
      data.updated_at = new Date().toISOString()
    }

    const columns = Object.keys(data)
    const setClauses = columns.map((col) => `${col} = ?`)
    const values = columns.map((col) => convertValueForSQLite(this._table, col, data[col]))

    const sql = `UPDATE ${this._table} SET ${setClauses.join(', ')}${where.sql}`
    db.prepare(sql).run(...values, ...where.params)

    if (this._returnData) {
      const selectSQL = `SELECT * FROM ${this._table}${where.sql}`
      const rows = db.prepare(selectSQL).all(...where.params) as any[]
      const converted = rows.map((r) => convertRow(this._table, r))

      if (this._singleMode) {
        return { data: converted[0] || null, error: null }
      }
      return { data: converted, error: null }
    }

    return { data: null, error: null }
  }

  private executeDelete(db: any): { data: any; error: any } {
    const where = this.buildWhereClause()
    const sql = `DELETE FROM ${this._table}${where.sql}`
    db.prepare(sql).run(...where.params)
    return { data: null, error: null }
  }
}

/**
 * Create a local database client that mimics the Supabase client interface.
 */
export function createLocalClient(currentUserId?: string) {
  const qb = new QueryBuilder()

  return {
    from: (table: string) => qb.from(table),

    auth: {
      getUser: async () => {
        if (!currentUserId) {
          try {
            const db = getDatabase()
            const config = db.prepare("SELECT value FROM app_config WHERE key = 'current_user_id'").get() as any
            if (config) {
              currentUserId = config.value
            }
          } catch {
            // Ignore
          }
        }

        if (!currentUserId) {
          return { data: { user: null }, error: { message: 'Not authenticated' } }
        }

        try {
          const db = getDatabase()
          const practitioner = db
            .prepare('SELECT email, first_name, last_name FROM practitioners WHERE user_id = ?')
            .get(currentUserId) as any

          return {
            data: {
              user: {
                id: currentUserId,
                email: practitioner?.email || '',
                user_metadata: {
                  first_name: practitioner?.first_name || '',
                  last_name: practitioner?.last_name || '',
                },
              },
            },
            error: null,
          }
        } catch {
          return {
            data: {
              user: {
                id: currentUserId,
                email: '',
                user_metadata: {},
              },
            },
            error: null,
          }
        }
      },

      signInWithPassword: async ({ email }: { email: string; password: string }) => {
        try {
          const db = getDatabase()
          const practitioner = db
            .prepare('SELECT * FROM practitioners WHERE email = ?')
            .get(email) as any

          if (!practitioner) {
            return { data: { user: null }, error: { message: 'Invalid login credentials' } }
          }

          db.prepare(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES ('current_user_id', ?)"
          ).run(practitioner.user_id)

          return {
            data: {
              user: {
                id: practitioner.user_id,
                email: practitioner.email,
                user_metadata: {
                  first_name: practitioner.first_name,
                  last_name: practitioner.last_name,
                },
              },
            },
            error: null,
          }
        } catch (error: any) {
          return { data: { user: null }, error: { message: error.message } }
        }
      },

      signOut: async () => {
        try {
          const db = getDatabase()
          db.prepare("DELETE FROM app_config WHERE key = 'current_user_id'").run()
          return { error: null }
        } catch (error: any) {
          return { error: { message: error.message } }
        }
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
      error: { message: 'RPC not available in desktop mode' },
    }),
  }
}
