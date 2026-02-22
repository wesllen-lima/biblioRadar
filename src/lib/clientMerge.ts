import type { BookResult } from './types'
import { mergeResults } from './merge'

export function mergeClient(results: BookResult[]): BookResult[] {
  return mergeResults(results, true)
}
