import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadNewsItem } from '../../api/publicNewsApi';
function prepareContent(html: string, cover?: string) {
    const hasMarkup = /<\/?[a-z][\s\S]*>/i.test(html);
    if (!hasMarkup) {
        const document = new DOMParser().parseFromString('', 'text/html');
        html.split(/\n\s*\n|\n/).map(part => part.trim()).filter(Boolean).forEach(part => {
            const paragraph = document.createElement('p');
            paragraph.textContent = part;
            document.body.appendChild(paragraph);
        });
        return { html: document.body.innerHTML, images: [] as {
                src: string;
                alt: string;
            }[] };
    }
    const document = new DOMParser().parseFromString(html, 'text/html');
    const images: {
        src: string;
        alt: string;
    }[] = [];
    const seen = new Set<string>(cover ? [cover] : []);
    const addImage = (src: string, alt = '') => {
        if (src && !seen.has(src)) {
            seen.add(src);
            images.push({ src, alt });
        }
    };
    document.body.querySelectorAll('img').forEach(image => {
        addImage(image.getAttribute('src') ?? '', image.getAttribute('alt') ?? '');
        const parent = image.parentElement;
        image.remove();
        if (parent && !parent.textContent?.trim() && !parent.querySelector('img,video,iframe'))
            parent.remove();
    });
    document.body.querySelectorAll('*').forEach(element => {
        element.removeAttribute('style');
        element.removeAttribute('class');
        element.removeAttribute('width');
        element.removeAttribute('height');
    });
    return { html: document.body.innerHTML, images };
}
export function PublicNewsDetailPage() {
    const { id = '' } = useParams();
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const { data: item, isLoading, isError } = useQuery({ queryKey: ['public-news', id], queryFn: () => loadNewsItem(id), retry: false });
    useEffect(() => {
        if (viewerIndex === null)
            return;
        const close = (event: KeyboardEvent) => { if (event.key === 'Escape')
            setViewerIndex(null); };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', close);
        return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', close); };
    }, [viewerIndex]);
    if (isLoading)
        return <main className="article-page"><p>Загружаем новость…</p></main>;
    if (isError || !item)
        return <main className="article-page"><Link className="article-back" to="/novosti">← Все новости</Link><h1>Новость не найдена</h1></main>;
    const prepared = prepareContent(item.content ?? '', item.image);
    const galleryImages = [...prepared.images, ...(item.gallery ?? []).map(src => ({ src, alt: item.title }))];
    const allImages = [...(item.image ? [{ src: item.image, alt: item.title }] : []), ...galleryImages];
    const hideBrokenImage = (event: React.SyntheticEvent<HTMLElement>) => {
        if (event.target instanceof HTMLImageElement) {
            const galleryLink = event.target.closest('.news-gallery a');
            if (galleryLink instanceof HTMLElement)
                galleryLink.style.display = 'none';
            else
                event.target.style.display = 'none';
        }
    };
    return <main className="article-page news-detail-page" onError={hideBrokenImage}>
    <Link className="article-back" to="/novosti">← Все новости</Link><span className="eyebrow">{item.date}</span><h1>{item.title}</h1>
    <p className="lead">{item.summary}</p>
    {item.image && <button className="news-cover" type="button" onClick={() => setViewerIndex(0)}><img src={item.image} alt={item.title}/></button>}
    {prepared.html ? <div className="article-text" dangerouslySetInnerHTML={{ __html: prepared.html }}/> : <div className="article-text"><p>{item.summary}</p></div>}
    {galleryImages.length > 0 && <section className="news-gallery-section"><div className="news-gallery-heading"><h2>Фотоматериалы</h2></div><div className="news-gallery">
      {galleryImages.slice(0, 4).map((image, index) => <button type="button" onClick={() => setViewerIndex(index + (item.image ? 1 : 0))} key={`${image.src}-${index}`}><img src={image.src} alt={image.alt} loading="lazy"/>{index === 3 && galleryImages.length > 4 && <span>+{galleryImages.length - 4}</span>}</button>)}
    </div></section>}
    {viewerIndex !== null && allImages[viewerIndex] && <div className="news-lightbox" role="dialog" aria-modal="true" aria-label="Просмотр фотографий" onClick={() => setViewerIndex(null)}>
      <button className="lightbox-close" type="button" aria-label="Закрыть" onClick={() => setViewerIndex(null)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      {allImages.length > 1 && <button className="lightbox-prev" type="button" aria-label="Предыдущая фотография" onClick={event => { event.stopPropagation(); setViewerIndex((viewerIndex - 1 + allImages.length) % allImages.length); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>}
      <img src={allImages[viewerIndex].src} alt={allImages[viewerIndex].alt} onClick={event => event.stopPropagation()}/>
      {allImages.length > 1 && <button className="lightbox-next" type="button" aria-label="Следующая фотография" onClick={event => { event.stopPropagation(); setViewerIndex((viewerIndex + 1) % allImages.length); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>}
      <span>{viewerIndex + 1} / {allImages.length}</span>
    </div>}
  </main>;
}
