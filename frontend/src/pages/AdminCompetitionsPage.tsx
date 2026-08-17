import { Link } from 'react-router-dom'

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
        <Link className="button primary" to="/control-center/competitions/krasota-bozhego-mira">
          Кабинет организатора
        </Link>
      </section>
    </>
  )
}
