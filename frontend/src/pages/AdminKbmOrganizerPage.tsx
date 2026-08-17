import { useEffect, useRef, useState } from 'react'

const ORGANIZER_URL = '/konkursy/krasota-bozhego-mira/organizer?embed=1'
const HEIGHT_MESSAGE = 'kbm-organizer-height'

/** Renders the KBM organizer inside AdminLayout via auto-height iframe. */
export function AdminKbmOrganizerPage() {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [frameHeight, setFrameHeight] = useState(900)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || data.type !== HEIGHT_MESSAGE) return
      const next = Number(data.height)
      if (!Number.isFinite(next) || next < 200) return
      setFrameHeight(Math.ceil(next))
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <section className="kbm-organizer-embed" aria-label="Кабинет организатора КБМ">
      <iframe
        ref={frameRef}
        className="kbm-organizer-frame"
        title="Кабинет организатора — Красота Божьего мира"
        src={ORGANIZER_URL}
        style={{ height: `${frameHeight}px` }}
      />
    </section>
  )
}
