import { useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { loadAdminNewsItem, saveAdminNews } from '../api/adminNewsApi';
import { htmlToPlainText } from '../utils/plainText';
import { MediaGalleryUploader } from '../components/MediaUploaders';
type NewsStatus = 'PUBLISHED' | 'DRAFT';
export function NewsEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState(''), [summary, setSummary] = useState(''), [content, setContent] = useState(''), [slug, setSlug] = useState(''), [status, setStatus] = useState<NewsStatus>('DRAFT'), [image, setImage] = useState<string>(), [gallery, setGallery] = useState<string[]>([]), [galleryFiles, setGalleryFiles] = useState<File[]>([]), [imageFile, setImageFile] = useState<File>(), [error, setError] = useState(''), [saving, setSaving] = useState(false);
    useEffect(() => { if (!id)
        return; loadAdminNewsItem(id).then(item => { setTitle(item.title); setSummary(htmlToPlainText(item.summary || '')); setContent(htmlToPlainText(item.content || '')); setSlug(item.slug || ''); setStatus(item.status); setImage(item.image); setGallery(item.gallery || []); }).catch(e => setError(e.message)); }, [id]);
    const pickImage = (file?: File) => { if (file?.type.startsWith('image/')) {
        setImageFile(file);
        setImage(URL.createObjectURL(file));
    } };
    const onFile = (e: ChangeEvent<HTMLInputElement>) => pickImage(e.target.files?.[0]);
    const onDrop = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); pickImage(e.dataTransfer.files[0]); };
    const chooseGallery = (files: FileList | null) => setGalleryFiles(files ? Array.from(files).filter(file => file.type.startsWith('image/')) : []);
    const save = async () => { setError(''); setSaving(true); const data = new FormData(); data.append('title', title); data.append('summary', summary); data.append('content', content); data.append('slug', slug); data.append('status', status); if (imageFile)
        data.append('image', imageFile); try {
        const saved = await saveAdminNews(id, data);
        if (galleryFiles.length) {
            const photos = new FormData();
            galleryFiles.forEach(file => photos.append('files', file));
            const response = await fetch(`/api/admin/media/news/${saved.id}`, { method: 'POST', credentials: 'include', body: photos });
            if (!response.ok)
                throw new Error(await response.text() || 'Новость сохранена, но фотографии загрузить не удалось');
            setGallery(await response.json());
            setGalleryFiles([]);
        }
        if (!id)
            navigate(`/control-center/news/${saved.id}`, { replace: true });
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setSaving(false);
    } };
    return <><header className="page-header"><div><Link className="back" to="/control-center/news">← Вернуться к новостям</Link><h1>{id ? 'Редактирование новости' : 'Новая новость'}</h1><p>Заполните материал и сохраните его как черновик или опубликуйте.</p></div>{id && <Link className="button secondary" to={`/novosti/${id}`}>Открыть публикацию ↗</Link>}</header>{error && <p className="form-error">{error}</p>}
    <div className="editor-grid"><section className="surface editor-content">
      <label><span>Заголовок <small>{title.length} / 300</small></span><input maxLength={300} value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Состоялась встреча руководителей православных школ"/></label>
      <label><span>Краткое описание <small>{summary.length} / 1000</small></span><textarea rows={4} maxLength={1000} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Коротко расскажите, о чём публикация"/></label>
      <label><span>Текст новости</span><textarea className="article-editor plain-text-editor" rows={18} value={content} onChange={e => setContent(e.target.value)} placeholder="Введите полный текст новости. Разделяйте абзацы пустой строкой."/><small className="editor-hint"></small></label>
    </section><aside className="editor-settings">
      <section className="surface setting-card"><div className="setting-title"><i>1</i><span><b>Публикация</b><small>Кто увидит материал</small></span></div><label>Статус<select value={status} onChange={e => setStatus(e.target.value as NewsStatus)}><option value="DRAFT">Черновик</option><option value="PUBLISHED">Опубликовано</option></select></label><button className="button primary full" type="button" disabled={saving || !title.trim() || !content.trim()} onClick={save}>{saving ? 'Сохраняем…' : 'Сохранить изменения'}</button></section>
      <section className="surface setting-card"><div className="setting-title"><i>2</i><span><b>Обложка</b><small>Главное изображение</small></span></div><label className="dropzone" onDragOver={e => e.preventDefault()} onDrop={onDrop}>{image ? <img src={image} alt="Предпросмотр"/> : <><span>↑</span><b>Перетащите изображение</b><small>или нажмите для выбора</small></>}<input type="file" accept="image/*" onChange={onFile}/></label><p className="hint">JPG, PNG или WebP · до 10 МБ</p></section>
      <section className="surface setting-card"><div className="setting-title"><i>3</i><span><b>Фотогалерея</b><small>Дополнительные фотографии</small></span></div>{id ? <MediaGalleryUploader endpoint={`/api/admin/media/news/${id}`} images={gallery}/> : <div className="media-uploader"><div className="media-preview-grid">{galleryFiles.map((file, index) => <img src={URL.createObjectURL(file)} alt={`Новая фотография ${index + 1}`} key={`${file.name}-${file.lastModified}`}/>)}</div><label className="button secondary">{galleryFiles.length ? `Выбрано фотографий: ${galleryFiles.length}` : '+ Выбрать фотографии'}<input type="file" accept="image/*" multiple hidden onChange={e => chooseGallery(e.target.files)}/></label><small>Можно выбрать несколько изображений сразу. Они загрузятся вместе с новой новостью.</small></div>}</section>
    </aside></div>
  </>;
}
