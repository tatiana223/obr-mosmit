import { useEffect, useState } from 'react';
import { htmlToPlainText } from '../utils/plainText';
import { CoverUploader, MediaGalleryUploader } from '../components/MediaUploaders';
type Field = {
    label: string;
    content: string;
};
type Section = {
    key: string;
    title: string;
    fields: Field[];
};
type School = {
    id: string;
    title: string;
    summary: string;
    image?: string;
    gallery?: string[];
    sections: Section[];
};
export function AdminSchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]), [edit, setEdit] = useState<School | null>(null), [error, setError] = useState('');
    const load = () => fetch('/api/schools').then(r => r.json()).then(setSchools);
    useEffect(() => { load(); }, []);
    const change = (si: number, fi: number, key: keyof Field, value: string) => setEdit(e => e && ({ ...e, sections: e.sections.map((s, i) => i === si ? { ...s, fields: s.fields.map((f, j) => j === fi ? { ...f, [key]: value } : f) } : s) }));
    const add = (si: number) => setEdit(e => e && ({ ...e, sections: e.sections.map((s, i) => i === si ? { ...s, fields: [...s.fields, { label: '', content: '' }] } : s) }));
    const openEditor = (school: School) => setEdit({ ...structuredClone(school), summary: htmlToPlainText(school.summary || ''), sections: school.sections.map(section => ({ ...section, fields: section.fields.map(field => ({ ...field, label: htmlToPlainText(field.label), content: htmlToPlainText(field.content) })) })) });
    const save = async () => { if (!edit)
        return; const r = await fetch(`/api/schools/${edit.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) }); if (!r.ok) {
        setError('Не удалось сохранить. Войдите как администратор.');
        return;
    } setEdit(null); load(); };
    return <>
  <header className="page-header"><div><span className="overline">Каталог</span><h1>Школы</h1><p>Основные сведения и структурированные разделы карточек школ.</p></div></header>
  {error && <p className="form-error">{error}</p>}
  <section className="surface table-wrap"><table><thead><tr><th>Школа</th><th>Заполнено разделов</th><th /></tr></thead><tbody>{schools.map(s => <tr key={s.id}><td><b>{s.title}</b><small>{htmlToPlainText(s.summary)}</small></td><td>{s.sections.filter(x => x.fields.length).length} из {s.sections.length}</td><td><button className="text-button" onClick={() => openEditor(s)}>Редактировать →</button></td></tr>)}</tbody></table></section>
  {edit && <div className="modal-backdrop"><div className="school-editor modal"><div className="panel-header"><h2>Карточка школы</h2><button className="text-button" onClick={() => setEdit(null)}>Закрыть</button></div><label>Название<input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })}/></label><label>Краткое описание<textarea value={edit.summary || ''} onChange={e => setEdit({ ...edit, summary: e.target.value })}/></label><section><div className="panel-header"><h3>Обложка школы</h3></div><p className="editor-hint">Главная фотография для карточки в каталоге и страницы школы.</p><CoverUploader endpoint={`/api/admin/media/schools/${edit.id}/cover`} image={edit.image}/></section>{edit.sections.map((s, si) => <section key={s.key}><div className="panel-header"><h3>{s.title}</h3><button className="text-button" onClick={() => add(si)}>+ Поле</button></div>{s.fields.length === 0 && <p className="empty-hint">Раздел пока не заполнен.</p>}{s.fields.map((f, fi) => <div className="school-field" key={fi}><input aria-label="Название поля" placeholder="Название поля" value={f.label} onChange={e => change(si, fi, 'label', e.target.value)}/><textarea className="school-plain-text" aria-label="Содержание" placeholder="Обычный текст без HTML-кода" value={f.content} onChange={e => change(si, fi, 'content', e.target.value)}/></div>)}</section>)}<section><div className="panel-header"><h3>Фотогалерея</h3></div><p className="editor-hint">Дополнительные фотографии школы.</p><MediaGalleryUploader endpoint={`/api/admin/media/schools/${edit.id}`} images={edit.gallery || []}/></section><p className="editor-hint">Старые HTML-теги и встроенные стили удаляются автоматически. Абзацы разделяйте пустой строкой.</p><div className="form-actions"><button className="button secondary" onClick={() => setEdit(null)}>Отмена</button><button className="button primary" onClick={save}>Сохранить</button></div></div></div>}
 </>;
}
