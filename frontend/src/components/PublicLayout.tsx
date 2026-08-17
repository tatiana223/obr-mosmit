import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const sectionLinks = [
  ['Новости', '/novosti'],
  ['Документы', '/dokumenty'],
  ['Образовательные организации', '/pravoslavnye-shkoly'],
  ['Конкурсы', '/konkursy'],
  ['Курсы', '/kursy'],
  ['Контакты', '/kontakty'],
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const [adminReveal, setAdminReveal] = useState(false)
  const bottomReachedAt = useRef<number | null>(null)
  const sectionsRef = useRef<HTMLDetailsElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const closeMenu = () => {
    setOpen(false)
    sectionsRef.current?.removeAttribute('open')
  }

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


  useEffect(() => {
    const updateBottomState = () => {
      if (adminReveal) return

      const root = document.documentElement
      const atBottom = window.scrollY + window.innerHeight >= root.scrollHeight - 4

      if (atBottom) {
        if (bottomReachedAt.current === null) {
          bottomReachedAt.current = performance.now()
        }
      } else {
        bottomReachedAt.current = null
      }
    }

    const onBottomWheel = (event: WheelEvent) => {
      if (adminReveal || event.deltaY <= 0) return

      const root = document.documentElement
      const atBottom = window.scrollY + window.innerHeight >= root.scrollHeight - 4
      if (!atBottom) return

      if (bottomReachedAt.current === null) {
        bottomReachedAt.current = performance.now()
        return
      }

      // The footer must first feel like the real end of the page.
      // After a short pause, the next downward wheel movement reveals admin access.
      const waitedAtBottom = performance.now() - bottomReachedAt.current >= 450
      if (!waitedAtBottom) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      setAdminReveal(true)

      requestAnimationFrame(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        })
      })
    }

    updateBottomState()
    window.addEventListener('scroll', updateBottomState, { passive: true })
    window.addEventListener('wheel', onBottomWheel, { passive: false })

    return () => {
      window.removeEventListener('scroll', updateBottomState)
      window.removeEventListener('wheel', onBottomWheel)
    }
  }, [adminReveal])

  return <div className="public-site official-theme">
    <header className="official-header" ref={headerRef}>
      <NavLink className="official-brand" to="/" aria-label="На главную">
        <img className="official-emblem" src="/metropolia-emblem.png" alt="Эмблема Московской митрополии" />
        <span className="official-title">
          Отдел по координации духовно-просветительской, образовательной деятельности Московской митрополии
        </span>
      </NavLink>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>
        <span /><span /><span />
      </button>
      <nav className={open ? 'open' : ''}>
        <details className="sections-menu" ref={sectionsRef} open={open || undefined}>
          <summary><i aria-hidden="true"><b /><b /><b /></i>Меню</summary>
          <div className="sections-dropdown">
            {sectionLinks.map(([name, url]) => <NavLink key={url} to={url} onClick={closeMenu}>{name}</NavLink>)}
          </div>
        </details>
      </nav>
    </header>
    <Outlet />
    <footer className="official-footer official-footer--links-only">
      <nav aria-label="Полезные сайты">
        <div className="footer-resource-links">
          <a href="http://www.patriarchia.ru/" target="_blank" rel="noreferrer">Русская Православная Церковь</a>
          <a href="https://mosmit.ru/" target="_blank" rel="noreferrer">Московская митрополия</a>
          <a href="http://pravobraz.ru/" target="_blank" rel="noreferrer">Православное образование</a>
          <a href="https://rpusib.ru/" target="_blank" rel="noreferrer">Проект образования</a>
        </div>
        <a className="footer-center-link" href="https://mo-kuro.ru/departments/dukhovno-prosvetitelskii-kulturnyi-tsentr-im-prosvetitelei-slavianskikh-kirilla-i-mefodiia" target="_blank" rel="noreferrer">Центр Кирилла и Мефодия</a>
      </nav>
    </footer>
    <div className={`footer-admin-strip ${adminReveal ? 'revealed' : ''}`} aria-hidden={!adminReveal}>
      <NavLink to="/cabinet">Кабинет администратора</NavLink>
    </div>
  </div>
}
