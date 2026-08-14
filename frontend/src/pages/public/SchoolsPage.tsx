import { Link } from 'react-router-dom'
import { useSchools } from '../../api/schoolsApi'

export function SchoolsPage() {
  const { data = [], isLoading, isError } = useSchools()
  return <main>
    <section className="page-hero"><span className="eyebrow">Образовательные организации</span><h1>Православные школы</h1><p>Православные гимназии и школы Московской области.</p></section>
    <section className="public-section schools-section">
      {isLoading && <p>Загружаем список школ…</p>}
      {isError && <p>Не удалось загрузить школы. Проверьте, что backend запущен.</p>}
      {!isLoading && !isError && data.length === 0 && <p>Список школ пока не импортирован.</p>}
      <div className="schools-grid">{data.map((school, index) => <article className={school.image ? 'has-image' : 'no-image'} key={school.id}>
        {school.image && <img src={school.image} alt="" />}
        <div><span>{String(index + 1).padStart(2, '0')}</span><h2>{school.title}</h2><p>{school.summary}</p>
          <Link className="school-more" to={`/pravoslavnye-shkoly/${school.id}`}>Подробнее →</Link>
        </div>
      </article>)}</div>
    </section>
  </main>
}
