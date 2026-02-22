'use client'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'
import {
  DICTS,
  DEFAULT_LOCALE,
  type Locale,
  pickLocale,
  format,
} from '@/lib/i18n'
import { setCookie, getCookie } from '@/lib/cookieStore'

type Ctx = {
  locale: Locale
  t: (key: string, params?: Record<string, unknown>) => string
  setLocale: (loc: Locale) => void
}

const I18nCtx = createContext<Ctx>({
  locale: DEFAULT_LOCALE,
  t: (k) => k,
  setLocale: () => {},
})

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE]

  useEffect(() => {
    const ck = getCookie('br_lang')

    let targetLocale = initialLocale

    if (!ck) {
      const nav = typeof navigator !== 'undefined' ? navigator.language : ''
      targetLocale = pickLocale(nav)

      setCookie('br_lang', targetLocale)
    } else {
      targetLocale = pickLocale(ck)
    }

    setLocale(targetLocale)
    document.documentElement.setAttribute('lang', targetLocale)
  }, [initialLocale])

  const t = useCallback(
    (key: string, params?: Record<string, unknown>) =>
      format(dict[key] ?? key, params),
    [dict]
  )

  const value = useMemo<Ctx>(
    () => ({
      locale,
      t,
      setLocale: (loc: Locale) => {
        setLocale(loc)
        setCookie('br_lang', loc)
        document.documentElement.setAttribute('lang', loc)
      },
    }),
    [locale, t]
  )

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  return useContext(I18nCtx)
}
