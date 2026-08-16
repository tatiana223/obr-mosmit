import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
type Me = {
    id: number;
    email: string;
    displayName: string;
    role: 'ADMIN' | 'USER';
};
type Competition = {
    id: number;
    title: string;
    deadline?: string;
    published: boolean;
    cover?: string;
};
type Application = {
    id: number;
    competitionTitle: string;
    participantName: string;
    schoolName: string;
    status: string;
    adminComment?: string;
};
const request = async (url: string, options?: RequestInit) => { const r = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options }); if (!r.ok)
    throw new Error(await r.text() || 'Ошибка'); return r.status === 204 ? null : r.json(); };
export function CabinetPage() {
    const [me, setMe] = useState<Me | null>(null), [mode, setMode] = useState<'login' | 'register'>('login'), [error, setError] = useState(''), [competitions, setCompetitions] = useState<Competition[]>([]), [applications, setApplications] = useState<Application[]>([]), [selected, setSelected] = useState<Competition | null>(null);
    const acceptUser = (user: Me) => { window.dispatchEvent(new Event('auth-changed')); if (user.role === 'ADMIN') {
        window.location.href = '/control-center';
        return;
    } setMe(user); };
    const load = () => Promise.all([request('/api/auth/me').then(acceptUser).catch(() => setMe(null)), request('/api/competitions').then(setCompetitions)]);
    useEffect(() => { load(); }, []);
    useEffect(() => { if (me)
        request('/api/cabinet/applications').then(setApplications); }, [me]);
    const auth = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setError(''); const data = Object.fromEntries(new FormData(e.currentTarget)); try {
        const user = await request(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) });
        acceptUser(user);
    }
    catch (x) {
        setError((x as Error).message);
    } };
    const apply = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!selected)
        return; const data = Object.fromEntries(new FormData(e.currentTarget)); try {
        await request('/api/cabinet/applications', { method: 'POST', body: JSON.stringify({ ...data, competitionId: selected.id }) });
        setSelected(null);
        setApplications(await request('/api/cabinet/applications'));
    }
    catch (x) {
        setError((x as Error).message);
    } };
    const logout = async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); setMe(null); setApplications([]); setSelected(null); window.dispatchEvent(new Event('auth-changed')); };
    if (!me)
        return <main><section className="page-hero"><span className="eyebrow">Единый вход</span><h1>{mode === 'login' ? 'Вход в личный кабинет' : 'Регистрация участника'}</h1><p>{mode === 'login' ? 'Для участников и администраторов сайта. После входа откроется кабинет в соответствии с вашей ролью.' : 'Создайте аккаунт, чтобы подавать заявки на конкурсы и отслеживать их статус.'}</p></section><section className="public-section"><form className="cabinet-form" onSubmit={auth}>{mode === 'register' && <label>Имя и фамилия<input name="displayName" required/></label>}<label>{mode === 'login' ? 'Логин или электронная почта' : 'Электронная почта'}<input name="email" type={mode === 'register' ? 'email' : 'text'} required/></label><label>Пароль<input name="password" type="password" minLength={8} required/></label>{error && <p className="form-error">{error}</p>}<button className="button primary">{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button><button type="button" className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}</button></form></section></main>;
    return <main><section className="page-hero cabinet-hero"><div><span className="eyebrow">Личный кабинет</span><h1>{me.displayName}</h1><p>{me.email} · {me.role === 'ADMIN' ? 'Администратор' : 'Участник'}</p></div><button className="button secondary" onClick={logout}>Выйти</button></section><section className="public-section cabinet-grid"><div><h2>Доступные конкурсы</h2>{competitions.map(c => <article className="cabinet-card" key={c.id}>{c.cover && <img className="competition-cover" src={c.cover} alt={`Обложка конкурса «${c.title}»`}/>}<small>{c.deadline ? 'Приём до ' + c.deadline : 'Срок не ограничен'}</small><h3>{c.title}</h3><button className="button primary" onClick={() => setSelected(c)}>Подать заявку</button></article>)}</div><div><h2>Мои заявки</h2>{applications.length === 0 ? <p>Заявок пока нет.</p> : applications.map(a => <article className="cabinet-card" key={a.id}><span className={`badge ${a.status.toLowerCase()}`}>{a.status === 'NEW' ? 'На рассмотрении' : a.status === 'ACCEPTED' ? 'Принята' : 'Отклонена'}</span><h3>{a.competitionTitle}</h3><p>{a.participantName} · {a.schoolName}</p>{a.adminComment && <small>Комментарий: {a.adminComment}</small>}</article>)}</div></section>{selected && <div className="modal-backdrop"><form className="cabinet-form modal" onSubmit={apply}><h2>{selected.title}</h2><label>ФИО участника<input name="participantName" required/></label><label>Школа<input name="schoolName" required/></label><label>Возрастная группа<input name="ageGroup"/></label><label>Комментарий<textarea name="comment" rows={4}/></label>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button secondary" onClick={() => setSelected(null)}>Отмена</button><button className="button primary">Отправить</button></div></form></div>}</main>;
}
