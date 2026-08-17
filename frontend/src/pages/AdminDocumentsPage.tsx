import { useEffect, useState } from 'react'
import { Pagination } from '../components/Pagination'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Section = { id: number; title: string; slug: string; parentId?: number; sortOrder: number }
type Doc = { id?: number; title: string; summary: string; content: string; sectionId?: number; sortOrder: number; published: boolean; attachments: string }

const json = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options })
  if (!response.ok) throw new Error(await response.text() || 'Ошибка')
  return response.status === 204 ? null : response.json()
}

export function AdminDocumentsPage() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sectionPage, setSectionPage] = useState(1)
  const [sectionEdit, setSectionEdit] = useState<Partial<Section> | null>(null)
  const [tab, setTab] = useState<'documents' | 'sections'>('documents')
  const [error, setError] = useState('')

  const load = () => Promise.all([
    json('/api/admin/documents').then(setDocs),
    json('/api/admin/document-sections').then(setSections),
  ]).catch(error => setError(error.message))

  useEffect(() => { load() }, [])

  const saveSection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    await json('/api/admin/document-sections', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        id: sectionEdit?.id,
        parentId: data.parentId ? Number(data.parentId) : null,
        sortOrder: Number(data.sortOrder || 0),
      }),
    })
    setSectionEdit(null)
    load()
  }

  const removeDoc = async (id?: number) => {
    if (!id || !confirm('Удалить документ?')) return
    await json(`/api/admin/documents/${id}`, { method: 'DELETE' })
    load()
  }

  const removeSection = async (id: number) => {
    if (!confirm('Удалить раздел и его подразделы? Документы останутся без раздела.')) return
    await json(`/api/admin/document-sections/${id}`, { method: 'DELETE' })
    load()
  }

  const sectionName = (id?: number) => sections.find(section => section.id === id)?.title || 'Без раздела'
  useEffect(() => { setPage(1) }, [search])
  const normalizedSearch = search.trim().toLocaleLowerCase('ru')
  const visibleDocs = normalizedSearch
    ? docs.filter(doc => [doc.title, doc.summary, sectionName(doc.sectionId)].some(value => (value || '').toLocaleLowerCase('ru').includes(normalizedSearch)))
    : docs
  const pageSize = 12
  const pageDocs = visibleDocs.slice((page - 1) * pageSize, page * pageSize)
  const pageSections = sections.slice((sectionPage - 1) * pageSize, sectionPage * pageSize)

  return <>
    {error && <p className="form-error">{error}</p>}
    <header className="page-header">
      <div>
        <span className="overline">Управление</span>
        <h1>Документы</h1>
        <p>Документы, файлы, разделы и вложенные подразделы.</p>
      </div>
      <button className="button primary" onClick={() => tab === 'documents' ? navigate('/control-center/documents/new') : setSectionEdit({ title: '', sortOrder: 0 })}>
        + {tab === 'documents' ? 'Новый документ' : 'Новый раздел'}
      </button>
    </header>

    <div className="competition-tabs">
      <button className={tab === 'documents' ? 'active' : ''} onClick={() => setTab('documents')}>Документы</button>
      <button className={tab === 'sections' ? 'active' : ''} onClick={() => setTab('sections')}>Разделы и подразделы</button>
    </div>

    {tab === 'documents' ? <>
      <div className="document-search">
        <div className="document-search-field">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти документ по названию, описанию или разделу" aria-label="Поиск документов" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск">×</button>}
        </div>
        <small>{search ? `Найдено: ${visibleDocs.length}` : `Всего документов: ${docs.length}`}</small>
      </div>
      <section className="surface table-wrap">
        <table>
          <thead><tr><th>Документ</th><th>Раздел</th><th>Статус</th><th /></tr></thead>
          <tbody>
            {pageDocs.map(doc => <tr key={doc.id}>
              <td><b>{doc.title}</b><small>{doc.summary}</small></td>
              <td>{sectionName(doc.sectionId)}</td>
              <td><span className={`badge ${doc.published ? 'published' : ''}`}>{doc.published ? 'Опубликован' : 'Черновик'}</span></td>
              <td className="row-actions">
                <button className="text-button" onClick={() => navigate(`/control-center/documents/${doc.id}`)}>Изменить</button>
                <button className="text-button danger" onClick={() => removeDoc(doc.id)}>Удалить</button>
              </td>
            </tr>)}
            {visibleDocs.length === 0 && <tr><td colSpan={4} className="empty-search-result">Документы не найдены. Попробуйте изменить запрос.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} totalItems={visibleDocs.length} pageSize={pageSize} onPageChange={setPage} label="Документы" />
      </section>
    </> : <section className="surface table-wrap">
      <table>
        <thead><tr><th>Название</th><th>Тип</th><th>Порядок</th><th /></tr></thead>
        <tbody>{pageSections.map(section => <tr key={section.id}>
          <td><b>{section.parentId ? '↳ ' : ''}{section.title}</b></td>
          <td>{section.parentId ? 'Подраздел' : 'Раздел'}</td>
          <td>{section.sortOrder}</td>
          <td className="row-actions">
            <button className="text-button" onClick={() => setSectionEdit(section)}>Изменить</button>
            <button className="text-button danger" onClick={() => removeSection(section.id)}>Удалить</button>
          </td>
        </tr>)}</tbody>
      </table>
      <Pagination page={sectionPage} totalItems={sections.length} pageSize={pageSize} onPageChange={setSectionPage} label="Разделы документов" />
    </section>}

    {sectionEdit && <div className="modal-backdrop">
      <form className="cabinet-form modal section-editor-modal" onSubmit={saveSection}>
        <div className="document-editor-header compact">
          <div><span className="overline">Структура документов</span><h2>{sectionEdit.id ? 'Изменить раздел' : 'Новый раздел'}</h2></div>
          <button type="button" className="modal-close-button" onClick={() => setSectionEdit(null)} aria-label="Закрыть форму" title="Закрыть">×</button>
        </div>
        <label>Название<input name="title" defaultValue={sectionEdit.title} required /></label>
        <label>Родительский раздел<select name="parentId" defaultValue={sectionEdit.parentId || ''}><option value="">Это основной раздел</option>{sections.filter(section => !section.parentId && section.id !== sectionEdit.id).map(section => <option value={section.id} key={section.id}>{section.title}</option>)}</select></label>
        <label>Порядок<input name="sortOrder" type="number" defaultValue={sectionEdit.sortOrder || 0} /></label>
        <div className="form-actions"><button type="button" className="button secondary" onClick={() => setSectionEdit(null)}>Отмена</button><button className="button primary">Сохранить</button></div>
      </form>
    </div>}
  </>
}
