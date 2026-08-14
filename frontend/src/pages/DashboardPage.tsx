import { Link } from 'react-router-dom'
import { demoNews } from '../data/news'

export function DashboardPage() {
  return <>
    <header className="page-header"><div><span className="overline">Пятница, 14 августа</span><h1>Добрый день</h1><p>Здесь собрана главная информация о сайте.</p></div><button className="button secondary">Открыть сайт ↗</button></header>
    <section className="stats">
      <article><span>Всего новостей</span><strong>137</strong><small>включая импортированные</small></article>
      <article><span>Опубликовано</span><strong>136</strong><small className="positive">↑ 3 за этот месяц</small></article>
      <article><span>Черновики</span><strong>1</strong><small>ожидает публикации</small></article>
      <article><span>Состояние сайта</span><strong className="online">● Работает</strong><small>Все системы доступны</small></article>
    </section>
    <section className="surface content-panel"><div className="panel-header"><div><span className="overline">Контент</span><h2>Последние новости</h2></div><Link className="button primary" to="/admin/news/new">+ Добавить новость</Link></div>
      <div className="recent-list">{demoNews.map(item => <Link to={`/admin/news/${item.id}`} key={item.id}><span className="date-tile">{item.date.slice(0,5)}</span><span><b>{item.title}</b><small>{item.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'}</small></span><span className="row-arrow">→</span></Link>)}</div>
    </section>
  </>
}
