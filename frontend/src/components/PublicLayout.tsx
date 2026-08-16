import { useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const sectionLinks = [
  ['Новости', '/novosti'],
  ['Документы', '/dokumenty'],
  ['Православные школы', '/pravoslavnye-shkoly'],
  ['Конкурсы', '/konkursy'],
  ['Курсы', '/kursy'],
  ['Контакты', '/kontakty'],
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const sectionsRef = useRef<HTMLDetailsElement>(null)

  return <div className="public-site official-theme">
    <header className="official-header">
      <NavLink className="official-brand" to="/" aria-label="На главную">
        <img className="official-emblem" src="/metropolia-emblem.svg" alt="Эмблема Московской митрополии" />
        <span className="official-title">
          Отдел по координации духовно-просветительской,<br />
          образовательной деятельности Московской митрополии
        </span>
      </NavLink>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>
        <span /><span /><span />
      </button>
      <nav className={open ? 'open' : ''}>
        <details className="sections-menu" ref={sectionsRef} open={open || undefined}>
          <summary><i aria-hidden="true"><b /><b /><b /></i>Меню</summary>
          <div className="sections-dropdown">
            {sectionLinks.map(([name, url]) => <NavLink key={url} to={url} onClick={() => { setOpen(false); sectionsRef.current?.removeAttribute('open') }}>{name}</NavLink>)}
          </div>
        </details>
      </nav>
    </header>
    <Outlet />
    <footer className="official-footer">
      <NavLink className="footer-main-link footer-admin-link" to="/cabinet">Кабинет администратора</NavLink>
      <nav aria-label="Полезные сайты">
        <a href="http://www.patriarchia.ru/" target="_blank" rel="noreferrer">Русская Православная Церковь</a>
        <a href="https://mosmit.ru/" target="_blank" rel="noreferrer">Московская митрополия</a>
        <a href="http://pravobraz.ru/" target="_blank" rel="noreferrer">Православное образование</a>
        <a href="http://xn----dtbfcopekqcbg4afn8d5exbl.xn--p1ai/index.php/uchastniki-assotsiatsii/item/19-assotsiatsiya-pedagogov-moskovskoj-oblasti-prepodavateli-dukhovno-nravstvennoj-pravoslavnoj-kultury" target="_blank" rel="noreferrer">Ассоциация «Учителя Подмосковья»</a>
      </nav>
    </footer>
  </div>
}
