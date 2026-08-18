import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pagination } from '../../components/Pagination'

type Course = {
  id: number
  title: string
  description: string
  cover?: string
  gallery?: string[]
}

type CourseSection = {
  id: string
  title: string
  description: string
  to: string
  ctaLabel: string
  cover?: string
}

const COURSE_SECTIONS: CourseSection[] = [
  {
    id: 'missionersko-katehizatorskie-kursy',
    title: 'Миссионерско-катехизаторские курсы',
    description:
      'Программы подготовки специалистов в сфере приходского просвещения: информация об учебной программе, приём на обучение, отделения и материалы для слушателей.',
    to: '/kursy/missionersko-katehizatorskie-kursy',
    ctaLabel: 'Открыть раздел',
    cover: '/courses/missionary/kolomna.webp',
  },
  {
    id: 'biblejsko-bogoslovskie-kursy',
    title: 'Библейско-богословские курсы',
    description:
      'Библейско-богословские курсы имени преподобного Сергия Радонежского: программа, приём на обучение, отделения и контакты.',
    to: '/kursy/biblejsko-bogoslovskie-kursy',
    ctaLabel: 'Открыть раздел',
    cover: '/courses/biblical/bbkmain.jpg',
  },
]

export function CoursesPage() {
  const [items, setItems] = useState<Course[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 9

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [])

  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  return (
    <main>
      <section className="page-hero">
        <span className="eyebrow">Образовательная деятельность</span>
        <h1>Курсы</h1>
        <p>Курсы, семинары и образовательные встречи для педагогов.</p>
      </section>
      <section className="public-section competitions-section">
        <div className="public-competitions-grid">
          {COURSE_SECTIONS.map((section) => (
            <article className="public-competition-card" key={section.id}>
              {section.cover ? (
                <img src={section.cover} alt={`Обложка «${section.title}»`} />
              ) : (
                <div className="competition-placeholder" aria-hidden="true">
                  <span>Раздел</span>
                </div>
              )}
              <div className="public-competition-content">
                <h2>{section.title}</h2>
                <p>{section.description}</p>
                <Link className="button primary" to={section.to}>
                  {section.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
          {pageItems.map((x) => (
            <article className="public-competition-card" key={x.id}>
              {x.cover ? (
                <img src={x.cover} alt={`Обложка курса «${x.title}»`} />
              ) : (
                <div className="competition-placeholder">
                  <span>Курс</span>
                </div>
              )}
              <div className="public-competition-content">
                <h2>{x.title}</h2>
                <p>{x.description}</p>
                {x.gallery?.length ? (
                  <div className="content-gallery">
                    {x.gallery.map((src) => (
                      <img src={src} alt="" key={src} />
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {items.length > 0 ? (
          <Pagination
            page={page}
            totalItems={items.length}
            pageSize={pageSize}
            onPageChange={setPage}
            label="Курсы"
          />
        ) : null}
        {!COURSE_SECTIONS.length && !items.length ? (
          <p className="competitions-message">Раздел курсов наполняется.</p>
        ) : null}
      </section>
    </main>
  )
}
