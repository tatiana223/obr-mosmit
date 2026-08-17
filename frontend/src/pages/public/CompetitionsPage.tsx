import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pagination } from '../../components/Pagination'

type Competition = {
  id: number
  title: string
  description?: string
  deadline?: string
  cover?: string
  gallery?: string[]
  externalHref?: string
  ctaLabel?: string
}

const FEATURED_COMPETITIONS: Competition[] = [
  {
    id: -1,
    title: 'Красота Божьего мира',
    description:
      'Региональный этап XXII Международного конкурса детского творчества. Заполните заявку участников по благочинию, отправьте на проверку и сформируйте дипломы.',
    externalHref: '/konkursy/krasota-bozhego-mira/',
    ctaLabel: 'Открыть форму заявки',
  },
]

export function CompetitionsPage() {
  const [items, setItems] = useState<Competition[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/competitions')
      .then(async (response) => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Не удалось загрузить конкурсы.'))
      .finally(() => setLoading(false))
  }, [])

  const allItems = [...FEATURED_COMPETITIONS, ...items]
  const pageSize = 9
  const pageItems = allItems.slice((page - 1) * pageSize, page * pageSize)
  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(`${value}T00:00:00`))
      : ''

  return (
    <main>
      <section className="page-hero competitions-hero">
        <span className="eyebrow">Участие и творчество</span>
        <h1>Конкурсы</h1>
        <p>
          Актуальные конкурсы для учащихся, педагогов и образовательных организаций Московской
          области.
        </p>
      </section>
      <section className="public-section competitions-section">
        <div className="competitions-page-actions">
          <Link className="application-status-link prominent" to="/proverit-zayavku">
            Проверить статус заявки
          </Link>
        </div>
        {loading && <p className="competitions-message">Загружаем конкурсы…</p>}
        {error && <p className="competitions-message">{error}</p>}
        {!loading && !error && !allItems.length && (
          <p className="competitions-message">
            Сейчас нет открытых конкурсов. Новые конкурсы появятся в этом разделе.
          </p>
        )}
        <div className="public-competitions-grid">
          {pageItems.map((item) => (
            <article className="public-competition-card" key={item.externalHref || item.id}>
              {item.cover ? (
                <img src={item.cover} alt={`Обложка конкурса «${item.title}»`} />
              ) : (
                <div className="competition-placeholder" aria-hidden="true">
                  <span>Конкурс</span>
                </div>
              )}
              <div className="public-competition-content">
                {item.deadline && (
                  <span className="competition-deadline">
                    Приём заявок до {formatDate(item.deadline)}
                  </span>
                )}
                <h2>{item.title}</h2>
                {item.description ? <p>{item.description}</p> : null}
                {item.externalHref ? (
                  <a className="button primary" href={item.externalHref}>
                    {item.ctaLabel || 'Подать заявку'}
                  </a>
                ) : (
                  <Link className="button primary" to={`/konkursy/${item.id}/zayavka`}>
                    Подать заявку
                  </Link>
                )}
                {item.gallery?.length ? (
                  <div className="content-gallery">
                    {item.gallery.map((src) => (
                      <img src={src} alt="" key={src} />
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <Pagination
          page={page}
          totalItems={allItems.length}
          pageSize={pageSize}
          onPageChange={setPage}
          label="Конкурсы"
        />
      </section>
    </main>
  )
}
