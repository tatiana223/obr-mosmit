import { useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { demoNews } from '../data/news'
import type { NewsStatus } from '../data/news'

export function NewsEditorPage() {
  const { id } = useParams(); const item = demoNews.find(n => n.id === Number(id))
  const [title, setTitle] = useState(item?.title ?? '')
  const [summary, setSummary] = useState(item?.summary ?? '')
  const [status, setStatus] = useState<NewsStatus>(item?.status ?? 'DRAFT')
  const [image, setImage] = useState<string>()
  const pickImage = (file?: File) => file?.type.startsWith('image/') && setImage(URL.createObjectURL(file))
  const onFile = (e: ChangeEvent<HTMLInputElement>) => pickImage(e.target.files?.[0])
  const onDrop = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); pickImage(e.dataTransfer.files[0]) }
  return <><header className="page-header"><div><Link className="back" to="/admin/news">← Вернуться к новостям</Link><h1>{item ? 'Редактирование новости' : 'Новая новость'}</h1><p>Заполните материал и сохраните его как черновик или опубликуйте.</p></div>{item && <button className="button secondary">Открыть на сайте ↗</button>}</header>
    <div className="editor-grid"><section className="surface editor-content">
      <label><span>Заголовок <small>{title.length} / 300</small></span><input maxLength={300} value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Состоялась встреча руководителей православных школ" /></label>
      <label><span>Краткое описание <small>{summary.length} / 1000</small></span><textarea rows={4} maxLength={1000} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Коротко расскажите, о чём публикация" /></label>
      <label><span>Текст новости</span><div className="editor-tools"><button><b>B</b></button><button><i>I</i></button><button>Абзац</button><button>Список</button></div><textarea className="article-editor" rows={18} placeholder="Введите полный текст новости. Разделяйте абзацы пустой строкой." /></label>
    </section><aside className="editor-settings">
      <section className="surface setting-card"><div className="setting-title"><i>1</i><span><b>Публикация</b><small>Кто увидит материал</small></span></div><label>Статус<select value={status} onChange={e => setStatus(e.target.value as NewsStatus)}><option value="DRAFT">Черновик</option><option value="PUBLISHED">Опубликовано</option></select></label><button className="button primary full" type="button">Сохранить изменения</button></section>
      <section className="surface setting-card"><div className="setting-title"><i>2</i><span><b>Обложка</b><small>Главное изображение</small></span></div><label className="dropzone" onDragOver={e => e.preventDefault()} onDrop={onDrop}>{image ? <img src={image} alt="Предпросмотр" /> : <><span>↑</span><b>Перетащите изображение</b><small>или нажмите для выбора</small></>}<input type="file" accept="image/*" onChange={onFile}/></label><p className="hint">JPG, PNG или WebP · до 10 МБ</p></section>
      <section className="surface setting-card"><div className="setting-title"><i>3</i><span><b>Адрес страницы</b><small>Для поисковых систем</small></span></div><div className="slug"><span>/novosti/</span><input placeholder="автоматически" /></div></section>
    </aside></div>
  </>
}
