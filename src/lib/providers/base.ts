import type { BookResult } from '../types'

export interface Provider {
  id: string
  label: string
  search: (q: string) => Promise<BookResult[]>
}
