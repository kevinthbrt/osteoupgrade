import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { createLocalClient } = await import('@/lib/osteoflow/database/server-query-builder')

    const descriptor = await request.json()
    const client = createLocalClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chain: any = client.from(descriptor.table)

    switch (descriptor.operation) {
      case 'select':
        chain = chain.select(descriptor.columns || '*', descriptor.selectOptions)
        break
      case 'insert':
        chain = chain.insert(descriptor.data)
        if (descriptor.returnSelect) chain = chain.select(descriptor.returnSelectColumns)
        break
      case 'update':
        chain = chain.update(descriptor.data)
        if (descriptor.returnSelect) chain = chain.select(descriptor.returnSelectColumns)
        break
      case 'delete':
        chain = chain.delete()
        if (descriptor.returnSelect) chain = chain.select(descriptor.returnSelectColumns)
        break
    }

    if (descriptor.conditions) {
      for (const cond of descriptor.conditions) {
        chain = chain[cond.type](cond.column, cond.value)
      }
    }

    if (descriptor.orders) {
      for (const ord of descriptor.orders) {
        chain = chain.order(ord.column, { ascending: ord.ascending })
      }
    }

    if (descriptor.offsetCount != null && descriptor.limitCount != null) {
      chain = chain.range(descriptor.offsetCount, descriptor.offsetCount + descriptor.limitCount - 1)
    } else if (descriptor.limitCount != null) {
      chain = chain.limit(descriptor.limitCount)
    }

    if (descriptor.singleResult) {
      chain = chain.single()
    }

    const result = await chain
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database query failed'
    console.error('[API/db] Error:', message)
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
