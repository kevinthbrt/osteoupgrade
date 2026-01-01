/**
 * Normalizes a string by removing accents and converting to lowercase
 * Example: "Épaule" -> "epaule"
 */
export function normalizeSearchString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Checks if a search term matches a target string (case and accent insensitive)
 */
export function searchMatches(searchTerm: string, targetString: string): boolean {
  const normalizedSearch = normalizeSearchString(searchTerm)
  const normalizedTarget = normalizeSearchString(targetString)
  return normalizedTarget.includes(normalizedSearch)
}
