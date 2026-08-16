import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminApplicationsPage } from './AdminApplicationsPage';
import { CoverUploader, MediaGalleryUploader } from '../components/MediaUploaders';
type Competition = {
    id?: number;
    title: string;
    deadline?: string;
    published: boolean;
    cover?: string;
    gallery?: string[];
};
const json = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (response.status === 401 || response.status === 403) {
        throw new Error('Войдите как администратор');
    }
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response.status === 204 ? null : response.json();
};
export function AdminCompetitionsPage() {
    const [items, setItems] = useState<Competition[]>([]);
    const [editing, setEditing] = useState<Competition | null>(null);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'competitions' | 'applications'>('competitions');
    const load = () => {
        json('/api/admin/competitions').then(setItems).catch(error => setError(error.message));
    };
    useEffect(() => {
        load();
    }, []);
    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        await json('/api/admin/competitions', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                id: editing?.id,
                published: data.published === 'on',
            }),
        });
        setEditing(null);
        load();
    };
    return (<>
      {error && <p className="form-error">{error}</p>}

      <header className="page-header">
        <div>
          <span className="overline">Управление</span>
          <h1>Конкурсы</h1>
          <p>Создавайте конкурсы и рассматривайте поступившие заявки участников.</p>
        </div>

        {tab === 'competitions' && (<button className="button primary" onClick={() => setEditing({ title: '', published: false })}>
            + Новый конкурс
          </button>)}
      </header>

      <div className="competition-tabs" role="tablist">
        <button className={tab === 'competitions' ? 'active' : ''} onClick={() => setTab('competitions')}>
          Конкурсы
        </button>
        <button className={tab === 'applications' ? 'active' : ''} onClick={() => setTab('applications')}>
          Заявки
        </button>
      </div>

      {tab === 'competitions' ? (<section className="surface table-wrap">
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Срок приёма заявок</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (<tr key={item.id}>
                  <td>
                    <div className="competition-admin-title">
                      {item.cover && <img src={item.cover} alt=""/>}
                      <span><b>{item.title}</b></span>
                    </div>
                  </td>
                  <td>{item.deadline || 'Не указан'}</td>
                  <td>
                    <span className={`badge ${item.published ? 'published' : ''}`}>
                      {item.published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td>
                    <button className="text-button" onClick={() => setEditing(item)}>
                      Редактировать
                    </button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </section>) : (<AdminApplicationsPage embedded/>)}

      {editing && (<div className="modal-backdrop">
          <form className="cabinet-form modal content-editor-modal" onSubmit={save}>
            <h2>{editing.id ? 'Редактировать конкурс' : 'Новый конкурс'}</h2>

            <label>
              Название
              <input name="title" defaultValue={editing.title} required/>
            </label>

            <label>
              Приём заявок до
              <input name="deadline" type="date" defaultValue={editing.deadline}/>
            </label>

            {editing.id ? (<>
                <label>
                  Обложка конкурса
                  <CoverUploader endpoint={`/api/admin/media/competitions/${editing.id}`} image={editing.cover}/>
                </label>
                <label>
                  Изображения конкурса
                  <MediaGalleryUploader endpoint={`/api/admin/media/competitions/${editing.id}/gallery`} images={editing.gallery}/>
                </label>
              </>) : (<p className="editor-hint">
                Сохраните конкурс, затем откройте его снова и добавьте обложку и изображения.
              </p>)}

            <label className="check">
              <input name="published" type="checkbox" defaultChecked={editing.published}/>
              Опубликовать
            </label>

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setEditing(null)}>
                Отмена
              </button>
              <button className="button primary">Сохранить</button>
            </div>
          </form>
        </div>)}
    </>);
}
