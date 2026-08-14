import { Link } from 'react-router-dom'
import { usePublicNews } from '../../api/publicNewsApi'

const quickLinks = [
  ['/icon-book.svg', 'Православные школы', '/pravoslavnye-shkoly'],
  ['/icon-graduation-cap.svg', 'Курсы и программы', '/kursy'],
  ['/icon-document.svg', 'Документы', '/dokumenty'],
  ['/icon-people.svg', 'Контакты', '/kontakty'],
]

export function HomePage() {
  const { data = [] } = usePublicNews()
  const news = [...data]
    .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))
    .slice(0, 3)

  return <main className="official-home">
    <section className="official-hero">
      <div className="official-hero-copy">
        <h1>Образовательная деятельность<br /><span>Московской митрополии</span></h1>
        <i />
        <p className="hero-motto">Служение через образование ???</p>
      </div>
      <div className="official-hero-image">
        <img src="/images/orthodox-classroom-hero.png" alt="Занятие в православной школе" />
      </div>
    </section>

    <section className="official-lower">
      <div className="latest-news">
        <div className="section-heading"><h2>Последние новости</h2><Link to="/novosti">Все новости&nbsp; →</Link></div>
        <div className="news-card-grid">
          {news.map(item => <Link className="official-news-card" to={`/novosti/${item.id}`} key={item.id}>
            <img src={item.image} alt="" />
            <div><time>{item.date}</time><h3>{item.title}</h3></div>
          </Link>)}
        </div>
      </div>
      <nav className="quick-links" aria-label="Основные разделы">
        {quickLinks.map(([icon, title, url]) => <Link to={url} key={url}>
          <i><img src={icon} alt="" /></i><span>{title}</span><b>›</b>
        </Link>)}
      </nav>
    </section>
  </main>
}
