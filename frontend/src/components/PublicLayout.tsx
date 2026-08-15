import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const links = [
  ['Новости', '/novosti'],
  ['Документы', '/dokumenty'],
  ['Православные школы', '/pravoslavnye-shkoly'],
  ['Курсы', '/kursy'],
  ['Контакты', '/kontakty'],
]

export function PublicLayout() {
  const [open, setOpen] = useState(false)

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
        {links.map(([name, url]) => <NavLink key={url} to={url} onClick={() => setOpen(false)}>{name}</NavLink>)}
      </nav>
    </header>
    <Outlet />
    <footer className="official-footer">
      <a className="footer-main-link" href="https://obr-mosmit.ru/">obr-mosmit.ru</a>
      <nav aria-label="Полезные сайты">
        <a href="http://www.patriarchia.ru/" target="_blank" rel="noreferrer">Русская Православная Церковь</a>
        <a href="https://mosmit.ru/" target="_blank" rel="noreferrer">Московская митрополия</a>
        <a href="http://pravobraz.ru/" target="_blank" rel="noreferrer">Православное образование</a>
        <a href="http://xn----dtbfcopekqcbg4afn8d5exbl.xn--p1ai/index.php/uchastniki-assotsiatsii/item/19-assotsiatsiya-pedagogov-moskovskoj-oblasti-prepodavateli-dukhovno-nravstvennoj-pravoslavnoj-kultury" target="_blank" rel="noreferrer">Ассоциация «Учителя Подмосковья»</a>
      </nav>
    </footer>
  </div>
}
