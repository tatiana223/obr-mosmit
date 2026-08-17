import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SchoolItem } from '../../api/schoolsApi';
import { useSchools } from '../../api/schoolsApi';
import { Pagination } from '../../components/Pagination';
function textFromHtml(html: string) {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}
function schoolLocation(school: SchoolItem) {
    const address = school.sections?.find(section => section.key === 'contacts')?.fields
        .filter(field => /адрес/i.test(field.label))
        .map(field => textFromHtml(field.content)).join(' ') ?? '';
    const patterns = [
        /(?:^|[\s,;(])[гГ]\.?\s*[оО]\.\s*([А-ЯЁ][А-Яа-яЁё-]+)/,
        /(?:^|[\s,;(])(?:[гГ]\.|[гГ]ород)\s*([А-ЯЁ][А-Яа-яЁё-]+)/,
        /(?:^|[\s,;(])(?:[сС]\.|[сС]ело|[пП]ос\.|[пП]оселок|[пП]осёлок|[пП]\.)\s*([А-ЯЁ][А-Яа-яЁё-]+)/,
    ];
    for (const source of [school.title, address]) {
        for (const pattern of patterns) {
            const match = source.match(pattern);
            if (match?.[1])
                return match[1].replace(/[.,;]$/, '').trim();
        }
    }
    return '';
}
export function SchoolsPage() {
    const { data = [], isLoading, isError } = useSchools();
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    useEffect(() => { setPage(1); }, [query, location]);
    const schools = useMemo(() => data.map(school => ({ school, location: schoolLocation(school) })), [data]);
    const locations = useMemo(() => [...new Set(schools.map(item => item.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [schools]);
    const filtered = useMemo(() => schools.filter(item => {
        const search = query.trim().toLocaleLowerCase('ru');
        return (!search || `${item.school.title} ${item.school.summary}`.toLocaleLowerCase('ru').includes(search)) && (!location || item.location === location);
    }), [schools, query, location]);
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
    return <main>
    <section className="page-hero"><span className="eyebrow">Образовательные организации</span><h1>Образовательные организации</h1><p>Православные гимназии и школы Московской области.</p></section>
    <section className="public-section schools-section">
      <div className="school-toolbar">
        <label className="school-search"><span>Поиск</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Название школы"/></label>
        <label className="school-filter"><span>Населённый пункт</span><select value={location} onChange={event => setLocation(event.target.value)}><option value="">Все</option>{locations.map(item => <option value={item} key={item}>{item}</option>)}</select></label>
        <p>Найдено: <b>{filtered.length}</b></p>
      </div>
      {isLoading && <p>Загружаем список школ…</p>}
      {isError && <p>Не удалось загрузить школы. Проверьте, что backend запущен.</p>}
      {!isLoading && !isError && data.length === 0 && <p>Список школ пока не импортирован.</p>}
      {!isLoading && !isError && data.length > 0 && filtered.length === 0 && <p className="school-no-results">По заданным условиям школы не найдены.</p>}
      <div className="schools-grid">{pageItems.map(({ school, location: place }) => <article className={school.image ? 'has-image' : 'no-image'} key={school.id}>
        {school.image && <img src={school.image} alt=""/>}
        <div><span>{place || 'Православная школа'}</span><h2>{school.title}</h2><p>{school.summary}</p>
          <Link className="school-more" to={`/pravoslavnye-shkoly/${school.id}`}>Подробнее →</Link>
        </div>
      </article>)}</div><Pagination page={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} label="Школы"/>
    </section>
  </main>;
}
