# BiblioRadar

> Unified discovery for books and academic papers — local-first, no account required, no data leaves your browser.

[Versão em português](./README.md)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Tests](https://img.shields.io/badge/tests-64%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![i18n](https://img.shields.io/badge/i18n-PT%20%7C%20EN%20%7C%20ES-blueviolet)
![PWA](https://img.shields.io/badge/PWA-installable-orange)

---

## Overview

BiblioRadar searches Project Gutenberg, Internet Archive, Open Library, arXiv, Zenodo, HAL, and Europe PMC simultaneously from a single input. Results are ranked, deduplicated, and filtered client-side. Your library — saved books, tags, reading status, notes — is stored exclusively in IndexedDB. Nothing is ever sent to BiblioRadar servers.

**Built for:** researchers, students, and readers who want a fast, privacy-preserving way to discover and catalog public-domain and open-access literature.

---

## Features

### Search & Discovery

- Parallel search across all configured sources from a single query
- Server-side ranking and deduplication (`lib/rank.ts`, `lib/merge.ts`)
- Filters: format (PDF/EPUB/HTML), year range, source selection, sort order
- PDF/EPUB availability verified with batched HEAD requests + CORS proxy fallback
- Virtual list rendering via `react-virtuoso` for large result sets
- Search history and suggestions in the command palette
- URL-persisted search state (`?q=`, `?sort=`, `?fmt=`, `?ymin=`, `?ymax=`, `?src=`)

### Personal Library

- Full IndexedDB persistence — survives restarts, works offline
- Reading status per book: **unread → reading → done** (one-click cycle)
- Custom tags with color-coded chips
- Bulk operations: tag, change status, or delete multiple books at once
- Grid and list view modes with URL-persisted preferences
- Filter by status, tag, year, or author; sort by title, year, or date added
- Automatic metadata enrichment via Open Library on save (cover + synopsis)

### Citation & Export

| Format      | Export                               |
| ----------- | ------------------------------------ |
| ABNT        | Copy to clipboard                    |
| APA         | Copy to clipboard                    |
| MLA         | Copy to clipboard                    |
| Chicago     | Copy to clipboard                    |
| BibTeX      | Copy to clipboard or download `.bib` |
| Zotero RDF  | Download                             |
| JSON backup | Full library with all metadata       |
| Markdown    | Reading list                         |
| CSV         | Spreadsheet-compatible               |
| JSON-LD     | Linked data                          |

### Sharing & Sync

- P2P library sync via a single compressed URL — no server, no account
- Import merges with current library without duplicates
- JSON backup/restore for migration between devices

### Knowledge Graph

- SVG force-directed graph of authors and subjects in your library
- Pan and zoom with mouse/touch
- Click a node to filter your library by author or subject
- Export as SVG

### Infrastructure

- **PWA**: installable on desktop and mobile with service worker caching
- **Offline mode**: serves cached results when the network is unavailable
- **i18n**: full UI translation in Brazilian Portuguese, English, and Spanish — all user-visible strings go through `t("key")`
- **Accessibility**: WCAG 2.2 AA — full keyboard navigation, ARIA labels, focus traps on modals, skip-to-content link
- **Responsive**: bottom navigation on mobile, sidebar on desktop
- **Theming**: dark/light with system preference detection, zero flash on reload
- **Command palette** (⌘K / Ctrl+K): navigate, search, and trigger actions from anywhere

---

## Search Sources

| Source                | What it indexes                                                                |
| --------------------- | ------------------------------------------------------------------------------ |
| **Project Gutenberg** | 70,000+ public-domain books via gutendex.com                                   |
| **Internet Archive**  | Millions of scanned texts, historical documents, and media                     |
| **Open Library**      | Comprehensive book catalog with cover images and edition data                  |
| **arXiv**             | 2M+ scientific preprints: physics, math, CS, biology, economics                |
| **Zenodo**            | CERN multidisciplinary open-access repository — papers, datasets, software     |
| **HAL**               | French open archive with scientific output from universities and research labs |
| **Europe PMC**        | Biomedical and life sciences open-access literature (PubMed Central Europe)    |
| **OPDS feeds**        | User-configured digital library feeds (e.g. Standard Ebooks, library catalogs) |
| **Custom scrapers**   | CSS selector-based scrapers for any publicly accessible HTML site              |

OPDS feeds and custom scrapers are configured per-user in Settings and stored locally — they never leave the browser.

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/wesllen-lima/BiblioRadar.git
cd BiblioRadar
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available commands

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm run lint     # ESLint
npm test         # Vitest suite (64 tests)
npx tsc --noEmit # Type check without emitting
```

---

## Architecture

BiblioRadar is **local-first**: the server handles only stateless, ephemeral work (API aggregation, CORS proxy, PDF HEAD checks). The client owns all persistent state.

```
src/
├── app/
│   ├── page.tsx                    # Home — search, filters, featured view
│   ├── library/page.tsx            # Personal library with bulk ops
│   ├── settings/page.tsx           # Providers, data management, preferences
│   ├── graph/page.tsx              # SVG knowledge graph
│   ├── loading.tsx                 # Route-level skeleton screens
│   └── api/
│       ├── search/route.ts         # Fans out to all providers, merges, ranks
│       ├── head/route.ts           # Single PDF HEAD check
│       ├── head-batch/route.ts     # Batched PDF HEAD checks
│       ├── download/route.ts       # CORS proxy for PDF downloads
│       ├── scrape/route.ts         # Executes CSS scrapers server-side
│       └── search-by-provider/     # Per-provider search (OPDS, custom)
├── components/                     # React client components
│   ├── BookCard.tsx                # Search result card (list variant)
│   ├── BookDetailModal.tsx         # Full-screen book detail
│   ├── CitationModal.tsx           # Citation format picker
│   ├── FilterPanel.tsx             # Sidebar/drawer filter controls
│   ├── FeaturedView.tsx            # Curated horizontal carousel
│   ├── GridCard.tsx                # Library card (grid variant)
│   ├── ProviderStatus.tsx          # Per-source status pills with retry
│   ├── NavigationProgress.tsx      # Thin progress bar on route changes
│   ├── CommandPalette.tsx          # ⌘K quick navigation
│   ├── BottomNav.tsx               # Mobile bottom navigation
│   └── P2PSync.tsx                 # Library URL sync
└── lib/
    ├── providers/                  # gutenberg.ts | internetArchive.ts |
    │                               # openLibrary.ts | arxiv.ts | zenodo.ts |
    │                               # hal.ts | europePMC.ts | opds.ts
    ├── i18n/                       # Locale dictionaries (ptBR.ts, en.ts, es.ts)
    ├── i18n.ts                     # i18n system — pickLocale, format, DICTS
    ├── types.ts                    # BookResult, SourceId union
    ├── rank.ts                     # Result scoring: source weight, PDF bonus, dedup
    ├── merge.ts                    # Title+author[0] deduplication
    ├── coverUtils.ts               # Shared gradient palette for book cover fallbacks
    ├── graph.ts                    # buildGraph + runForceLayout (force-directed)
    ├── searchFilters.ts            # applyFilters + applySort (pure functions)
    ├── db.ts                       # IndexedDB layer (idb)
    ├── useLibrary.tsx              # LibraryProvider context with BroadcastChannel sync
    ├── enrichment.ts               # Open Library enrichment on save
    ├── idbCache.ts                 # IndexedDB-backed search result cache
    └── searchCache.ts              # Cache key helpers + TTL logic
```

### Design decisions

**No database.** `IndexedDB` (via `idb`) holds the library, settings, and cache. A JSON export handles backup and migration. The schema is a flat array of `BookResult` — simple enough to reason about and import into any tool.

**No authentication.** P2P sharing encodes the library into a compressed URL query parameter. Nothing passes through BiblioRadar servers.

**Search is stateless.** Each query hits `/api/search`, which fans out to provider modules in parallel using `Promise.allSettled`, merges, ranks, and returns. Provider failures are isolated — one unavailable source does not block results from the others.

**Provider modules are isolated.** Each source exports a single `search(query): Promise<BookResult[]>` function. Adding a new built-in source means creating one file and registering it in the route handler.

**Utility extraction over duplication.** Shared logic lives in focused modules (`coverUtils.ts`, `graph.ts`, `searchFilters.ts`) rather than being duplicated across components. No file exceeds 500 lines.

---

## Contributing

1. Fork the repository and create a feature branch from `master`.
2. **TypeScript strict mode** — no `any`. Use the `SourceId` union for source identifiers.
3. **i18n** — every user-visible string must go through `t("key")`. Add new keys to all three locale files in `src/lib/i18n/`.
4. **Design system** — use the utility classes from `globals.css`: `.card`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.field`, `.chip`, `.skeleton`, `.glass`.
5. **Tests** — add or update Vitest tests for logic changes in `lib/`. Run `npm test` to verify all tests pass.
6. **Validation** before opening a PR:
   ```bash
   npx tsc --noEmit   # zero errors required
   npm run build      # clean build required
   npm test           # all tests passing
   ```

---

## License

[MIT](./LICENSE) — free to use, modify, and distribute.
