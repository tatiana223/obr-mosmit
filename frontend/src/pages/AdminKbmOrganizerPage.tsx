const ORGANIZER_URL = '/konkursy/krasota-bozhego-mira/organizer'

export function AdminKbmOrganizerPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Красота Божьего мира</h1>
          <p>
            Кабинет организатора: настройки формы, проверка заявок благочиний, места и дипломы.
          </p>
        </div>
        <a className="button secondary" href={ORGANIZER_URL} target="_blank" rel="noreferrer">
          Открыть в новой вкладке ↗
        </a>
      </header>

      <section className="surface kbm-organizer-frame-wrap" aria-label="Кабинет организатора КБМ">
        <iframe
          className="kbm-organizer-frame"
          title="Кабинет организатора — Красота Божьего мира"
          src={ORGANIZER_URL}
        />
      </section>
    </>
  )
}
