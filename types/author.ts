export interface Author {
  id: string
  name: string
  slug: string
  bio?: string | null
  image?: string | null
  quoteCount: number
  born?: string | null
  died?: string | null
}