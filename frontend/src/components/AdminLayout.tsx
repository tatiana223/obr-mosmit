import { NavLink, Outlet } from 'react-router-dom'

const Icon = ({ children }: { children: string }) => <span className="nav-icon">{children}</span>

export function AdminLayout() {
  return <div className="admin-shell">
    <aside className="sidebar">
      <NavLink className="brand" to="/control-center"><span className="brand-mark">ММ</span><span><b>Образование</b><small>Московская митрополия</small></span></NavLink>
      <nav>
        <p>Рабочее пространство</p>
        <NavLink end to="/control-center"><Icon>⌂</Icon>Обзор</NavLink>
        <NavLink to="/control-center/news"><Icon>▤</Icon>Новости</NavLink>
        <a className="disabled"><Icon>▱</Icon>Документы <em>скоро</em></a>
        <a className="disabled"><Icon>□</Icon>Календарь <em>скоро</em></a>
        <p>Система</p><a className="disabled"><Icon>⚙</Icon>Настройки</a>
      </nav>
      <div className="account"><span className="avatar">А</span><span><b>Администратор</b><small>Полный доступ</small></span><button title="Выйти">↪</button></div>
    </aside>
    <main className="workspace"><Outlet /></main>
  </div>
}
