interface SearchOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
}

export function createSearchPattern(query: string, options: SearchOptions = {}) {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = options.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery
  const flags = options.caseSensitive ? 'g' : 'gi'
  return new RegExp(pattern, flags)
}

export function highlightMatches(text: string, query: string, options: SearchOptions = {}) {
  const pattern = createSearchPattern(query, options)
  return text.replace(pattern, match => `<mark>${match}</mark>`)
}

export function calculateSearchScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase()
  const normalizedQuery = query.toLowerCase()

  // Exact match gets highest score
  if (normalizedText === normalizedQuery) return 1

  // Contains whole query gets high score
  if (normalizedText.includes(normalizedQuery)) return 0.8

  // Partial word matches get medium score
  const words = normalizedQuery.split(/\s+/)
  const matchCount = words.filter(word => normalizedText.includes(word)).length
  if (matchCount > 0) return (matchCount / words.length) * 0.6

  return 0
}