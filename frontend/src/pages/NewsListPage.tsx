import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { demoNews } from '../data/news'

export function NewsListPage() {
  const [query, setQuery] = useState('')
  const items = useMemo(() => demoNews.filter(n => n.title.toLowerCase().includes(query.toLowerCase())), [query])
  return <><header className="page-header"><div><span className="overline">Управление содержимым</span><h1>Новости</h1><p>Создавайте публикации и управляйте архивом.</p></div><Link className="button primary" to="/admin/news/new">+ Добавить новость</Link></header>
    <div className="toolbar"><label className="search">⌕<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по заголовку" /></label><button className="button secondary">Все статусы⌄</button></div>
    <section className="surface table-wrap"><table><thead><tr><th>Публикация</th><th>Статус</th><th>Дата</th><th></th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><b>{item.title}</b><small>{item.summary}</small></td><td><span className={`badge ${item.status.toLowerCase()}`}>{item.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'}</span></td><td>{item.date}</td><td><Link to={`/admin/news/${item.id}`}>Редактировать →</Link></td></tr>)}</tbody></table></section>
  </>
}
