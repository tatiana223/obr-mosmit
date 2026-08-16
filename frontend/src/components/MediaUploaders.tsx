import { useEffect, useState } from 'react';
export function MediaGalleryUploader({ endpoint, images = [] }: {
    endpoint: string;
    images?: string[];
}) { const [items, setItems] = useState(images), [busy, setBusy] = useState(false); useEffect(() => setItems(images), [images]); const upload = async (files: FileList | null) => { if (!files?.length)
    return; setBusy(true); const data = new FormData(); Array.from(files).forEach(file => data.append('files', file)); const r = await fetch(endpoint, { method: 'POST', credentials: 'include', body: data }); if (r.ok)
    setItems(await r.json()); setBusy(false); }; return <div className="media-uploader"><div className="media-preview-grid">{items.map((src, i) => <img src={src} alt={`Фотография ${i + 1}`} key={src}/>)}</div><label className="button secondary">{busy ? 'Загрузка…' : '+ Добавить фотографии'}<input type="file" accept="image/*" multiple hidden onChange={e => upload(e.target.files)}/></label><small>Можно выбрать несколько изображений</small></div>; }
export function CoverUploader({ endpoint, image }: {
    endpoint: string;
    image?: string;
}) { const [src, setSrc] = useState(image), [busy, setBusy] = useState(false); useEffect(() => setSrc(image), [image]); const upload = async (file?: File) => { if (!file)
    return; setBusy(true); const data = new FormData(); data.append('file', file); const r = await fetch(endpoint, { method: 'POST', credentials: 'include', body: data }); if (r.ok)
    setSrc(await r.text()); setBusy(false); }; return <div className="media-uploader cover-uploader">{src && <img src={src} alt="Обложка"/>}<label className="button secondary">{busy ? 'Загрузка…' : 'Выбрать обложку'}<input type="file" accept="image/*" hidden onChange={e => upload(e.target.files?.[0])}/></label></div>; }
