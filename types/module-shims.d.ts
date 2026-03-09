declare module '@vercel/blob' {
  export interface PutBlobResult {
    url: string
    downloadUrl?: string
    pathname?: string
    contentType?: string
    contentDisposition?: string
  }

  export interface PutCommandOptions {
    access?: 'public' | 'private'
    addRandomSuffix?: boolean
    allowOverwrite?: boolean
    cacheControlMaxAge?: number
    contentType?: string
  }

  export function put(
    pathname: string,
    body: Blob | string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: PutCommandOptions
  ): Promise<PutBlobResult>
}

declare module 'sql.js' {
  export interface Statement {
    bind(params?: unknown[]): void
    step(): boolean
    getAsObject(params?: unknown[]): Record<string, unknown>
    free(): void
  }

  export interface Database {
    run(sql: string, params?: unknown[]): void
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array | number[]) => Database
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}

declare module 'tailwind-merge' {
  export function twMerge(...classLists: unknown[]): string
}
