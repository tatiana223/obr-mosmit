import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const sectionLinks = [
  ['Новости', '/novosti'],
  ['Документы', '/dokumenty'],
  ['Образовательные организации', '/pravoslavnye-shkoly'],
  ['Конкурсы', '/konkursy'],
  ['Курсы', '/kursy'],
  ['Контакты', '/kontakty'],
]

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
  const [open, setOpen] = useState(false)
  const sectionsRef = useRef<HTMLDetailsElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const closeMenu = () => {
    setOpen(false)
    sectionsRef.current?.removeAttribute('open')
  }

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(user => user?.role === 'ADMIN' ? setAllowed(true) : navigate('/cabinet', { replace: true }))
      .catch(() => navigate('/cabinet', { replace: true }))
  }, [navigate])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target || headerRef.current?.contains(target)) return
      closeMenu()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    navigate('/cabinet', { replace: true })
  }

  if (!allowed) return <main className="admin-access-check"><p>Проверяем доступ…</p></main>

  return <div className="official-theme">
    <div className="admin-site admin-elegant-shell">
      <header className="official-header" ref={headerRef}>
        <NavLink className="official-brand" to="/" aria-label="На главную">
          <img className="official-emblem" src="/metropolia-emblem.png" alt="Эмблема Московской митрополии" />
          <span className="official-title">
            Отдел по координации духовно-просветительской, образовательной деятельности Московской митрополии
          </span>
        </NavLink>
        <button
          className="menu-button"
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        >
          <span /><span /><span />
        </button>
        <nav className={open ? 'open' : ''}>
          <details className="sections-menu" ref={sectionsRef} open={open || undefined}>
            <summary><i aria-hidden="true"><b /><b /><b /></i>Меню</summary>
            <div className="sections-dropdown">
              {sectionLinks.map(([name, url]) => (
                <NavLink key={url} to={url} onClick={closeMenu}>{name}</NavLink>
              ))}
            </div>
          </details>
        </nav>
      </header>

      <div className="admin-elegant-toolbar">
        <nav className="admin-elegant-nav" aria-label="Разделы кабинета">
          <div>
            {navItems.map(([label, to], index) =>
              <NavLink key={to} end={index === 0} to={to}>{label}</NavLink>
            )}
          </div>
        </nav>
        <button className="admin-elegant-logout" type="button" onClick={logout}>Выйти</button>
      </div>

      <main className="admin-elegant-workspace"><Outlet /></main>
    </div>
  </div>
}
