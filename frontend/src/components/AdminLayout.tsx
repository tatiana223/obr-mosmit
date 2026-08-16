import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
export function AdminLayout() {
    const navigate = useNavigate();
    const [allowed, setAllowed] = useState(false);
    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(response => response.ok ? response.json() : null)
            .then(user => user?.role === 'ADMIN' ? setAllowed(true) : navigate('/cabinet', { replace: true }))
            .catch(() => navigate('/cabinet', { replace: true }));
    }, [navigate]);
    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        navigate('/cabinet', { replace: true });
    };
    if (!allowed)
        return <main className="admin-access-check"><p>Проверяем доступ…</p></main>;
    return <div className="admin-site">
    <section className="admin-console-bar">
      <div className="admin-console-title"><span>Личный кабинет</span><strong>Управление сайтом</strong></div>
      <nav className="admin-console-nav" aria-label="Разделы кабинета">
        <NavLink end to="/control-center">Обзор</NavLink>
        <NavLink to="/control-center/news">Новости</NavLink>
        <NavLink to="/control-center/documents">Документы</NavLink>
        <NavLink to="/control-center/schools">Школы</NavLink>
        <NavLink to="/control-center/competitions">Конкурсы</NavLink>
        <NavLink to="/control-center/courses">Курсы</NavLink>
        <NavLink to="/control-center/users">Пользователи</NavLink>
        <NavLink to="/control-center/contacts">Контакты</NavLink>
      </nav>
      <div className="admin-console-account"><span className="admin-avatar">А</span><span><b>Администратор</b><small>Полный доступ</small></span><button type="button" onClick={logout}>Выйти <span aria-hidden="true">→</span></button></div>
    </section>
    <main className="admin-workspace"><Outlet /></main>
  </div>;
}
