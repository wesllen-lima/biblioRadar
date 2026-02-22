export const DEFAULT_LOCALE = 'pt-BR'
export type Locale = 'pt-BR' | 'en' | 'es'
export const LOCALES: Locale[] = ['pt-BR', 'en', 'es']

export type Dict = Record<string, string>

export { ptBR } from '@/lib/i18n/ptBR'
export { en } from '@/lib/i18n/en'
export { es } from '@/lib/i18n/es'

import { ptBR } from '@/lib/i18n/ptBR'
import { en } from '@/lib/i18n/en'
import { es } from '@/lib/i18n/es'

export const DICTS: Record<Locale, Dict> = { 'pt-BR': ptBR, en: en, es: es }

export function pickLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE
  const x = input.toLowerCase()
  if (x.startsWith('pt') || x.includes('pt-br')) return 'pt-BR'
  if (x.startsWith('es')) return 'es'
  return 'en'
}

export function format(str: string, params?: Record<string, unknown>) {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    String((params as Record<string, unknown>)[k] ?? '')
  )
}
