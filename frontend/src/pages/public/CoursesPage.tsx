import { useEffect, useState } from 'react';
type Course = {
    id: number;
    title: string;
    description: string;
    cover?: string;
    gallery?: string[];
};
export function CoursesPage() { const [items, setItems] = useState<Course[]>([]); useEffect(() => { fetch('/api/courses').then(r => r.json()).then(setItems).catch(() => setItems([])); }, []); return <main><section className="page-hero"><span className="eyebrow">Образовательная деятельность</span><h1>Курсы</h1><p>Курсы, семинары и образовательные встречи для педагогов.</p></section><section className="public-section competitions-section"><div className="public-competitions-grid">{items.map(x => <article className="public-competition-card" key={x.id}>{x.cover ? <img src={x.cover} alt={`Обложка курса «${x.title}»`}/> : <div className="competition-placeholder"><span>Курс</span></div>}<div className="public-competition-content"><h2>{x.title}</h2><p>{x.description}</p>{x.gallery?.length ? <div className="content-gallery">{x.gallery.map(src => <img src={src} alt="" key={src}/>)}</div> : null}</div></article>)}</div>{!items.length && <p className="competitions-message">Раздел курсов наполняется.</p>}</section></main>; }
