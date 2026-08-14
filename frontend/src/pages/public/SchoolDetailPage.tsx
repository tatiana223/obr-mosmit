import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadSchool } from '../../api/schoolsApi'

function prepareSchoolContent(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  document.body.querySelectorAll('script,style,.pagination,.pager').forEach(node => node.remove())
  document.body.querySelectorAll<HTMLElement>('[style],[width],[height],[align],[cellpadding],[cellspacing],font').forEach(node => {
    ;['style','width','height','align','cellpadding','cellspacing','face','size','color'].forEach(attribute => node.removeAttribute(attribute))
  })
  document.body.querySelectorAll('p').forEach(paragraph => { if (!paragraph.textContent?.replace(/\u00a0/g, '').trim() && !paragraph.querySelector('img')) paragraph.remove() })
  const rows = [...document.body.querySelectorAll('table tr')]
  if (!rows.length) return [{ title: 'Информация о школе', body: document.body.innerHTML }]

  const sections: { title: string; body: string[] }[] = []
  let current: { title: string; body: string[] } | null = null
  rows.forEach(row => {
    const cell = row.querySelector('td,th')
    if (!cell) return
    const text = cell.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    if (!text && !cell.querySelector('img')) return
    const isHeading = !!cell.querySelector('strong,b') && text.length < 190
    if (isHeading) {
      current = { title: text, body: [] }
      sections.push(current)
    } else {
      if (!current) { current = { title: 'Сведения об организации', body: [] }; sections.push(current) }
      current.body.push(cell.innerHTML)
    }
  })
  return sections.map(section => ({ title: section.title, body: section.body.join('') }))
}

export function SchoolDetailPage() {
  const { id = '' } = useParams()
  const [activeSection, setActiveSection] = useState(0)
  const { data: school, isLoading, isError } = useQuery({ queryKey: ['school', id], queryFn: () => loadSchool(id), retry: false })

  if (isLoading) return <main className="school-page"><p>Загружаем информацию о школе…</p></main>
  if (isError || !school) return <main className="school-page"><Link className="article-back" to="/pravoslavnye-shkoly">← Все школы</Link><h1>Школа не найдена</h1></main>

  const sections = prepareSchoolContent(school.content)
  return <main className="school-detail-page">
    <section className={`school-profile ${school.image ? 'has-image' : ''}`}>
      <div className="school-profile-copy"><Link className="school-back" to="/pravoslavnye-shkoly">← Все православные школы</Link><span className="eyebrow">Образовательная организация</span><h1>{school.title}</h1><i /></div>
      {school.image ? <img src={school.image} alt={school.title} /> : <div className="school-profile-emblem"><img src="/metropolia-emblem.svg" alt="" /></div>}
    </section>
    <section className="school-detail-layout">
      <nav className="school-section-nav" aria-label="Разделы информации о школе">
        <span>Информация о школе</span>
        {sections.map((section,index)=><button className={activeSection===index?'active':''} type="button" onClick={()=>setActiveSection(index)} key={`${section.title}-${index}`}><i>{String(index+1).padStart(2,'0')}</i><b>{section.title}</b><em>›</em></button>)}
      </nav>
      {sections[activeSection] && <article className="school-active-section"><span className="eyebrow">Раздел {String(activeSection+1).padStart(2,'0')}</span><h2>{sections[activeSection].title}</h2><div dangerouslySetInnerHTML={{__html:sections[activeSection].body}}/></article>}
    </section>
  </main>
}
