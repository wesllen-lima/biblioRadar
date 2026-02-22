import type { BookResult } from '@/lib/types'

export type GNode = {
  id: string
  label: string
  type: 'author' | 'subject'
  count: number
  x: number
  y: number
}

export type GEdge = { source: string; target: string }

export function buildGraph(books: BookResult[]): {
  nodes: GNode[]
  edges: GEdge[]
} {
  const authorCounts = new Map<string, number>()
  const subjectCounts = new Map<string, number>()
  const edgeSet = new Set<string>()

  for (const b of books) {
    for (const a of b.authors)
      authorCounts.set(a, (authorCounts.get(a) ?? 0) + 1)
    for (const s of b.subject ?? [])
      subjectCounts.set(s, (subjectCounts.get(s) ?? 0) + 1)
    for (const a of b.authors)
      for (const s of b.subject ?? []) edgeSet.add(`${a}|||${s}`)
  }

  if (subjectCounts.size === 0) {
    for (const b of books)
      for (let i = 0; i < b.authors.length; i++)
        for (let j = i + 1; j < b.authors.length; j++)
          edgeSet.add(`${b.authors[i]}|||${b.authors[j]}`)
  }

  const topAuthors = [...authorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 28)
    .map(([id, count]) => ({
      id,
      label: id,
      type: 'author' as const,
      count,
      x: 0,
      y: 0,
    }))

  const topSubjects = [...subjectCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id, count]) => ({
      id,
      label: id,
      type: 'subject' as const,
      count,
      x: 0,
      y: 0,
    }))

  const authorIds = new Set(topAuthors.map((n) => n.id))
  const subjectIds = new Set(topSubjects.map((n) => n.id))

  const edges: GEdge[] = []
  for (const e of edgeSet) {
    const [s, t] = e.split('|||')
    if (authorIds.has(s) && (subjectIds.has(t) || authorIds.has(t)))
      edges.push({ source: s, target: t })
  }

  return { nodes: [...topAuthors, ...topSubjects], edges }
}

export function runForceLayout(
  nodes: GNode[],
  edges: GEdge[],
  w: number,
  h: number
): void {
  if (nodes.length === 0) return
  const cx = w / 2,
    cy = h / 2
  const k = Math.sqrt((w * h) / Math.max(nodes.length, 1)) * 0.55

  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI
    n.x = cx + Math.cos(angle) * k * 2.5
    n.y = cy + Math.sin(angle) * k * 2.5
  })

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (let iter = 0; iter < 120; iter++) {
    const cooling = Math.max(0.01, 1 - iter / 120)
    const dx = new Float64Array(nodes.length)
    const dy = new Float64Array(nodes.length)

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ddx = nodes[j].x - nodes[i].x || 0.01
        const ddy = nodes[j].y - nodes[i].y || 0.01
        const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1
        const f = (k * k) / d
        dx[i] -= (ddx / d) * f
        dy[i] -= (ddy / d) * f
        dx[j] += (ddx / d) * f
        dy[j] += (ddy / d) * f
      }
    }

    for (const e of edges) {
      const s = nodeMap.get(e.source)
      const tgt = nodeMap.get(e.target)
      if (!s || !tgt) continue
      const si = nodes.indexOf(s),
        ti = nodes.indexOf(tgt)
      const ddx = tgt.x - s.x,
        ddy = tgt.y - s.y
      const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1
      const f = (d * d) / k
      dx[si] += (ddx / d) * f
      dy[si] += (ddy / d) * f
      dx[ti] -= (ddx / d) * f
      dy[ti] -= (ddy / d) * f
    }

    for (let i = 0; i < nodes.length; i++) {
      const dist = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]) || 1
      const limit = k * cooling * 0.5
      nodes[i].x += (dx[i] / dist) * Math.min(dist, limit)
      nodes[i].y += (dy[i] / dist) * Math.min(dist, limit)
      nodes[i].x = Math.max(64, Math.min(w - 64, nodes[i].x))
      nodes[i].y = Math.max(40, Math.min(h - 40, nodes[i].y))
    }
  }
}
