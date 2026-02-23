import './globals.css'
import CookieConsent from '@/components/CookieConsent'
import { I18nProvider } from '@/components/I18nProvider'
import HeaderNav from '@/components/HeaderNav'
import BottomNav from '@/components/BottomNav'
import CommandPalette from '@/components/CommandPalette'
import { LibraryProvider } from '@/lib/useLibrary'
import { pickLocale, type Locale } from '@/lib/i18n'
import { headers, cookies } from 'next/headers'
import { Toaster } from 'sonner'
import OfflineBanner from '@/components/OfflineBanner'
import NavigationProgress from '@/components/NavigationProgress'
import PWAInstallBanner from '@/components/PWAInstallBanner'

const THEME_BOOTSTRAP = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var system = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var theme = saved || system;
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`

const SW_REGISTER = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
`

export const metadata = {
  title: 'BiblioRadar',
  description:
    'Encontre livros, artigos científicos e PDFs legais em várias fontes.',
}

export const viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
  interactiveWidget: 'resizes-content' as const,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ck = await cookies()
  const saved = ck.get('br_lang')?.value || null
  const h = await headers()
  const accept = h.get('accept-language') || ''
  const initialLocale = pickLocale(saved ?? accept) as Locale

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BiblioRadar" />
      </head>
      <body className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <I18nProvider initialLocale={initialLocale}>
          <LibraryProvider>
            <NavigationProgress />
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <OfflineBanner />
            <HeaderNav />
            <main
              id="main-content"
              className="mx-auto max-w-6xl px-3 md:px-6"
            >
              {children}
            </main>
            <BottomNav />
            <CommandPalette />
            <PWAInstallBanner />
            <CookieConsent />
            <Toaster position="bottom-center" richColors closeButton />
          </LibraryProvider>
        </I18nProvider>
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
      </body>
    </html>
  )
}
