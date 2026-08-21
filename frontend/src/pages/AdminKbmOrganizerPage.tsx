import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const ORGANIZER_PATH = '/konkursy/krasota-bozhego-mira/organizer'
const HEIGHT_MESSAGE = 'kbm-organizer-height'
const TAB_MESSAGE = 'kbm-organizer-tab'
const ORGANIZER_TABS = new Set(['settings', 'access', 'winners', 'table'])

function normalizeOrganizerTab(raw: string | null | undefined) {
  const value = String(raw || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
  if (value === 'participants') return 'winners'
  return ORGANIZER_TABS.has(value) ? value : ''
}

function buildOrganizerEmbedSrc() {
  const fromQuery = normalizeOrganizerTab(new URLSearchParams(window.location.search).get('tab'))
  const fromHash = normalizeOrganizerTab(window.location.hash)
  const tab = fromQuery || fromHash
  const params = new URLSearchParams({ embed: '1' })
  if (tab) params.set('tab', tab)
  return `${ORGANIZER_PATH}?${params.toString()}`
}

/** Renders the KBM organizer inside AdminLayout via auto-height iframe. */
export function AdminKbmOrganizerPage() {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [frameHeight, setFrameHeight] = useState(900)
  const [, setSearchParams] = useSearchParams()

  // Freeze iframe src on first paint so parent ?tab= updates do not reload the frame.
  const frameSrcRef = useRef<string | null>(null)
  if (!frameSrcRef.current) {
    frameSrcRef.current = buildOrganizerEmbedSrc()
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === HEIGHT_MESSAGE) {
        const next = Number(data.height)
        if (!Number.isFinite(next) || next < 200) return
        setFrameHeight(Math.ceil(next))
        return
      }

      if (data.type === TAB_MESSAGE) {
        const tab = normalizeOrganizerTab(data.tab)
        if (!tab) return
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (tab === 'settings') next.delete('tab')
            else next.set('tab', tab)
            return next
          },
          { replace: true }
        )
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setSearchParams])

  return (
    <section className="kbm-organizer-embed" aria-label="Кабинет организатора КБМ">
      <iframe
        ref={frameRef}
        className="kbm-organizer-frame"
        title="Кабинет организатора — Красота Божьего мира"
        src={frameSrcRef.current}
        style={{ height: `${frameHeight}px` }}
      />
    </section>
  )
}
