// Fix de typage : selon l'ordre de résolution de @types/node (web-globals/fetch.d.ts)
// et du lib DOM, le type global `FormData` peut perdre ses méthodes DOM en build complet
// (-> "Property 'get' does not exist on type 'FormData'"). On réaffirme l'API DOM standard.
export {}

declare global {
  interface FormData {
    append(name: string, value: string | Blob, fileName?: string): void
    delete(name: string): void
    get(name: string): FormDataEntryValue | null
    getAll(name: string): FormDataEntryValue[]
    has(name: string): boolean
    set(name: string, value: string | Blob, fileName?: string): void
    forEach(
      callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void,
      thisArg?: any
    ): void
    entries(): IterableIterator<[string, FormDataEntryValue]>
    keys(): IterableIterator<string>
    values(): IterableIterator<FormDataEntryValue>
    [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>
  }
}
