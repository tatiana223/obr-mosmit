import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicNews, type PublicNewsItem } from '../../api/publicNewsApi';
import { Pagination } from '../../components/Pagination';

type ViewMode = 'cards' | 'list';
type SortOrder = 'desc' | 'asc';

type MonthGroup = {
  key: string;
  year: number;
  month: number;
  label: string;
  items: PublicNewsItem[];
};

type YearGroup = {
  year: number;
  months: MonthGroup[];
};

const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function newsTimestamp(item: PublicNewsItem): number {
  if (item.publishedAt) {
    const parsed = Date.parse(item.publishedAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function moscowYearMonth(timestamp: number): { year: number; month: number } {
  if (!timestamp) return { year: 0, month: 0 };
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date(timestamp));
  const year = Number(parts.find(part => part.type === 'year')?.value ?? 0);
  const month = Number(parts.find(part => part.type === 'month')?.value ?? 1) - 1;
  return { year, month };
}

function groupNewsByYearMonth(items: PublicNewsItem[], order: SortOrder): YearGroup[] {
  const dir = order === 'desc' ? -1 : 1;
  const sorted = [...items].sort((a, b) => (newsTimestamp(a) - newsTimestamp(b)) * dir);

  const yearMap = new Map<number, Map<number, PublicNewsItem[]>>();
  for (const item of sorted) {
    const { year, month } = moscowYearMonth(newsTimestamp(item));
    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(item);
  }

  const years = [...yearMap.keys()].sort((a, b) => (a - b) * dir);
  return years.map(year => {
    const monthMap = yearMap.get(year)!;
    const months = [...monthMap.keys()].sort((a, b) => (a - b) * dir);
    return {
      year,
      months: months.map(month => ({
        key: `${year}-${month}`,
        year,
        month,
        label: year > 0 ? `${MONTH_NAMES_RU[month]} ${year}` : 'Без даты',
        items: monthMap.get(month)!,
      })),
    };
  });
}

export function PublicNewsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const pageSize = 9;

  useEffect(() => { setPage(1); }, [query, sortOrder, viewMode]);

  const { data = [], isLoading } = usePublicNews();

  const items = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('ru');
    const filtered = data.filter(item =>
      !search || `${item.title} ${item.summary}`.toLocaleLowerCase('ru').includes(search),
    );
    const dir = sortOrder === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => (newsTimestamp(a) - newsTimestamp(b)) * dir);
  }, [data, query, sortOrder]);

  const grouped = useMemo(
    () => (viewMode === 'list' ? groupNewsByYearMonth(items, sortOrder) : []),
    [items, sortOrder, viewMode],
  );

  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return <main>
    <section className="page-hero">
      <span className="eyebrow">Архив публикаций</span>
      <h1>Новости</h1>
      <p>События образовательной и просветительской деятельности Московской митрополии.</p>
    </section>
    <section className="public-section">
      <div className="news-search-panel">
        <div>
          <span className="eyebrow">Архив публикаций</span>
          <h2>Поиск по новостям</h2>
        </div>
        <label className="public-search">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Введите название или тему"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">×</button>
          )}
        </label>
        <p>Найдено: <b>{items.length}</b></p>
      </div>

      <div className="news-view-toolbar" role="toolbar" aria-label="Отображение новостей">
        <div className="news-view-toggle" role="group" aria-label="Вид">
          <button
            type="button"
            className={viewMode === 'cards' ? 'active' : ''}
            aria-pressed={viewMode === 'cards'}
            onClick={() => setViewMode('cards')}
          >
            Карточки
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            Список
          </button>
        </div>
        <label className="news-sort-control">
          <span>Сортировка</span>
          <select
            value={sortOrder}
            onChange={event => setSortOrder(event.target.value as SortOrder)}
            aria-label="Сортировка по дате"
          >
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </label>
      </div>

      {isLoading && <p>Загружаем новости…</p>}

      {!isLoading && viewMode === 'cards' && (
        <>
          <div className="archive-grid">
            {pageItems.map(item => (
              <article key={item.id}>
                <Link className="news-image" to={`/novosti/${item.id}`}>
                  <img src={item.image} alt=""/>
                </Link>
                <span>{item.date}</span>
                <h2><Link to={`/novosti/${item.id}`}>{item.title}</Link></h2>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
          <Pagination
            page={page}
            totalItems={items.length}
            pageSize={pageSize}
            onPageChange={setPage}
            label="Новости"
          />
        </>
      )}

      {!isLoading && viewMode === 'list' && (
        <div className="news-archive-list">
          {grouped.length === 0 && <p>Новости не найдены.</p>}
          {grouped.map(yearGroup => (
            <section className="news-year-group" key={yearGroup.year} aria-labelledby={`news-year-${yearGroup.year}`}>
              <h2 className="news-year-heading" id={`news-year-${yearGroup.year}`}>
                {yearGroup.year > 0 ? yearGroup.year : 'Без даты'}
              </h2>
              {yearGroup.months.map(monthGroup => (
                <section
                  className="news-month-group"
                  key={monthGroup.key}
                  aria-labelledby={`news-month-${monthGroup.key}`}
                >
                  <h3 className="news-month-heading" id={`news-month-${monthGroup.key}`}>
                    {monthGroup.label}
                  </h3>
                  <ul className="news-list">
                    {monthGroup.items.map(item => (
                      <li key={item.id}>
                        <Link to={`/novosti/${item.id}`}>
                          <time dateTime={item.publishedAt || undefined}>{item.date}</time>
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  </main>;
}
