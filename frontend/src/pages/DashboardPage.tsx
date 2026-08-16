import { Link } from 'react-router-dom';
const sections = [
    { number: '01', title: 'Новости', description: 'Добавление новых публикаций, редактирование материалов и управление их статусом.', link: '/control-center/news', action: 'Управлять новостями' },
    { number: '02', title: 'Православные школы', description: 'Основная информация, контакты, руководство, документы и образовательная деятельность школ.', link: '/control-center/schools', action: 'Редактировать школы' },
    { number: '03', title: 'Конкурсы', description: 'Создание конкурсов, сроки регистрации и рассмотрение заявок участников.', link: '/control-center/competitions', action: 'Конкурсы и заявки' },
    { number: '04', title: 'Пользователи', description: 'Просмотр зарегистрированных участников, управление доступом и назначение ролей.', link: '/control-center/users', action: 'Открыть пользователей' },
    { number: '05', title: 'Курсы', description: 'Добавление курсов, описаний, обложек и фотографий.', link: '/control-center/courses', action: 'Управлять курсами' },
    { number: '06', title: 'Документы', description: 'Документы, файлы, разделы и вложенные подразделы.', link: '/control-center/documents', action: 'Управлять документами' },
    { number: '07', title: 'Контакты', description: 'Адреса, электронная почта и ответственные лица.', link: '/control-center/contacts', action: 'Изменить контакты' },
];
export function DashboardPage() {
    return <><header className="admin-page-intro"><span className="eyebrow">Содержание сайта</span><h1>Управление разделами</h1><p>Выберите раздел, в котором необходимо добавить или изменить информацию.</p></header>
    <section className="admin-section-grid" aria-label="Разделы управления">{sections.map(section => <article key={section.link}><span className="admin-section-number">{section.number}</span><div><h2>{section.title}</h2><p>{section.description}</p><Link to={section.link}>{section.action} <span aria-hidden="true">→</span></Link></div></article>)}</section>
  </>;
}
