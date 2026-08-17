import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const navItems = [
  ['Обзор', '/control-center'],
  ['Новости', '/control-center/news'],
  ['Документы', '/control-center/documents'],
  ['Школы', '/control-center/schools'],
  ['Конкурсы', '/control-center/competitions'],
  ['Курсы', '/control-center/courses'],
  ['Контакты', '/control-center/contacts'],
]

export function AdminLayout() {
  const navigate = useNavigate()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(user => user?.role === 'ADMIN' ? setAllowed(true) : navigate('/cabinet', { replace: true }))
      .catch(() => navigate('/cabinet', { replace: true }))
  }, [navigate])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    navigate('/cabinet', { replace: true })
  }

  if (!allowed) return <main className="admin-access-check"><p>Проверяем доступ…</p></main>

  return <div className="admin-site admin-elegant-shell">
    <header className="admin-elegant-header">
      <div className="admin-elegant-header-inner">
        <NavLink className="admin-elegant-brand" to="/control-center">
          <span>
            <strong>Кабинет администратора</strong>
            <small>Управление содержимым сайта</small>
          </span>
        </NavLink>

        <div className="admin-header-actions">
          <NavLink className="admin-view-site" to="/">Перейти на сайт</NavLink>
          <button className="admin-elegant-logout" type="button" onClick={logout}>Выйти</button>
        </div>
      </div>

      <nav className="admin-elegant-nav" aria-label="Разделы кабинета">
        <div>
          {navItems.map(([label, to], index) =>
            <NavLink key={to} end={index === 0} to={to}>{label}</NavLink>
          )}
        </div>
      </nav>
    </header>

    <main className="admin-elegant-workspace"><Outlet /></main>
  </div>
}
