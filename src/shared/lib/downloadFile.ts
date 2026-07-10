const DEFAULT_TEXT_TYPE = 'text/plain;charset=utf-8'

export const contentTypeForDownload = (name: string): string => {
  const lower = name.toLowerCase()
  if (lower.endsWith('.csv')) return 'text/csv;charset=utf-8'
  if (lower.endsWith('.json')) return 'application/json;charset=utf-8'
  return DEFAULT_TEXT_TYPE
}

export function downloadFile(name: string, content: string, type = contentTypeForDownload(name)): boolean {
  let url: string | null = null
  let a: HTMLAnchorElement | null = null
  try {
    const blob = new Blob([content], { type })
    url = URL.createObjectURL(blob)
    a = document.createElement('a')
    a.href = url
    a.download = name
    a.style.display = 'none'
    document.body.append(a)
    a.click()
    return true
  } catch {
    return false
  } finally {
    a?.remove()
    if (url) {
      const revokeUrl = url
      setTimeout(() => {
        try { URL.revokeObjectURL(revokeUrl) } catch { /* best effort */ }
      }, 1000)
    }
  }
}
