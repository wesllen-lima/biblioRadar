'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/components/I18nProvider'

export type SortOption = 'relevance' | 'year_desc' | 'year_asc' | 'title_az'
export type FormatFilter = 'all' | 'pdf' | 'epub' | 'html'

export type SearchFilters = {
  sort: SortOption
  format: FormatFilter
  yearMin: number | null
  yearMax: number | null
  sources: string[]
}

export const DEFAULT_FILTERS: SearchFilters = {
  sort: 'relevance',
  format: 'all',
  yearMin: null,
  yearMax: null,
  sources: [],
}

const CURRENT_YEAR = new Date().getFullYear()

type FilterPanelProps = {
  filters: SearchFilters
  onChange: (f: SearchFilters) => void
  availableSources: string[]
}

function sourceLabel(src: string): string {
  if (src.includes('gutenberg')) return 'Project Gutenberg'
  if (src.includes('archive')) return 'Internet Archive'
  if (src.includes('open_library')) return 'Open Library'
  if (src.startsWith('opds:'))
    return src
      .slice(5)
      .replace(/https?:\/\//, '')
      .split('/')[0]
  if (src.startsWith('scrape:')) return src.slice(7)
  return src
}

function sourceClass(src: string): string {
  if (src.includes('gutenberg')) return 'badge-source-gutenberg'
  if (src.includes('archive')) return 'badge-source-archive'
  if (src.includes('open_library')) return 'badge-source-openlibrary'
  return 'badge-source-default'
}

export default function FilterPanel({
  filters,
  onChange,
  availableSources,
}: FilterPanelProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const isActive =
    filters.sort !== 'relevance' ||
    filters.format !== 'all' ||
    filters.yearMin !== null ||
    filters.yearMax !== null ||
    filters.sources.length > 0

  const activeCount = [
    filters.sort !== 'relevance',
    filters.format !== 'all',
    filters.yearMin !== null,
    filters.yearMax !== null,
    filters.sources.length > 0,
  ].filter(Boolean).length

  const reset = () => onChange(DEFAULT_FILTERS)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isActive
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70'
          }`}
          aria-expanded={open}
        >
          <SlidersHorizontal size={13} />
          {t('library.bulk.toggle')}
          {isActive && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
        {isActive && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={12} /> {t('library.clearFilters')}
          </button>
        )}
      </div>

      {open && (
        <div className="fade-blur-in mt-3 space-y-4 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Sort */}
            <div>
              <label htmlFor="sort-select" className="label mb-1.5 block">
                {t('library.sort.label')}
              </label>
              <select
                id="sort-select"
                value={filters.sort}
                onChange={(e) =>
                  onChange({ ...filters, sort: e.target.value as SortOption })
                }
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/40 focus:outline-none"
              >
                <option value="relevance">{t('library.sort.relevance')}</option>
                <option value="year_desc">{t('library.sort.year_desc')}</option>
                <option value="year_asc">{t('library.sort.year_asc')}</option>
                <option value="title_az">{t('library.sort.title')}</option>
              </select>
            </div>

            {/* Format */}
            <div>
              <label htmlFor="format-select" className="label mb-1.5 block">
                {t('library.format.label')}
              </label>
              <select
                id="format-select"
                value={filters.format}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    format: e.target.value as FormatFilter,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/40 focus:outline-none"
              >
                <option value="all">{t('library.filter.all')}</option>
                <option value="pdf">PDF</option>
                <option value="epub">EPUB</option>
                <option value="html">HTML</option>
              </select>
            </div>

            {/* Year min */}
            <div>
              <label htmlFor="year-min-input" className="label mb-1.5 block">
                {t('library.year.min')}
              </label>
              <input
                id="year-min-input"
                type="number"
                min={1800}
                max={CURRENT_YEAR}
                placeholder="1800"
                value={filters.yearMin ?? ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    yearMin: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            {/* Year max */}
            <div>
              <label htmlFor="year-max-input" className="label mb-1.5 block">
                {t('library.year.max')}
              </label>
              <input
                id="year-max-input"
                type="number"
                min={1800}
                max={CURRENT_YEAR}
                placeholder={String(CURRENT_YEAR)}
                value={filters.yearMax ?? ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    yearMax: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Sources */}
          {availableSources.length > 0 && (
            <div>
              <label className="label mb-2 block">
                {t('providers.title')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSources.map((src) => {
                  const checked =
                    filters.sources.length === 0 ||
                    filters.sources.includes(src)
                  const toggle = () => {
                    if (filters.sources.length === 0) {
                      onChange({
                        ...filters,
                        sources: availableSources.filter((s) => s !== src),
                      })
                    } else if (filters.sources.includes(src)) {
                      const next = filters.sources.filter((s) => s !== src)
                      onChange({
                        ...filters,
                        sources: next.length === 0 ? [] : next,
                      })
                    } else {
                      const next = [...filters.sources, src]
                      onChange({
                        ...filters,
                        sources:
                          next.length === availableSources.length ? [] : next,
                      })
                    }
                  }
                  return (
                    <button
                      key={src}
                      onClick={toggle}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase transition-all ${
                        checked
                          ? `${sourceClass(src)} opacity-100`
                          : 'border-border bg-muted/40 text-muted-foreground opacity-50'
                      }`}
                    >
                      {sourceLabel(src)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
