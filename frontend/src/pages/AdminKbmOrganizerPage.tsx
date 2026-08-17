import { useEffect } from 'react'

const ORGANIZER_URL = '/konkursy/krasota-bozhego-mira/organizer'

/** Opens the organizer as a normal site page (not an iframe). */
export function AdminKbmOrganizerPage() {
  useEffect(() => {
    window.location.replace(ORGANIZER_URL)
  }, [])

  return (
    <main className="admin-access-check">
      <p>Открываем кабинет организатора…</p>
    </main>
  )
}
