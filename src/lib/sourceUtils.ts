export function sourceLabel(src: string): string {
  if (src.includes('gutenberg')) return 'Project Gutenberg'
  if (src.includes('archive')) return 'Internet Archive'
  if (src.includes('open_library')) return 'Open Library'
  if (src === 'arxiv') return 'arXiv'
  if (src === 'zenodo') return 'Zenodo'
  if (src === 'hal') return 'HAL Open Archive'
  if (src === 'europe_pmc') return 'Europe PMC'
  if (src.startsWith('opds:'))
    return src
      .slice(5)
      .replace(/https?:\/\//, '')
      .split('/')[0]
  if (src.startsWith('scrape:')) return src.slice(7)
  return src.replace(/_/g, ' ')
}

export function sourceBadgeClass(src: string): string {
  if (src.includes('gutenberg')) return 'badge-source-gutenberg'
  if (src.includes('archive')) return 'badge-source-archive'
  if (src.includes('open_library')) return 'badge-source-openlibrary'
  if (src === 'arxiv') return 'badge-source-arxiv'
  if (src === 'zenodo') return 'badge-source-zenodo'
  if (src === 'hal') return 'badge-source-hal'
  if (src === 'europe_pmc') return 'badge-source-europepmc'
  return 'badge-source-default'
}
