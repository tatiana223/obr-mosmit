import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
type Competition = {
    id: number;
    title: string;
    deadline?: string;
    cover?: string;
    gallery?: string[];
};
export function CompetitionsPage() {
    const [items, setItems] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        fetch('/api/competitions')
            .then(async (response) => {
            if (!response.ok)
                throw new Error();
            return response.json();
        })
            .then(setItems)
            .catch(() => setError('Не удалось загрузить конкурсы.'))
            .finally(() => setLoading(false));
    }, []);
    const formatDate = (value?: string) => value
        ? new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(`${value}T00:00:00`))
        : '';
    return (<main>
      <section className="page-hero competitions-hero">
        <span className="eyebrow">Участие и творчество</span>
        <h1>Конкурсы</h1>
        <p>Актуальные конкурсы для учащихся, педагогов и образовательных организаций Московской области.</p>
      </section>

      <section className="public-section competitions-section">
        {loading && <p className="competitions-message">Загружаем конкурсы…</p>}
        {error && <p className="competitions-message">{error}</p>}
        {!loading && !error && !items.length && (<p className="competitions-message">
            Сейчас нет открытых конкурсов. Новые конкурсы появятся в этом разделе.
          </p>)}

        <div className="public-competitions-grid">
          {items.map(item => (<article className="public-competition-card" key={item.id}>
              {item.cover ? (<img src={item.cover} alt={`Обложка конкурса «${item.title}»`}/>) : (<div className="competition-placeholder" aria-hidden="true">
                  <span>Конкурс</span>
                </div>)}

              <div className="public-competition-content">
                {item.deadline && (<span className="competition-deadline">
                    Приём заявок до {formatDate(item.deadline)}
                  </span>)}
                <h2>{item.title}</h2>
                <Link className="button primary" to="/cabinet">Подать заявку</Link>

                {item.gallery?.length ? (<div className="content-gallery">
                    {item.gallery.map(src => <img src={src} alt="" key={src}/>)}
                  </div>) : null}
              </div>
            </article>))}
        </div>
      </section>
    </main>);
}
