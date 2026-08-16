import { Link } from 'react-router-dom'

const sections = [
  { title: 'Новости', note: 'Публикации и события', link: '/control-center/news', mark: 'Н' },
  { title: 'Документы', note: 'Разделы и файлы', link: '/control-center/documents', mark: 'Д' },
  { title: 'Школы', note: 'Карточки учреждений', link: '/control-center/schools', mark: 'Ш' },
  { title: 'Конкурсы', note: 'Конкурсы и заявки', link: '/control-center/competitions', mark: 'К' },
  { title: 'Курсы', note: 'Учебные программы', link: '/control-center/courses', mark: 'У' },
  { title: 'Контакты', note: 'Контактная информация', link: '/control-center/contacts', mark: 'С' },
]

export function DashboardPage() {
  return <>
    <section className="admin-dashboard-hero">
      <div>
        <span className="admin-dashboard-eyebrow">Панель управления</span>
        <h1>Управление содержанием сайта</h1>
        <p>Выберите раздел, который хотите изменить.</p>
      </div>
      <div className="admin-dashboard-ornament" aria-hidden="true"><i /><b>✦</b><i /></div>
    </section>

    <section className="admin-dashboard-grid" aria-label="Разделы управления">
      {sections.map(section =>
        <Link key={section.link} to={section.link}>
          <span className="admin-card-mark" aria-hidden="true">{section.mark}</span>
          <span className="admin-card-copy">
            <strong>{section.title}</strong>
            <small>{section.note}</small>
          </span>
          <b className="admin-card-arrow" aria-hidden="true">→</b>
        </Link>
      )}
    </section>
  </>
}
