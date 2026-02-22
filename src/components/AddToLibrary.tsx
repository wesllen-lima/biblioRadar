'use client'
import { useEffect, useState, useRef } from 'react'
import type { BookResult } from '@/lib/types'

const LS_KEY = 'my_pdf_library_v1'

function loadLib(): BookResult[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}
function saveLib(items: BookResult[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

export default function AddToLibrary() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [items, setItems] = useState<BookResult[]>([])
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setItems(loadLib())
  }, [])
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function add() {
    const u = url.trim()
    if (!u || !/^https?:\/\/.+/i.test(u) || !u.toLowerCase().endsWith('.pdf')) {
      alert('Informe um URL válido que termine com .pdf')
      return
    }
    const item: BookResult = {
      id: `user:${Date.now()}`,
      source: 'user',
      title: title.trim() || 'Sem título',
      authors: author ? [author.trim()] : [],
      cover: undefined,
      pdfUrl: u,
      readUrl: u,
    }
    const next = [item, ...items]
    setItems(next)
    saveLib(next)
    setUrl('')
    setTitle('')
    setAuthor('')
  }

  function remove(id: string) {
    const next = items.filter((i) => i.id !== id)
    setItems(next)
    saveLib(next)
  }

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-xl font-semibold">
        Minha biblioteca (links do usuário)
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Adicione um link **seu** para um PDF (Drive/Dropbox público ou material
        com acesso autorizado).
      </p>

      <div className="mb-3 flex flex-col gap-2 md:flex-row">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Autor (opcional)"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…arquivo.pdf"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          onClick={add}
          className="rounded-md border px-4 py-2 font-semibold transition hover:bg-neutral-900 hover:text-white"
        >
          Adicionar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600">Nenhum item ainda.</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between rounded-md border bg-white p-3"
            >
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-gray-600">
                  {it.authors.join(', ') || 'Autor desconhecido'}
                </div>
                <a
                  href={it.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  Abrir PDF
                </a>
              </div>
              <button
                onClick={() => remove(it.id)}
                className="rounded-md border px-3 py-1 text-sm transition hover:bg-neutral-100"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
