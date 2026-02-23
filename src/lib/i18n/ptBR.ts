export const ptBR: Record<string, string> = {
  'brand.name': 'BiblioRadar',
  'home.title': 'Sua biblioteca digital gratuita',
  'home.tagline':
    'Busque em Gutenberg, Internet Archive, Open Library e arXiv ao mesmo tempo. Sem conta, sem rastreamento.',
  'home.badge': 'Open Source · Local-First · Gratuito',

  'search.placeholder': 'O que você quer aprender hoje? (Ctrl+K)',
  'search.placeholder.clean': 'O que você quer aprender hoje?',
  'search.aria': 'Campo de busca',
  'search.onlyPdf': 'Apenas PDF',
  'search.mode.books': 'Livros',
  'search.mode.articles': 'Artigos',
  'search.prioritizeExternal': 'Priorizar Externos',
  'results.none': "Nenhum resultado encontrado para '{q}' {pdf}.",
  'results.searching': 'Pesquisando em bibliotecas globais...',
  'results.loadMore': 'Carregar mais resultados',
  'results.count': '{count} livros encontrados',

  'library.title': 'Minha Estante',
  'library.empty': 'Sua estante aguarda novas histórias',
  'library.emptyDesc':
    'Navegue, descubra e salve seus livros e artigos favoritos aqui para acesso rápido.',
  'library.saved': 'Adicionado à sua estante',
  'library.removed': 'Removido da estante',
  'library.back': 'Continuar explorando',
  'library.count_one': 'item salvo',
  'library.count_other': 'itens salvos',

  'citation.title': 'Citação Bibliográfica',
  'citation.copy': 'Copiar Referência',
  'citation.copied': 'Copiado!',

  'book.untitled': 'Sem título',
  'book.unknownAuthor': 'Autor desconhecido',
  'book.download': 'Baixar PDF',
  'book.downloadEpub': 'Baixar EPUB',
  'book.read': 'Ler agora',
  'book.source': 'Ver na Fonte',
  'book.serverTooltip': 'Proxy Seguro (Ideal se o download direto falhar)',
  'book.notVerified': 'Não verificado',
  'book.details': 'Ver detalhes',
  'book.synopsis': 'Sinopse',
  'book.subjects': 'Assuntos',

  'providers.title': 'Fontes e Conexões',
  'providers.configure': 'Configurar Fontes',
  'about.title': 'Sobre o BiblioRadar',
  'about.desc':
    'Uma ferramenta open-source poderosa que unifica o acesso ao conhecimento humano.',
  'about.sources': 'Conectado a:',
  'footer.disclaimer':
    'O BiblioRadar é um agregador de links públicos. Respeitamos os direitos autorais e não hospedamos conteúdo.',

  'action.share': 'Compartilhar',
  'action.manage': 'Gerenciar',
  'action.info': 'Sobre',
  'action.close': 'Fechar',
  'action.share.copied': 'Link copiado!',
  'action.download_bib': 'Baixar BibTeX',
  'action.undo': 'Desfazer',
  'common.remove': 'Remover',

  'mobile.info': 'Informações',

  'cookies.title': 'Privacidade em primeiro lugar',
  'cookies.desc':
    'Usamos apenas armazenamento local (IndexedDB e localStorage) para salvar sua biblioteca, preferências e histórico. Nenhum dado é enviado a servidores externos.',
  'cookies.ok': 'Entendido',
  'cookies.later': 'Agora não',
  'cookies.privacy': '100% local, zero rastreamento',

  'settings.title': 'Configurações',
  'settings.subtitle':
    'Personalize suas fontes, integrações e gerencie seus dados locais.',
  'settings.back': 'Voltar para o Início',
  'settings.lang.title': 'Preferência de Idioma',
  'settings.lang.desc':
    'Priorizar resultados de busca neste idioma (quando suportado pela fonte).',
  'settings.lang.all': 'Todos os idiomas (Global)',
  'settings.lang.pt': 'Português',
  'settings.lang.en': 'Inglês',
  'settings.lang.es': 'Espanhol',
  'settings.data.title': 'Gerenciamento de Dados',
  'settings.providers.title': 'Fontes de Dados (Busca Integrada)',
  'settings.providers.desc':
    'Adicione feeds OPDS ou Scrapers. O conteúdo destas fontes aparecerá misturado aos resultados principais.',
  'settings.external.title': 'Acesso Rápido Externo',
  'settings.external.desc':
    'Configure atalhos para sites que não possuem API aberta. Ao pesquisar na Home, aparecerão botões para abrir sua busca nesses sites.',
  'settings.privacy.title': 'Privacidade & Segurança',
  'settings.privacy.desc':
    'O BiblioRadar funciona inteiramente no seu navegador ("Local-First"). Não rastreamos suas buscas.',
  'settings.search.title': 'Preferências de Busca',
  'settings.onlyPdf.label': 'Apenas PDF por padrão',
  'settings.onlyPdf.desc': 'Ocultar resultados sem PDF disponível.',
  'settings.enrich.label': 'Enriquecer metadados automaticamente',
  'settings.enrich.desc':
    'Ao salvar um livro, buscar capa e sinopse via Open Library (requer internet).',
  'settings.sync.title': 'Sincronização entre dispositivos',
  'settings.graph.title': 'Grafo de Conhecimento',
  'settings.graph.desc':
    'Visualize as conexões entre autores e assuntos da sua biblioteca em um grafo interativo.',
  'settings.graph.btn': 'Ver grafo',
  'settings.appearance.title': 'Aparência',

  'confirm.title': 'Confirmar ação',
  'confirm.cancel': 'Cancelar',
  'confirm.confirm': 'Confirmar',
  'confirm.delete': 'Excluir',

  'nav.home': 'Início',
  'nav.library': 'Estante',
  'nav.settings': 'Config',
  'nav.search': 'Buscar',
  'nav.addProvider': 'Adicionar',
  'nav.skipToContent': 'Ir para o conteúdo',

  'pm.tab.opds': 'OPDS',
  'pm.tab.scraper': 'Scraper',
  'pm.opds.add': 'Adicionar',
  'pm.scr.add': 'Adicionar',
  'pm.err.url': 'URL inválida',
  'pm.err.nameUrl': 'Nome ou URL inválidos',
  'pm.err.selectors': 'Seletores obrigatórios ausentes',
  'pm.scr.name': 'Nome da fonte',
  'pm.scr.url': 'URL de busca',
  'pm.opds.label': 'URL do Feed OPDS',
  'pm.opds.hint':
    'Feeds OPDS são padrões abertos usados por bibliotecas digitais.',
  'pm.css.required': 'Seletores CSS (Obrigatórios)',
  'pm.optional': 'Opcionais',
  'pm.active': 'Fontes Ativas',
  'pm.none': 'Nenhuma fonte personalizada adicionada.',
  'pm.opds.suggestions': 'Feeds OPDS — Resultados aparecem no BiblioRadar',
  'pm.opds.suggestions.hint':
    'Clique + para integrar diretamente à busca unificada.',
  'pm.opds.already_added': 'Já adicionado',

  'ext.quick.title': 'Sites externos',
  'ext.quick.none': 'Nenhum site externo configurado.',
  'ext.quick.add_suggested': 'Adicionar sugestões',
  'ext.quick.reload': 'Recarregar sugestões',
  'ext.quick.tip': 'Use {query} onde o termo de busca deve aparecer na URL.',
  'ext.namePh': 'Nome do site',
  'ext.urlPh': 'URL com {query} (ex: https://site.com/search?q={query})',
  'ext.add': 'Adicionar',
  'ext.added': 'Site adicionado',
  'ext.removed': 'Site removido',
  'ext.add.custom': 'Adicionar personalizado',

  'data.backup': 'Fazer Backup',
  'data.backup.desc': 'Baixar JSON',
  'data.backup.success': 'Backup salvo',
  'data.restore': 'Restaurar',
  'data.restore.desc': 'Carregar JSON',
  'data.restore.success': 'Dados restaurados. A página será recarregada.',
  'data.restore.error': 'Erro ao ler o arquivo de backup.',
  'data.reset': 'Resetar Tudo',
  'data.reset.desc': 'Apagar dados',
  'data.reset.confirm.title': 'Resetar todos os dados?',
  'data.reset.confirm.desc':
    'Isso apagará sua estante, provedores e configurações permanentemente. Esta ação não pode ser desfeita.',
  'data.reset.confirm.action': 'Resetar',
  'data.library.empty': 'Biblioteca vazia.',
  'data.export.title': 'Exportar biblioteca',
  'data.copyAbnt': 'Copiar ABNT',
  'data.export.bib.success': '{count} referências exportadas',
  'data.export.md.success': '{count} livros exportados',
  'data.export.csv.success': '{count} livros exportados',
  'data.export.jsonld.success': '{count} livros exportados',
  'data.export.zotero.success': '{count} referências exportadas',
  'data.export.abnt.success': '{count} referências ABNT copiadas',
  'data.import.invalid': 'Arquivo inválido.',

  'tag.favorites': 'Favoritos',
  'tag.reading': 'Lendo',
  'tag.toread': 'Para ler',
  'tag.done': 'Concluído',
  'tag.reference': 'Referência',
  'tag.add': 'Adicionar tag',
  'tag.remove': 'Remover tag',

  'status.unread': 'Não lido',
  'status.reading': 'Lendo',
  'status.done': 'Concluído',

  'featured.title': 'Vitrine de Descobertas',
  'featured.subtitle': 'Coleções curadas para inspirar sua próxima leitura.',
  'featured.type.books': 'Livros',
  'featured.type.articles': 'Artigos',
  'featured.topic.br-classics': 'Clássicos BR',
  'featured.topic.scifi': 'Sci-Fi & Futuro',
  'featured.topic.tech': 'Tech & Dev',
  'featured.topic.mystery': 'Mistério',
  'featured.topic.history': 'História',
  'featured.topic.ai': 'IA & Machine Learning',
  'featured.topic.climate': 'Clima & Meio Ambiente',
  'featured.topic.biology': 'Biologia',
  'featured.topic.physics': 'Física',

  'graph.title': 'Grafo de Conhecimento',
  'graph.subtitle':
    'Conexões entre autores e assuntos da sua biblioteca. Clique em um autor para filtrar.',
  'graph.empty':
    'Salve livros na sua estante para visualizar as conexões entre autores e assuntos.',
  'graph.back': 'Minha Estante',
  'graph.noSubjects':
    'Nenhum assunto detectado. Enriqueça os metadados em Configurações para ver mais conexões.',
  'graph.legend.authors': 'Autores',
  'graph.legend.subjects': 'Assuntos',
  'graph.legend.hint': 'Nó maior = mais livros',
  'graph.filterBy': 'Filtrar por',

  'library.bulk.toggle': 'Selecionar',
  'library.bulk.cancel': 'Cancelar',
  'library.bulk.selected': '{n} selecionados',
  'library.bulk.delete': 'Excluir selecionados',
  'library.bulk.tag': 'Adicionar tag',
  'library.bulk.selectAll': 'Todos',
  'library.search.placeholder': 'Buscar na estante...',
  'library.filter.all': 'Todos',
  'library.sort.newest': 'Mais recentes',
  'library.sort.oldest': 'Mais antigos',
  'library.sort.title': 'Título A-Z',
  'library.sort.year_desc': 'Ano (↓)',
  'library.sort.year_asc': 'Ano (↑)',
  'library.showing_of': 'Mostrando {shown} de {total} livros',
  'library.books_total': '{total} livros',
  'library.page_of': 'Página {page} de {total}',
  'library.select': 'Selecionar',
  'library.deselect': 'Desselecionar',
  'library.prev_page': 'Página anterior',
  'library.next_page': 'Próxima página',
  'library.emptyFilter': 'Nenhum livro encontrado com os filtros ativos.',
  'library.clearFilters': 'Limpar filtros',

  'offline.banner': 'Modo offline — exibindo dados em cache',

  'results.none_title': 'Nada encontrado',
  'results.check_spelling':
    'Verifique a ortografia ou tente remover o filtro de PDF.',
  'results.lang_filter_active':
    'Filtro de idioma ativo: {lang}. Tente mudar para "Global" nas configurações.',

  'sync.imported': '{count} livros importados da biblioteca compartilhada!',
  'sync.error': 'Não foi possível importar o link de sincronização.',
  'sync.share.label': 'Compartilhar minha biblioteca',
  'sync.share.desc':
    'Gera um link comprimido com todos os seus livros. Cole no outro dispositivo para importar.',
  'sync.share.btn': 'Gerar link',
  'sync.share.title': 'BiblioRadar — Minha Biblioteca',
  'sync.size': 'Tamanho comprimido: ~{size} KB',
  'sync.size.large': '— biblioteca grande. Prefira o backup JSON.',
  'sync.import.label': 'Importar de outro dispositivo',
  'sync.import.desc':
    'Cole o link gerado por outro BiblioRadar para mesclar as bibliotecas.',
  'sync.import.placeholder': 'Cole o link de sincronização aqui...',
  'sync.import.btn': 'Importar',
  'sync.import.merge':
    'Livros importados são mesclados com a biblioteca atual (sem duplicatas).',
  'sync.import.invalid':
    'Link inválido — certifique-se de colar o link completo.',
  'sync.copy': 'Copiar link',
  'sync.copy.success': 'Link copiado!',
  'sync.export.error': 'Erro ao gerar o link.',

  'theme.toggle.dark': 'Mudar para Escuro',
  'theme.toggle.light': 'Mudar para Claro',
  'theme.toggle.label': 'Alternar Tema',

  'lang.change': 'Mudar Idioma',
  'lang.current': 'Idioma atual: {lang}',

  'nav.graph': 'Grafo',

  'book.notes': 'Minhas Notas',
  'book.notes.placeholder':
    'Adicione notas, citações favoritas ou observações...',

  'onboarding.title': 'Bem-vindo ao BiblioRadar',
  'onboarding.f1':
    'Busca em Gutenberg, Archive, Open Library e arXiv de uma vez',
  'onboarding.f2':
    'Biblioteca pessoal no seu navegador — sem conta, sem rastreamento',
  'onboarding.f3':
    'Cite em ABNT, APA, BibTeX e compartilhe sua estante com um link',
  'onboarding.cta': 'Começar a explorar',
}
