import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePublicNews } from '../../api/publicNewsApi'

export function PublicNewsPage() {
  const [query, setQuery] = useState('')
  const { data = [], isLoading } = usePublicNews()
  const items = useMemo(() => data.filter(item => item.title.toLowerCase().includes(query.toLowerCase())), [data, query])

  return <main>
    <section className="page-hero"><span className="eyebrow">Архив публикаций</span><h1>Новости</h1><p>События образовательной и просветительской деятельности Московской митрополии.</p></section>
    <section className="public-section">
      <label className="public-search">⌕<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по новостям" /></label>
      {isLoading && <p>Загружаем новости…</p>}
      <div className="archive-grid">{items.map(item => <article key={item.id}>
        <Link className="news-image" to={`/novosti/${item.id}`}><img src={item.image} alt="" /></Link>
        <span>{item.date}</span><h2><Link to={`/novosti/${item.id}`}>{item.title}</Link></h2><p>{item.summary}</p>
      </article>)}</div>
    </section>
  </main>
}
