import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicNews } from '../../api/publicNewsApi';
import { Pagination } from '../../components/Pagination';
export function PublicNewsPage() {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 9;
    useEffect(() => { setPage(1); }, [query]);
    const { data = [], isLoading } = usePublicNews();
    const items = useMemo(() => {
        const search = query.trim().toLocaleLowerCase('ru');
        return data.filter(item => !search || `${item.title} ${item.summary}`.toLocaleLowerCase('ru').includes(search));
    }, [data, query]);
    const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
    return <main>
    <section className="page-hero"><span className="eyebrow">Архив публикаций</span><h1>Новости</h1><p>События образовательной и просветительской деятельности Московской митрополии.</p></section>
    <section className="public-section">
      <div className="news-search-panel">
        <div><span className="eyebrow">Архив публикаций</span><h2>Поиск по новостям</h2></div>
        <label className="public-search">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Введите название или тему"/>
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>}
        </label>
        <p>Найдено: <b>{items.length}</b></p>
      </div>
      {isLoading && <p>Загружаем новости…</p>}
      <div className="archive-grid">{pageItems.map(item => <article key={item.id}>
        <Link className="news-image" to={`/novosti/${item.id}`}><img src={item.image} alt=""/></Link>
        <span>{item.date}</span><h2><Link to={`/novosti/${item.id}`}>{item.title}</Link></h2><p>{item.summary}</p>
      </article>)}</div><Pagination page={page} totalItems={items.length} pageSize={pageSize} onPageChange={setPage} label="Новости"/>
    </section>
  </main>;
}
