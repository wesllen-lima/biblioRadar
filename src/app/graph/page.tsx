'use client'

import { useLibrary } from '@/lib/useLibrary'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Network,
  ZoomIn,
  ZoomOut,
  Home as HomeIcon,
  Download,
} from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import { buildGraph, runForceLayout, type GNode } from '@/lib/graph'

export default function GraphPage() {
  const { items, isLoaded } = useLibrary()
  const { t } = useI18n()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    node: GNode
  } | null>(null)
  const [dims, setDims] = useState({ w: 800, h: 520 })

  // Pan/zoom state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const { nodes: rawNodes, edges } = useMemo(() => {
    if (!isLoaded) return { nodes: [], edges: [] }
    return buildGraph(items)
  }, [items, isLoaded])

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        setDims({ w, h: Math.min(580, Math.max(360, w * 0.6)) })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const layoutNodes = useMemo(() => {
    if (!rawNodes.length) return []
    const cloned = rawNodes.map((n) => ({ ...n }))
    runForceLayout(cloned, edges, dims.w, dims.h)
    return cloned
  }, [rawNodes, edges, dims])

  const nodeMap = useMemo(
    () => new Map(layoutNodes.map((n) => [n.id, n])),
    [layoutNodes]
  )

  const neighborIds = useMemo(() => {
    if (!hovered) return null
    const ids = new Set<string>([hovered])
    for (const e of edges) {
      if (e.source === hovered) ids.add(e.target)
      if (e.target === hovered) ids.add(e.source)
    }
    return ids
  }, [hovered, edges])

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }, [])

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 1.1 : 0.9
    setZoom((z) => Math.min(4, Math.max(0.3, z * delta)))
  }, [])

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
  const zoomIn = () => setZoom((z) => Math.min(4, z * 1.25))
  const zoomOut = () => setZoom((z) => Math.max(0.3, z / 1.25))

  const exportPng = () => {
    const svg = svgRef.current
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge-graph.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <Network
          size={48}
          className="mx-auto mb-4 text-muted-foreground"
          strokeWidth={1.5}
        />
        <h1 className="mb-2 text-2xl font-bold">{t('graph.title')}</h1>
        <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
          {t('graph.empty')}
        </p>
        <Link href="/" className="btn-primary">
          {t('library.back')}
        </Link>
      </div>
    )
  }

  const authorCount = layoutNodes.filter((n) => n.type === 'author').length
  const subjectCount = layoutNodes.filter((n) => n.type === 'subject').length

  return (
    <div className="animate-in mx-auto max-w-6xl py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/library"
          className="btn-ghost btn-sm mb-4 w-fit pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft size={16} className="mr-1" /> {t('graph.back')}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <Network size={28} className="text-primary" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold">{t('graph.title')}</h1>
            </div>
            <p className="ml-10 text-sm text-muted-foreground">
              {t('graph.subtitle')}
            </p>
          </div>
          <button
            onClick={exportPng}
            className="btn-outline btn-sm hidden gap-2 sm:flex"
          >
            <Download size={14} /> SVG
          </button>
        </div>
      </div>

      {subjectCount === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-600 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          {t('graph.noSubjects')}
        </div>
      )}

      <div
        ref={containerRef}
        className="card relative overflow-hidden select-none"
      >
        <svg
          ref={svgRef}
          width={dims.w}
          height={dims.h}
          className="block w-full"
          style={{
            height: dims.h,
            cursor: isDragging.current ? 'grabbing' : 'grab',
          }}
          aria-label={t('graph.title')}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map((e, i) => {
              const s = nodeMap.get(e.source)
              const tgt = nodeMap.get(e.target)
              if (!s || !tgt) return null
              const dimmed =
                neighborIds &&
                !neighborIds.has(e.source) &&
                !neighborIds.has(e.target)
              return (
                <line
                  key={i}
                  x1={s.x}
                  y1={s.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="var(--color-primary)"
                  strokeOpacity={dimmed ? 0.05 : 0.18}
                  strokeWidth={1}
                />
              )
            })}

            {/* Nodes */}
            {layoutNodes.map((n) => {
              const r =
                n.type === 'author'
                  ? Math.min(20, 9 + n.count * 2)
                  : Math.min(13, 5 + n.count * 1.5)
              const dimmed = neighborIds && !neighborIds.has(n.id)
              const active = hovered === n.id
              const fill =
                n.type === 'author'
                  ? 'var(--color-primary)'
                  : 'var(--color-success, #16a34a)'
              const maxLen = n.type === 'author' ? 18 : 16
              const label =
                n.label.length > maxLen
                  ? n.label.slice(0, maxLen) + '…'
                  : n.label

              return (
                <g
                  key={n.id}
                  style={{
                    cursor: n.type === 'author' ? 'pointer' : 'default',
                  }}
                  opacity={dimmed ? 0.2 : 1}
                  onMouseEnter={(e) => {
                    setHovered(n.id)
                    const rect = (
                      e.currentTarget.ownerSVGElement as SVGSVGElement
                    ).getBoundingClientRect()
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      node: n,
                    })
                  }}
                  onMouseLeave={() => {
                    setHovered(null)
                    setTooltip(null)
                  }}
                  onMouseMove={(e) => {
                    const rect = (
                      e.currentTarget.ownerSVGElement as SVGSVGElement
                    ).getBoundingClientRect()
                    setTooltip((prev) =>
                      prev
                        ? {
                            ...prev,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          }
                        : null
                    )
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (n.type === 'author')
                      router.push(
                        `/library?author=${encodeURIComponent(n.label)}`
                      )
                    else
                      router.push(
                        `/library?search=${encodeURIComponent(n.label)}`
                      )
                  }}
                  role="button"
                  aria-label={
                    n.type === 'author'
                      ? `${t('graph.filterBy')} ${n.label}`
                      : n.label
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (n.type === 'author')
                        router.push(
                          `/library?author=${encodeURIComponent(n.label)}`
                        )
                      else
                        router.push(
                          `/library?search=${encodeURIComponent(n.label)}`
                        )
                    }
                  }}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + (active ? 3 : 0)}
                    fill={fill}
                    fillOpacity={active ? 1 : 0.8}
                    stroke={active ? 'var(--foreground)' : fill}
                    strokeWidth={active ? 2.5 : 0}
                    style={{ transition: 'r 0.15s, fill-opacity 0.15s' }}
                  />
                  <text
                    x={n.x}
                    y={n.y + r + 14}
                    textAnchor="middle"
                    fontSize={n.type === 'author' ? 11 : 10}
                    fontWeight={active ? '600' : '400'}
                    fill="var(--foreground)"
                    fillOpacity={0.85}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="glass scale-in pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10, maxWidth: 200 }}
          >
            <p className="font-semibold text-foreground">
              {tooltip.node.label}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {tooltip.node.type === 'author'
                ? t('graph.legend.authors')
                : t('graph.legend.subjects')}{' '}
              · {tooltip.node.count}{' '}
              {tooltip.node.count === 1 ? 'livro' : 'livros'}
            </p>
            {tooltip.node.type === 'author' && (
              <p className="mt-1 text-[10px] text-primary">
                {t('graph.filterBy')} →
              </p>
            )}
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="btn-icon glass h-8 w-8 border border-border bg-background/90 shadow-sm"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={resetView}
            className="btn-icon glass h-8 w-8 border border-border bg-background/90 shadow-sm"
            aria-label="Reset view"
          >
            <HomeIcon size={14} />
          </button>
          <button
            onClick={zoomOut}
            className="btn-icon glass h-8 w-8 border border-border bg-background/90 shadow-sm"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-3 left-3 rounded border border-border/50 bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary" />
          {t('graph.legend.authors')} ({authorCount})
        </span>
        {subjectCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-success" />
            {t('graph.legend.subjects')} ({subjectCount})
          </span>
        )}
        <span className="ml-auto opacity-60">{t('graph.legend.hint')}</span>
      </div>
    </div>
  )
}
