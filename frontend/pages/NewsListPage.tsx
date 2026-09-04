import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteAdminNews, loadAdminNews } from '../api/adminNewsApi';
import type { AdminNewsItem } from '../api/adminNewsApi';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 12;

type DateOrder = 'desc' | 'asc';

/**
 * Sort by publication date (`dd.MM.yyyy`). Drafts without publishedAt use
 * `updatedAt` so newly saved items stay near the top instead of vanishing
 * to the last page among a long archive.
 */
function newsSortKey(item: AdminNewsItem): number {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(item.date.trim());
    if (match) {
        const [, day, month, year] = match;
        return Date.UTC(Number(year), Number(month) - 1, Number(day));
    }
    const updated = Date.parse(item.updatedAt);
    return Number.isFinite(updated) ? updated : 0;
}

export function NewsListPage() {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
    const [dateOrder, setDateOrder] = useState<DateOrder>('desc');
    const [page, setPage] = useState(1);
    const [news, setNews] = useState<AdminNewsItem[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
    const refresh = () => { setLoading(true); loadAdminNews().then(setNews).catch(e => setError(e.message)).finally(() => setLoading(false)); };
    useEffect(() => { refresh(); }, []);
    useEffect(() => { setPage(1); }, [query, status, dateOrder]);
    const items = useMemo(() => {
        const filtered = news.filter(n => n.title.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')) && (status === 'ALL' || n.status === status));
        const direction = dateOrder === 'desc' ? -1 : 1;
        return [...filtered].sort((a, b) => {
            const byDate = (newsSortKey(a) - newsSortKey(b)) * direction;
            if (byDate !== 0) return byDate;
            return dateOrder === 'desc' ? b.id - a.id : a.id - b.id;
        });
    }, [news, query, status, dateOrder]);
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
    const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const remove = async (id: number) => { if (!confirm('Удалить эту новость?')) return; await deleteAdminNews(id); refresh(); };
    return <><header className="page-header"><div><span className="overline">Управление содержимым</span><h1>Новости</h1><p>Создавайте публикации и управляйте архивом.</p></div><Link className="button primary" to="/control-center/news/new">+ Добавить новость</Link></header>
    <div className="toolbar news-toolbar"><label className="search modern-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти новость по заголовку"/>{query && <button type="button" aria-label="Очистить поиск" onClick={() => setQuery('')}>×</button>}</label><label className="status-select"><span aria-hidden="true">◉</span><select value={status} onChange={e => setStatus(e.target.value as typeof status)} aria-label="Фильтр по статусу"><option value="ALL">Все статусы</option><option value="PUBLISHED">Опубликованные</option><option value="DRAFT">Черновики</option></select><i aria-hidden="true">⌄</i></label><label className="status-select"><span aria-hidden="true">⇅</span><select value={dateOrder} onChange={e => setDateOrder(e.target.value as DateOrder)} aria-label="Сортировка по дате"><option value="desc">По убыванию (сначала новые)</option><option value="asc">По возрастанию (сначала старые)</option></select><i aria-hidden="true">⌄</i></label></div>
    {error && <p className="form-error">{error}</p>}<section className="surface table-wrap">{loading ? <p>Загружаем новости…</p> : <><p className="admin-list-count">Найдено материалов: <b>{items.length}</b></p>{items.length ? <><table><thead><tr><th>Публикация</th><th>Статус</th><th>Дата</th><th></th></tr></thead><tbody>{pageItems.map(item => <tr key={item.id}><td><b>{item.title}</b><small>{item.summary}</small></td><td><span className={`badge ${item.status.toLowerCase()}`}>{item.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'}</span></td><td>{item.date}</td><td className="row-actions"><Link to={`/control-center/news/${item.id}`}>Редактировать</Link><button className="text-button danger" onClick={() => remove(item.id)}>Удалить</button></td></tr>)}</tbody></table><Pagination page={page} totalItems={items.length} pageSize={PAGE_SIZE} onPageChange={setPage} label="Новости"/></> : <p className="news-filter-empty">По выбранным условиям новостей не найдено.</p>}</>}</section>
  </>;
}
