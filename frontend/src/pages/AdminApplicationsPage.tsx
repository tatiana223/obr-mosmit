import { useEffect, useMemo, useState } from 'react';
import { Pagination } from '../components/Pagination';
type Application = {
    id: number;
    competitionTitle: string;
    trackingCode: string;
    userEmail: string;
    phone?: string;
    participantName: string;
    schoolName: string;
    ageGroup?: string;
    comment?: string;
    status: string;
    adminComment?: string;
    createdAt: string;
};
const PAGE_SIZE = 12;
const json = async (url: string, options?: RequestInit) => { const r = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options }); if (!r.ok)
    throw new Error(await r.text() || 'Не удалось загрузить заявки'); return r.json(); };
export function AdminApplicationsPage({ embedded = false }: {
    embedded?: boolean;
}) { const [items, setItems] = useState<Application[]>([]), [filter, setFilter] = useState('ALL'), [page, setPage] = useState(1), [error, setError] = useState(''); const load = () => json('/api/admin/applications').then(setItems).catch(e => setError(e.message)); useEffect(() => { load(); }, []); useEffect(() => { setPage(1); }, [filter]); const visible = useMemo(() => filter === 'ALL' ? items : items.filter(x => x.status === filter), [items, filter]); const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); const review = async (id: number, status: string) => { await json(`/api/admin/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminComment: '' }) }); load(); }; return <>{!embedded && <header className="page-header"><div><span className="overline">Обращения участников</span><h1>Заявки</h1><p>Проверяйте данные участников и принимайте решение по каждой заявке.</p></div></header>}{error && <p className="form-error">{error}</p>}<div className="application-filters"><button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>Все <b>{items.length}</b></button><button className={filter === 'NEW' ? 'active' : ''} onClick={() => setFilter('NEW')}>Новые <b>{items.filter(x => x.status === 'NEW').length}</b></button><button className={filter === 'ACCEPTED' ? 'active' : ''} onClick={() => setFilter('ACCEPTED')}>Принятые</button><button className={filter === 'REJECTED' ? 'active' : ''} onClick={() => setFilter('REJECTED')}>Отклонённые</button></div><section className="surface table-wrap"><table><thead><tr><th>Конкурс и участник</th><th>Школа</th><th>Статус</th><th /></tr></thead><tbody>{pageItems.map(a => <tr key={a.id}><td><b>{a.competitionTitle}</b><small>{a.participantName} · {a.userEmail}{a.phone ? ` · ${a.phone}` : ''}{a.ageGroup ? ` · ${a.ageGroup}` : ''}<br/><small>№ {a.trackingCode}</small></small></td><td>{a.schoolName}</td><td><span className={`badge ${a.status.toLowerCase()}`}>{a.status === 'NEW' ? 'Новая' : a.status === 'ACCEPTED' ? 'Принята' : 'Отклонена'}</span></td><td className="row-actions"><button className="text-button" onClick={() => review(a.id, 'ACCEPTED')}>Принять</button><button className="text-button danger" onClick={() => review(a.id, 'REJECTED')}>Отклонить</button></td></tr>)}</tbody></table><Pagination page={page} totalItems={visible.length} pageSize={PAGE_SIZE} onPageChange={setPage} label="Заявки"/>{visible.length === 0 && <p className="empty-hint">Заявок с таким статусом нет.</p>}</section></>; }
