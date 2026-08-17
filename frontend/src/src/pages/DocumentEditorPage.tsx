import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RichTextEditor } from '../components/RichTextEditor'

type Section = { id: number; title: string; slug: string; parentId?: number; sortOrder: number }
type Doc = { id?: number; title: string; summary: string; content: string; sectionId?: number; sortOrder: number; published: boolean; attachments: string }

const json = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) throw new Error(await response.text() || 'Ошибка')
  return response.status === 204 ? null : response.json()
}

export function DocumentEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sections, setSections] = useState<Section[]>([])
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [published, setPublished] = useState(false)
  const [attachments, setAttachments] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    Promise.all([
      json('/api/admin/document-sections'),
      id ? json('/api/admin/documents') : Promise.resolve([]),
    ]).then(([sectionList, documentList]) => {
      setSections(sectionList)
      if (id) {
        const document = (documentList as Doc[]).find(item => String(item.id) === String(id))
        if (!document) throw new Error('Документ не найден')
        setTitle(document.title || '')
        setSummary(document.summary || '')
        setContent(document.content || '')
        setSectionId(document.sectionId ? String(document.sectionId) : '')
        setSortOrder(document.sortOrder || 0)
        setPublished(Boolean(document.published))
        setAttachments(document.attachments || '')
      }
    }).catch(error => setError(error.message)).finally(() => setLoading(false))
  }, [id])

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const saved = await json('/api/admin/documents', {
        method: 'POST',
        body: JSON.stringify({
          id: id ? Number(id) : undefined,
          title,
          summary,
          content,
          sectionId: sectionId ? Number(sectionId) : null,
          sortOrder,
          published,
          attachments,
        }),
      })

      if (files.length) {
        const form = new FormData()
        files.forEach(file => form.append('files', file))
        const response = await fetch(`/api/admin/documents/${saved.id}/files`, { method: 'POST', credentials: 'include', body: form })
        if (!response.ok) throw new Error(await response.text() || 'Документ сохранён, но файлы загрузить не удалось')
      }

      navigate('/control-center/documents')
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Загрузка документа…</p>

  return <>
    <header className="page-header document-page-header">
      <div>
        <Link className="back" to="/control-center/documents">← Вернуться к документам</Link>
        <h1>{id ? 'Редактирование документа' : 'Новый документ'}</h1>
        <p>{id ? 'Измените содержание, размещение и файлы документа.' : 'Создайте документ и добавьте его в нужный раздел.'}</p>
      </div>
      {id && <Link className="button secondary" to={`/dokumenty/${id}`}>Открыть документ ↗</Link>}
    </header>

    {error && <p className="form-error">{error}</p>}

    <div className="editor-grid document-editor-page-grid">
      <section className="surface editor-content document-editor-page-main">
        <label>
          <span>Название <small>{title.length} / 300</small></span>
          <input maxLength={300} value={title} onChange={event => setTitle(event.target.value)} placeholder="Название документа" />
        </label>
        <label>
          <span>Краткое описание <small>{summary.length} / 1000</small></span>
          <textarea rows={4} maxLength={1000} value={summary} onChange={event => setSummary(event.target.value)} placeholder="Кратко опишите документ" />
        </label>
        <label className="document-content-field">
          <span>Текст документа</span>
          <RichTextEditor value={content} onChange={setContent} placeholder="Введите текст документа…" />
        </label>
      </section>

      <aside className="editor-settings document-editor-page-settings">
        <section className="surface setting-card">
          <div className="setting-title"><i>1</i><span><b>Публикация</b><small>Видимость документа</small></span></div>
          <label className="document-status-toggle"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} /><span>Опубликовать</span></label>
          <button className="button primary full" type="button" disabled={saving || !title.trim()} onClick={save}>{saving ? 'Сохраняем…' : id ? 'Сохранить изменения' : 'Создать документ'}</button>
        </section>

        <section className="surface setting-card document-placement-card">
          <div className="setting-title compact"><i>2</i><span><b>Размещение</b><small>Раздел и порядок</small></span></div>
          <div className="document-placement-compact">
            <div className="document-setting-field">
              <span className="document-setting-label">Раздел</span>
              <select value={sectionId} onChange={event => setSectionId(event.target.value)}>
                <option value="">Без раздела</option>
                {sections.map(section => <option value={section.id} key={section.id}>{section.parentId ? '— ' : ''}{section.title}</option>)}
              </select>
            </div>
            <label className="document-order-compact">
              <span className="document-setting-label">Порядок</span>
              <input aria-label="Порядок документа" type="number" min={0} value={sortOrder} onChange={event => setSortOrder(Number(event.target.value || 0))} />
            </label>
          </div>
        </section>

        <section className="surface setting-card document-files-card">
          <div className="setting-title compact"><i>3</i><span><b>Файлы</b><small>Вложения</small></span></div>
          <label className="document-file-picker compact">
            <span>{files.length ? `Выбрано файлов: ${files.length}` : '+ Выбрать файлы'}</span>
            <input type="file" multiple onChange={event => setFiles(Array.from(event.target.files || []))} />
          </label>
          {files.length > 0 && <div className="document-selected-files compact">
            {files.map((file, index) => <span key={`${file.name}-${index}`}>{file.name}</span>)}
          </div>}
          <details className="document-external-files compact">
            <summary>Внешняя ссылка на файл</summary>
            <div className="document-links-field">
              <small>Формат: название|ссылка, по одному файлу в строке.</small>
              <textarea value={attachments} onChange={event => setAttachments(event.target.value)} rows={3} placeholder={'Приложение|https://…'} />
            </div>
          </details>
        </section>
      </aside>
    </div>
  </>
}
