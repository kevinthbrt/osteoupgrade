/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Browser-safe Supabase-compatible query builder for Osteoflow.
 *
 * Uses fetch() to communicate with server-side API routes instead of
 * importing Node.js modules directly.
 *
 * Used by 'use client' components that cannot access Node.js modules.
 */

interface Condition {
  type: string
  column: string
  value: any
}

interface OrderClause {
  column: string
  ascending: boolean
}

interface QueryDescriptor {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  columns: string
  selectOptions?: { count?: string; head?: boolean }
  data?: any
  conditions: Condition[]
  orders: OrderClause[]
  limitCount?: number
  offsetCount?: number
  singleResult: boolean
  returnSelect: boolean
  returnSelectColumns?: string
}

class ClientQueryChain {
  private _descriptor: QueryDescriptor

  constructor(table: string) {
    this._descriptor = {
      table,
      operation: 'select',
      columns: '*',
      conditions: [],
      orders: [],
      singleResult: false,
      returnSelect: false,
    }
  }

  select(columns?: string, options?: { count?: string; head?: boolean }): ClientQueryChain {
    if (this._descriptor.operation === 'select') {
      this._descriptor.columns = columns || '*'
      this._descriptor.selectOptions = options
    } else {
      this._descriptor.returnSelect = true
      this._descriptor.returnSelectColumns = columns
    }
    return this
  }

  insert(data: any): ClientQueryChain {
    this._descriptor.operation = 'insert'
    this._descriptor.data = data
    return this
  }

  update(data: any): ClientQueryChain {
    this._descriptor.operation = 'update'
    this._descriptor.data = data
    return this
  }

  delete(): ClientQueryChain {
    this._descriptor.operation = 'delete'
    return this
  }

  eq(column: string, value: any): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'neq', column, value })
    return this
  }

  gt(column: string, value: any): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: any): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: any): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: any): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'lte', column, value })
    return this
  }

  is(column: string, value: null): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'is', column, value })
    return this
  }

  isNot(column: string, value: null): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'isNot', column, value })
    return this
  }

  like(column: string, value: string): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'like', column, value })
    return this
  }

  ilike(column: string, value: string): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'ilike', column, value })
    return this
  }

  in(column: string, values: any[]): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'in', column, value: values })
    return this
  }

  or(conditionStr: string): ClientQueryChain {
    this._descriptor.conditions.push({ type: 'or', column: conditionStr, value: conditionStr })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): ClientQueryChain {
    this._descriptor.orders.push({
      column,
      ascending: options?.ascending !== false,
    })
    return this
  }

  limit(count: number): ClientQueryChain {
    this._descriptor.limitCount = count
    return this
  }

  range(from: number, to: number): ClientQueryChain {
    this._descriptor.offsetCount = from
    this._descriptor.limitCount = to - from + 1
    return this
  }

  single(): ClientQueryChain {
    this._descriptor.singleResult = true
    return this
  }

  then(
    resolve: (value: any) => any,
    reject?: (reason: any) => any,
  ): Promise<any> {
    return fetch('/api/osteoflow/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._descriptor),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text()
          try {
            return JSON.parse(text)
          } catch {
            return {
              data: null,
              error: { message: `Server error (${res.status}): ${text || res.statusText}` },
            }
          }
        }
        return res.json()
      })
      .then(resolve, reject)
  }
}

let _browserClient: ReturnType<typeof _createBrowserClient> | null = null

function _createBrowserClient() {
  return {
    from: (table: string) => new ClientQueryChain(table),

    auth: {
      getUser: async () => {
        try {
          const res = await fetch('/api/osteoflow/auth/user')
          const text = await res.text()
          try {
            return JSON.parse(text)
          } catch {
            return { data: { user: null }, error: { message: `Server error: ${text}` } }
          }
        } catch {
          return { data: { user: null }, error: { message: 'Failed to get user' } }
        }
      },

      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try {
          const res = await fetch('/api/osteoflow/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const text = await res.text()
          try {
            return JSON.parse(text)
          } catch {
            return { data: { user: null }, error: { message: `Server error: ${text}` } }
          }
        } catch {
          return { data: { user: null }, error: { message: 'Login failed' } }
        }
      },

      signOut: async () => {
        try {
          const res = await fetch('/api/osteoflow/auth/logout', { method: 'POST' })
          const text = await res.text()
          try {
            return JSON.parse(text)
          } catch {
            return { error: { message: `Server error: ${text}` } }
          }
        } catch {
          return { error: { message: 'Logout failed' } }
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
      then(resolve: (value: any) => any) {
        return Promise.resolve({ data: null, error: { message: 'RPC not available in desktop mode' } }).then(resolve)
      },
    }),
  }
}

/**
 * Create (or return existing) browser-safe Supabase-compatible client.
 */
export function createBrowserClient() {
  if (!_browserClient) {
    _browserClient = _createBrowserClient()
  }
  return _browserClient
}
