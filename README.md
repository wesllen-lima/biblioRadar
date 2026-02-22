# BiblioRadar

> Descoberta unificada de livros e artigos acadêmicos — local-first, sem conta, sem envio de dados para servidores.

[English version](./README.en.md)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Testes](https://img.shields.io/badge/testes-64%20passando-brightgreen)
![Licença](https://img.shields.io/badge/licença-MIT-green)
![i18n](https://img.shields.io/badge/i18n-PT%20%7C%20EN%20%7C%20ES-blueviolet)
![PWA](https://img.shields.io/badge/PWA-instalável-orange)

---

## Visão Geral

O BiblioRadar pesquisa Project Gutenberg, Internet Archive, Open Library, arXiv, Zenodo, HAL e Europe PMC simultaneamente a partir de uma única busca. Os resultados são ranqueados, deduplicados e filtrados no cliente. Sua biblioteca — livros salvos, etiquetas, status de leitura e notas — é armazenada exclusivamente no IndexedDB do navegador. Nenhum dado é enviado aos servidores do BiblioRadar.

**Feito para:** pesquisadores, estudantes e leitores que querem uma forma rápida e privada de descobrir e catalogar literatura de domínio público e acesso aberto.

---

## Funcionalidades

### Busca e Descoberta

- Pesquisa paralela em todas as fontes configuradas a partir de uma única consulta
- Ranqueamento e deduplicação no servidor (`lib/rank.ts`, `lib/merge.ts`)
- Filtros: formato (PDF/EPUB/HTML), intervalo de ano, seleção de fonte, ordenação
- Disponibilidade de PDF/EPUB verificada com requisições HEAD em lote + proxy CORS como fallback
- Renderização de lista virtual com `react-virtuoso` para grandes conjuntos de resultados
- Histórico de busca e sugestões na paleta de comandos
- Estado de busca persistido na URL (`?q=`, `?sort=`, `?fmt=`, `?ymin=`, `?ymax=`, `?src=`)

### Biblioteca Pessoal

- Persistência completa no IndexedDB — sobrevive a reinicializações, funciona offline
- Status de leitura por livro: **não lido → lendo → lido** (clique para alternar)
- Etiquetas personalizadas com chips coloridos
- Operações em lote: etiquetar, mudar status ou excluir vários livros de uma vez
- Modos de visualização em grade e lista com preferências persistidas na URL
- Filtrar por status, etiqueta, ano ou autor; ordenar por título, ano ou data de adição
- Enriquecimento automático de metadados via Open Library ao salvar (capa + sinopse)

### Citação e Exportação

| Formato     | Exportação                                 |
| ----------- | ------------------------------------------ |
| ABNT        | Copiar para área de transferência          |
| APA         | Copiar para área de transferência          |
| MLA         | Copiar para área de transferência          |
| Chicago     | Copiar para área de transferência          |
| BibTeX      | Copiar ou baixar `.bib`                    |
| Zotero RDF  | Baixar                                     |
| Backup JSON | Biblioteca completa com todos os metadados |
| Markdown    | Lista de leitura                           |
| CSV         | Compatível com planilhas                   |
| JSON-LD     | Dados vinculados                           |

### Compartilhamento e Sincronização

- Sincronização P2P via URL comprimida — sem servidor, sem conta
- Importação mescla com a biblioteca atual sem duplicatas
- Backup/restauração em JSON para migração entre dispositivos

### Grafo de Conhecimento

- Grafo SVG force-directed de autores e assuntos da sua biblioteca
- Pan e zoom com mouse/toque
- Clique em um nó para filtrar a biblioteca por autor ou assunto
- Exportar como SVG

### Infraestrutura

- **PWA**: instalável no desktop e mobile com service worker e cache offline
- **Modo offline**: exibe resultados em cache quando a rede está indisponível
- **i18n**: tradução completa em Português Brasileiro, Inglês e Espanhol — todas as strings visíveis passam por `t("chave")`
- **Acessibilidade**: WCAG 2.2 AA — navegação full-keyboard, ARIA labels, focus traps em modais, link skip-to-content
- **Responsivo**: navegação inferior no mobile, sidebar no desktop
- **Temas**: escuro/claro com detecção de preferência do sistema, sem flash ao recarregar
- **Paleta de comandos** (⌘K / Ctrl+K): navegue, busque e acione ações de qualquer página

---

## Fontes de Busca

| Fonte                     | O que indexa                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Project Gutenberg**     | 70.000+ livros de domínio público via gutendex.com                                                      |
| **Internet Archive**      | Milhões de textos digitalizados, documentos históricos e mídia                                          |
| **Open Library**          | Catálogo abrangente de livros com imagens de capas e dados de edições                                   |
| **arXiv**                 | 2M+ preprints científicos: física, matemática, computação, biologia, economia                           |
| **Zenodo**                | Repositório multidisciplinar de acesso aberto do CERN — artigos, dados, software                       |
| **HAL**                   | Arquivo aberto francês com produção científica de universidades e institutos de pesquisa                |
| **Europe PMC**            | Literatura biomédica e ciências da vida com acesso aberto (PubMed Central Europa)                      |
| **Feeds OPDS**            | Feeds de bibliotecas digitais configurados pelo usuário (ex: Standard Ebooks, catálogos de bibliotecas) |
| **Scrapers customizados** | Scrapers baseados em seletores CSS para qualquer site HTML publicamente acessível                       |

Feeds OPDS e scrapers customizados são configurados por usuário nas Configurações e armazenados localmente — nunca saem do navegador.

---

## Como Começar

**Pré-requisitos:** Node.js 18+ e npm.

```bash
git clone https://github.com/wesllen-lima/BiblioRadar.git
cd BiblioRadar
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Comandos disponíveis

```bash
npm run dev      # Servidor de desenvolvimento com Turbopack
npm run build    # Build de produção
npm run lint     # ESLint
npm test         # Suite de testes Vitest (64 testes)
npx tsc --noEmit # Verificação de tipos sem emitir arquivos
```

---

## Arquitetura

O BiblioRadar é **local-first**: o servidor lida apenas com trabalho efêmero e sem estado (agregação de APIs, proxy CORS, verificações HEAD de PDFs). O cliente é dono de todo o estado persistente.

```
src/
├── app/
│   ├── page.tsx                    # Home — busca, filtros, vitrine
│   ├── library/page.tsx            # Biblioteca pessoal com operações em lote
│   ├── settings/page.tsx           # Fontes, gestão de dados, preferências
│   ├── graph/page.tsx              # Grafo de conhecimento SVG
│   ├── loading.tsx                 # Skeleton screens por rota
│   └── api/
│       ├── search/route.ts         # Distribui para todos os provedores, mescla e ranqueia
│       ├── head/route.ts           # Verificação HEAD de um único PDF
│       ├── head-batch/route.ts     # Verificações HEAD em lote
│       ├── download/route.ts       # Proxy CORS para downloads de PDF
│       ├── scrape/route.ts         # Executa scrapers CSS no servidor
│       └── search-by-provider/     # Busca por provedor (OPDS, custom)
├── components/                     # Componentes React cliente
│   ├── BookCard.tsx                # Card de resultado de busca (variante lista)
│   ├── BookDetailModal.tsx         # Detalhe completo do livro
│   ├── CitationModal.tsx           # Seletor de formato de citação
│   ├── FilterPanel.tsx             # Controles de filtro em sidebar/drawer
│   ├── FeaturedView.tsx            # Carrossel horizontal curado
│   ├── GridCard.tsx                # Card da biblioteca (variante grade)
│   ├── ProviderStatus.tsx          # Pills de status por fonte com retry
│   ├── NavigationProgress.tsx      # Barra de progresso fina em mudanças de rota
│   ├── CommandPalette.tsx          # Navegação rápida ⌘K
│   ├── BottomNav.tsx               # Navegação inferior para mobile
│   └── P2PSync.tsx                 # Sincronização de biblioteca via URL
└── lib/
    ├── providers/                  # gutenberg.ts | internetArchive.ts |
    │                               # openLibrary.ts | arxiv.ts | zenodo.ts |
    │                               # hal.ts | europePMC.ts | opds.ts
    ├── i18n/                       # Dicionários de localização (ptBR.ts, en.ts, es.ts)
    ├── i18n.ts                     # Sistema i18n — pickLocale, format, DICTS
    ├── types.ts                    # BookResult, union SourceId
    ├── rank.ts                     # Pontuação de resultados: peso por fonte, bônus PDF, dedup
    ├── merge.ts                    # Deduplicação por título+autor[0]
    ├── coverUtils.ts               # Paleta de gradientes para capas sem imagem
    ├── graph.ts                    # buildGraph + runForceLayout (force-directed)
    ├── searchFilters.ts            # applyFilters + applySort (funções puras)
    ├── db.ts                       # Camada IndexedDB (idb)
    ├── useLibrary.tsx              # Contexto LibraryProvider com sync via BroadcastChannel
    ├── enrichment.ts               # Enriquecimento via Open Library ao salvar
    ├── idbCache.ts                 # Cache de resultados de busca no IndexedDB
    └── searchCache.ts              # Helpers de chave de cache + lógica de TTL
```

### Decisões de design

**Sem banco de dados.** O `IndexedDB` (via `idb`) armazena a biblioteca, configurações e cache. Um export JSON cuida de backup e migração. O schema é um array plano de `BookResult` — simples o suficiente para entender e importar em qualquer ferramenta.

**Sem autenticação.** O compartilhamento P2P codifica a biblioteca em um parâmetro de URL comprimido. Nada passa pelos servidores do BiblioRadar.

**A busca é stateless.** Cada consulta acessa `/api/search`, que distribui para os módulos de provedor em paralelo com `Promise.allSettled`, mescla, ranqueia e retorna. Falhas de provedor são isoladas — uma fonte indisponível não bloqueia os resultados das demais.

**Módulos de provedor são isolados.** Cada fonte exporta uma única função `search(query): Promise<BookResult[]>`. Adicionar uma nova fonte nativa significa criar um arquivo e registrá-lo no handler de rota.

**Extração de utilitários em vez de duplicação.** Lógica compartilhada fica em módulos focados (`coverUtils.ts`, `graph.ts`, `searchFilters.ts`) em vez de ser duplicada entre componentes. Nenhum arquivo ultrapassa 500 linhas.

---

## Contribuindo

1. Faça um fork do repositório e crie uma branch de feature a partir de `master`.
2. **TypeScript strict mode** — sem `any`. Use a union `SourceId` para identificadores de fonte.
3. **i18n** — toda string visível ao usuário deve passar por `t("chave")`. Adicione novas chaves nos três arquivos de locale em `src/lib/i18n/`.
4. **Design system** — use as classes utilitárias de `globals.css`: `.card`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.field`, `.chip`, `.skeleton`, `.glass`.
5. **Testes** — adicione ou atualize testes Vitest para mudanças de lógica em `lib/`. Execute `npm test` para verificar que todos os testes passam.
6. **Validação** antes de abrir um PR:
   ```bash
   npx tsc --noEmit   # zero erros obrigatório
   npm run build      # build limpo obrigatório
   npm test           # todos os testes passando
   ```

---

## Licença

[MIT](./LICENSE) — livre para usar, modificar e distribuir.
