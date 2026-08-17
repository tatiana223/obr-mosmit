import { Link } from 'react-router-dom'

export function AdminCompetitionsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <span className="overline">Организационный отдел</span>
          <h1>Конкурсы</h1>
          <p>Кабинеты организаторов конкурсов.</p>
        </div>
      </header>

      <section className="surface kbm-admin-contest-card" aria-label="Красота Божьего мира">
        <div>
          <span className="overline">Подраздел</span>
          <h2>Красота Божьего мира</h2>
          <p>
            Форма заявок благочиний, проверка участников, места и формирование дипломов.
          </p>
        </div>
        <Link className="button primary" to="/control-center/competitions/krasota-bozhego-mira">
          Открыть кабинет организатора
        </Link>
      </section>
    </>
  )
}
