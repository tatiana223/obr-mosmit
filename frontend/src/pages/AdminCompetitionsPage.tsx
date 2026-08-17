export function AdminCompetitionsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Конкурсы</h1>
        </div>
      </header>

      <section className="surface kbm-admin-contest-card" aria-label="Красота Божьего мира">
        <div>
          <h2>Красота Божьего мира</h2>
          <p>Заявки благочиний, проверка участников, места и дипломы.</p>
        </div>
        <a className="button primary" href="/konkursy/krasota-bozhego-mira/organizer">
          Кабинет организатора
        </a>
      </section>
    </>
  )
}
