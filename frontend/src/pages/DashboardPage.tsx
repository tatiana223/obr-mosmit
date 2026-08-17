import { Link } from 'react-router-dom'

const sections = [
  { title: 'Новости', note: 'Публикации, события и архив новостей', link: '/control-center/news', mark: '01' },
  { title: 'Документы', note: 'Разделы, документы и вложенные файлы', link: '/control-center/documents', mark: '02' },
  { title: 'Школы', note: 'Карточки православных образовательных учреждений', link: '/control-center/schools', mark: '03' },
  { title: 'Конкурсы', note: 'Организационный отдел: конкурсы и кабинеты организаторов', link: '/control-center/competitions', mark: '04' },
  { title: 'Курсы', note: 'Образовательные программы и материалы', link: '/control-center/courses', mark: '05' },
  { title: 'Контакты', note: 'Руководство и контактные данные отдела', link: '/control-center/contacts', mark: '06' },
]

export function DashboardPage() {
  return <>


    <div className="admin-dashboard-section-title">
      <span>Разделы сайта</span>
      <i />
    </div>

    <section className="admin-dashboard-grid admin-dashboard-grid--refined" aria-label="Разделы управления">
      {sections.map(section =>
        <Link key={section.link} to={section.link}>
          <span className="admin-card-index" aria-hidden="true">{section.mark}</span>
          <span className="admin-card-copy">
            <strong>{section.title}</strong>
            <small>{section.note}</small>
          </span>
          <span className="admin-card-open">Открыть <b aria-hidden="true">→</b></span>
        </Link>
      )}
    </section>
  </>
}
