import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel, { DEFAULT_FILTERS } from './FilterPanel';

// Mock I18nProvider
vi.mock('@/components/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'library.bulk.toggle': 'Filtros',
        'library.clearFilters': 'Limpar',
        'library.sort.label': 'Ordenar',
        'library.format.label': 'Formato',
        'library.sort.relevance': 'Relevância',
        'library.sort.year_desc': 'Ano (desc)',
        'library.sort.year_asc': 'Ano (asc)',
        'library.sort.title': 'Título',
        'library.filter.all': 'Todos os formatos',
        'providers.title': 'Fontes',
        'library.year.min': 'Ano (mín)',
        'library.year.max': 'Ano (máx)',
      };
      return map[key] || key;
    },
    locale: 'pt',
  }),
}));

const availableSources = ['gutenberg', 'archive', 'opds:My OPDS'];

describe('FilterPanel', () => {
  it('renders closed by default', () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onChange={() => {}}
        availableSources={availableSources}
      />
    );

    expect(screen.getByText('Filtros')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ordenar')).not.toBeInTheDocument();
  });

  it('opens and closes when the toggle button is clicked', () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onChange={() => {}}
        availableSources={availableSources}
      />
    );

    const toggleButton = screen.getByText('Filtros');
    fireEvent.click(toggleButton);

    expect(screen.getByLabelText('Ordenar')).toBeInTheDocument();
    expect(screen.getByLabelText('Formato')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.queryByLabelText('Ordenar')).not.toBeInTheDocument();
  });

  it('calls onChange when a filter is changed', () => {
    const handleChange = vi.fn();
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        onChange={handleChange}
        availableSources={availableSources}
      />
    );

    fireEvent.click(screen.getByText('Filtros'));

    const sortSelect = screen.getByLabelText('Ordenar');
    fireEvent.change(sortSelect, { target: { value: 'year_desc' } });

    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      sort: 'year_desc',
    });

    const sourceButton = screen.getByText('Project Gutenberg');
    fireEvent.click(sourceButton);

    expect(handleChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      sources: ['archive', 'opds:My OPDS'],
    });
  });

  it('shows active state and allows resetting', () => {
    const handleChange = vi.fn();
    const activeFilters = { ...DEFAULT_FILTERS, sort: 'title_az' as const };
    render(
      <FilterPanel
        filters={activeFilters}
        onChange={handleChange}
        availableSources={availableSources}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    const clearButton = screen.getByText('Limpar');
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith(DEFAULT_FILTERS);
  });
});
