const DEFAULT_TEXT_TYPE = 'text/plain;charset=utf-8'

export const contentTypeForDownload = (name: string): string => {
  const lower = name.toLowerCase()
  if (lower.endsWith('.csv')) return 'text/csv;charset=utf-8'
  if (lower.endsWith('.json')) return 'application/json;charset=utf-8'
  return DEFAULT_TEXT_TYPE
}

export function downloadFile(name: string, content: string, type = contentTypeForDownload(name)) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.style.display = 'none'
  document.body.append(a)
  try {
    a.click()
  } finally {
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
