export const COVER_GRADIENTS = [
  'from-violet-500 to-purple-800',
  'from-blue-500 to-indigo-800',
  'from-emerald-400 to-teal-700',
  'from-orange-400 to-red-700',
  'from-pink-400 to-rose-700',
  'from-amber-400 to-orange-700',
  'from-cyan-400 to-blue-700',
  'from-fuchsia-500 to-violet-800',
]

export function titleGradient(title: string): string {
  const h = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COVER_GRADIENTS[h % COVER_GRADIENTS.length]
}
