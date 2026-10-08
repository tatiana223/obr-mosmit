export function normalizeNewsPhotoUrl(url?: string): string {
  if (!url) return ''
  let value = url.trim()
  const query = value.indexOf('?')
  if (query >= 0) value = value.slice(0, query)
  try {
    value = decodeURIComponent(value)
  } catch {
    // keep the raw path if it was not encoded
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      value = new URL(value).pathname
    } catch {
      const pathStart = value.indexOf('/', value.indexOf('//') + 2)
      if (pathStart >= 0) value = value.slice(pathStart)
    }
  }
  return value
}

export function extractNewsContentPhotos(html?: string): string[] {
  if (!html?.trim() || typeof DOMParser === 'undefined') return []
  const document = new DOMParser().parseFromString(html, 'text/html')
  return [...document.querySelectorAll('img')]
    .map((image) => image.getAttribute('src')?.trim() || '')
    .filter(Boolean)
}

export function listNewsGalleryPhotos(gallery: string[] = [], content = '', cover?: string): string[] {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const src of [...gallery, ...extractNewsContentPhotos(content), cover || '']) {
    const key = normalizeNewsPhotoUrl(src)
    if (!key || seen.has(key)) continue
    seen.add(key)
    urls.push(src)
  }
  return urls
}
