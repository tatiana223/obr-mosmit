type PageType = 'schools' | 'courses' | 'documents' | 'contacts';
const content: Record<PageType, {
    label: string;
    title: string;
    intro: string;
    items: string[];
}> = {
    schools: { label: 'Образовательные организации', title: 'Образовательные организации', intro: 'Православные гимназии и школы Московской области, реализующие образовательные программы и православный компонент.', items: ['Гимназия «Ковчег»', 'Православная классическая гимназия святителя Филарета', 'Православная гимназия имени преподобного Сергия Радонежского'] },
    courses: { label: 'Образовательные программы', title: 'Курсы', intro: 'Программы повышения квалификации, семинары и образовательные встречи для педагогов.', items: ['Курсы повышения квалификации', 'Обучающие семинары', 'Регистрация на программы'] },
    documents: { label: 'Официальная информация', title: 'Документы', intro: 'Положения, соглашения, распоряжения и нормативно-методические документы.', items: ['Положение об отделе', 'Соглашения о сотрудничестве', 'Методические рекомендации'] },
    contacts: { label: 'Связаться с нами', title: 'Контакты', intro: 'Мы открыты к сотрудничеству с педагогами, образовательными организациями и епархиями.', items: ['г. Коломна, Голутвинская улица, 11', 'eorok@mail.ru', 'Московская область'] },
};
export function ContentPage({ type }: {
    type: PageType;
}) { if (type === 'courses')
    return <main />; const page = content[type]; return <main><section className="page-hero"><span className="eyebrow">{page.label}</span><h1>{page.title}</h1><p>{page.intro}</p></section><section className="public-section content-layout"><aside><span>В этом разделе</span>{page.items.map((x, i) => <a href={`#item-${i}`} key={x}>{x}</a>)}</aside><div className="content-list">{page.items.map((x, i) => <article id={`item-${i}`} key={x}><span>0{i + 1}</span><div><h2>{x}</h2><p>{type === 'contacts' ? 'Информация для связи и обращений в отдел.' : 'Раздел наполняется. Здесь будут размещены подробная информация, документы и связанные материалы.'}</p><a href="#">Подробнее →</a></div></article>)}</div></section></main>; }
