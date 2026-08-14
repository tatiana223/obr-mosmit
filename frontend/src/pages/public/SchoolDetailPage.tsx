import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadSchool } from '../../api/schoolsApi'

function hasVisibleContent(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const text = document.body.textContent?.replace(/[\s\u00a0–—:;,.!?]+/g, '') ?? ''
  return Boolean(text || document.body.querySelector('img,a[href]'))
}

export function SchoolDetailPage() {
  const { id = '' } = useParams()
  const [activeSection, setActiveSection] = useState(0)
  const { data: school, isLoading, isError } = useQuery({ queryKey: ['school', id], queryFn: () => loadSchool(id), retry: false })

  useEffect(() => setActiveSection(0), [id])

  if (isLoading) return <main className="school-page"><p>Загружаем информацию о школе…</p></main>
  if (isError || !school) return <main className="school-page"><Link className="article-back" to="/pravoslavnye-shkoly">← Все школы</Link><h1>Школа не найдена</h1></main>

  const sections = (school.sections ?? [])
    .map(section => ({ ...section, fields: section.fields.filter(field => hasVisibleContent(field.content)) }))
    .filter(section => section.fields.length)

  return <main className="school-detail-page">
    <section className={`school-profile ${school.image ? 'has-image' : ''}`}>
      <div className="school-profile-copy">
        <Link className="school-back" to="/pravoslavnye-shkoly">← Все православные школы</Link>
        <span className="eyebrow">Образовательная организация</span>
        <h1>{school.title}</h1><i />
      </div>
      {school.image ? <img src={school.image} alt={school.title} /> : <div className="school-profile-emblem"><img src="/metropolia-emblem.svg" alt="" /></div>}
    </section>

    {sections.length ? <section className="school-detail-layout">
      <nav className="school-section-nav" aria-label="Разделы информации о школе">
        <span>Информация о школе</span>
        {sections.map((section, index) => <button className={activeSection === index ? 'active' : ''} type="button" onClick={() => setActiveSection(index)} key={section.key}>
          <b>{section.title}</b><em>›</em>
        </button>)}
      </nav>
      {sections[activeSection] && <article className="school-active-section">
        <h2>{sections[activeSection].title}</h2>
        <div>{sections[activeSection].fields.map((field, index) => <section className="school-group-item" key={`${field.label}-${index}`}>
          <h3>{field.label}</h3>
          <div dangerouslySetInnerHTML={{ __html: field.content }} />
        </section>)}</div>
      </article>}
    </section> : <section className="school-empty-details">Информация о школе уточняется.</section>}
  </main>
}
