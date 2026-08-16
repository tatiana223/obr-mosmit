import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
type Section = {
    id: number;
    title: string;
    slug: string;
    parentId?: number;
    sortOrder: number;
};
type Doc = {
    id?: number;
    title: string;
    summary: string;
    content: string;
    sectionId?: number;
    sortOrder: number;
    published: boolean;
    attachments: string;
};
const json = async (url: string, options?: RequestInit) => { const r = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options }); if (!r.ok)
    throw new Error(await r.text() || 'Ошибка'); return r.status === 204 ? null : r.json(); };
export function AdminDocumentsPage() {
    const [docs, setDocs] = useState<Doc[]>([]), [sections, setSections] = useState<Section[]>([]), [editing, setEditing] = useState<Doc | null>(null), [sectionEdit, setSectionEdit] = useState<Partial<Section> | null>(null), [tab, setTab] = useState<'documents' | 'sections'>('documents'), [error, setError] = useState('');
    const load = () => Promise.all([json('/api/admin/documents').then(setDocs), json('/api/admin/document-sections').then(setSections)]).catch(e => setError(e.message));
    useEffect(() => { load(); }, []);
    const saveDoc = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); const saved = await json('/api/admin/documents', { method: 'POST', body: JSON.stringify({ ...d, id: editing?.id, sectionId: d.sectionId ? Number(d.sectionId) : null, sortOrder: Number(d.sortOrder || 0), published: d.published === 'on' }) }); const files = (e.currentTarget.elements.namedItem('files') as HTMLInputElement).files; if (files?.length) {
        const form = new FormData();
        Array.from(files).forEach(f => form.append('files', f));
        await fetch(`/api/admin/documents/${saved.id}/files`, { method: 'POST', credentials: 'include', body: form });
    } setEditing(null); load(); };
    const saveSection = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); await json('/api/admin/document-sections', { method: 'POST', body: JSON.stringify({ ...d, id: sectionEdit?.id, parentId: d.parentId ? Number(d.parentId) : null, sortOrder: Number(d.sortOrder || 0) }) }); setSectionEdit(null); load(); };
    const removeDoc = async (id?: number) => { if (!id || !confirm('Удалить документ?'))
        return; await json(`/api/admin/documents/${id}`, { method: 'DELETE' }); load(); };
    const removeSection = async (id: number) => { if (!confirm('Удалить раздел и его подразделы? Документы останутся без раздела.'))
        return; await json(`/api/admin/document-sections/${id}`, { method: 'DELETE' }); load(); };
    const sectionName = (id?: number) => sections.find(s => s.id === id)?.title || 'Без раздела';
    return <>{error && <p className="form-error">{error}</p>}<header className="page-header"><div><span className="overline">Управление</span><h1>Документы</h1><p>Документы, файлы, разделы и вложенные подразделы.</p></div><button className="button primary" onClick={() => tab === 'documents' ? setEditing({ title: '', summary: '', content: '', sortOrder: 0, published: false, attachments: '' }) : setSectionEdit({ title: '', sortOrder: 0 })}>+ {tab === 'documents' ? 'Новый документ' : 'Новый раздел'}</button></header><div className="competition-tabs"><button className={tab === 'documents' ? 'active' : ''} onClick={() => setTab('documents')}>Документы</button><button className={tab === 'sections' ? 'active' : ''} onClick={() => setTab('sections')}>Разделы и подразделы</button></div>{tab === 'documents' ? <section className="surface table-wrap"><table><thead><tr><th>Документ</th><th>Раздел</th><th>Статус</th><th /></tr></thead><tbody>{docs.map(d => <tr key={d.id}><td><b>{d.title}</b><small>{d.summary}</small></td><td>{sectionName(d.sectionId)}</td><td><span className={`badge ${d.published ? 'published' : ''}`}>{d.published ? 'Опубликован' : 'Черновик'}</span></td><td className="row-actions"><button className="text-button" onClick={() => setEditing(d)}>Изменить</button><button className="text-button danger" onClick={() => removeDoc(d.id)}>Удалить</button></td></tr>)}</tbody></table></section> : <section className="surface table-wrap"><table><thead><tr><th>Название</th><th>Тип</th><th>Порядок</th><th /></tr></thead><tbody>{sections.map(s => <tr key={s.id}><td><b>{s.parentId ? '↳ ' : ''}{s.title}</b></td><td>{s.parentId ? 'Подраздел' : 'Раздел'}</td><td>{s.sortOrder}</td><td className="row-actions"><button className="text-button" onClick={() => setSectionEdit(s)}>Изменить</button><button className="text-button danger" onClick={() => removeSection(s.id)}>Удалить</button></td></tr>)}</tbody></table></section>}{editing && <div className="modal-backdrop"><form className="cabinet-form modal content-editor-modal" onSubmit={saveDoc}><h2>{editing.id ? 'Изменить документ' : 'Новый документ'}</h2><label>Название<input name="title" defaultValue={editing.title} required/></label><label>Краткое описание<textarea name="summary" defaultValue={editing.summary} rows={3}/></label><label>Текст документа<textarea name="content" defaultValue={editing.content} rows={8}/></label><label>Раздел или подраздел<select name="sectionId" defaultValue={editing.sectionId || ''}><option value="">Без раздела</option>{sections.map(s => <option value={s.id} key={s.id}>{s.parentId ? '— ' : ''}{s.title}</option>)}</select></label><label>Порядок<input name="sortOrder" type="number" defaultValue={editing.sortOrder}/></label><label>Ссылки на файлы <small>Формат: название|ссылка, по одной строке</small><textarea name="attachments" defaultValue={editing.attachments} rows={4}/></label><label>Загрузить файлы<input name="files" type="file" multiple/></label><label className="check"><input name="published" type="checkbox" defaultChecked={editing.published}/> Опубликовать</label><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Отмена</button><button className="button primary">Сохранить</button></div></form></div>}{sectionEdit && <div className="modal-backdrop"><form className="cabinet-form modal" onSubmit={saveSection}><h2>{sectionEdit.id ? 'Изменить раздел' : 'Новый раздел'}</h2><label>Название<input name="title" defaultValue={sectionEdit.title} required/></label><label>Родительский раздел<select name="parentId" defaultValue={sectionEdit.parentId || ''}><option value="">Это основной раздел</option>{sections.filter(s => !s.parentId && s.id !== sectionEdit.id).map(s => <option value={s.id} key={s.id}>{s.title}</option>)}</select></label><label>Порядок<input name="sortOrder" type="number" defaultValue={sectionEdit.sortOrder || 0}/></label><div className="form-actions"><button type="button" className="button secondary" onClick={() => setSectionEdit(null)}>Отмена</button><button className="button primary">Сохранить</button></div></form></div>}</>;
}
