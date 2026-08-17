import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type ContactPerson = {
  id?: number
  role: string
  title: string
  name: string
  email: string
  sortOrder: number
}

type Contacts = {
  id: number
  city: string
  address: string
  publicEmail: string
  publicEmailNote: string
  people: ContactPerson[]
  chairmanRole?: string
  chairmanName?: string
  chairmanEmail?: string
  assistantRole?: string
  assistantName?: string
  assistantEmail?: string
}


const normalizeContacts = (value: Partial<Contacts> | null | undefined): Contacts => {
  const legacyPeople: ContactPerson[] = []

  if (value?.chairmanName || value?.chairmanRole || value?.chairmanEmail) {
    legacyPeople.push({
      role: value.chairmanRole || 'Руководитель',
      title: '',
      name: value.chairmanName || '',
      email: value.chairmanEmail || '',
      sortOrder: 10,
    })
  }

  if (value?.assistantName || value?.assistantRole || value?.assistantEmail) {
    legacyPeople.push({
      role: value.assistantRole || 'Помощник',
      title: '',
      name: value.assistantName || '',
      email: value.assistantEmail || '',
      sortOrder: 20,
    })
  }

  return {
    id: value?.id ?? 1,
    city: value?.city ?? '',
    address: value?.address ?? '',
    publicEmail: value?.publicEmail ?? '',
    publicEmailNote: value?.publicEmailNote ?? '',
    people: Array.isArray(value?.people) ? value.people : legacyPeople,
  }
}

const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  if (!response.ok) throw new Error((await response.text()) || 'Ошибка')
  return response.status === 204 ? null : response.json()
}

export function AdminContactsPage() {
  const [data, setData] = useState<Contacts | null>(null)
  const [editing, setEditing] = useState<ContactPerson | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => request('/api/contacts').then(value => setData(normalizeContacts(value))).catch(error => setError(error.message))
  useEffect(() => { load() }, [])

  const saveContacts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const updated = await request('/api/admin/contacts', {
        method: 'PUT',
        body: JSON.stringify(values),
      })
      setData(normalizeContacts(updated))
      setMessage('Основные контакты сохранены')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить контакты')
    }
  }

  const savePerson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await request('/api/admin/contact-people', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          id: editing?.id,
          sortOrder: Number(values.sortOrder || 0),
        }),
      })
      setEditing(null)
      await load()
      setMessage('Запись руководства сохранена')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить запись')
    }
  }

  const removePerson = async (person: ContactPerson) => {
    if (!person.id || !confirm(`Удалить запись «${person.name || person.role}»?`)) return
    setError('')
    await request(`/api/admin/contact-people/${person.id}`, { method: 'DELETE' })
    if (editing?.id === person.id) setEditing(null)
    await load()
  }

  if (!data) return <p>Загрузка…</p>

  return (
    <div className="admin-contacts-page">
      <header className="page-header admin-contacts-page-header">
        <div>
          <span className="overline">Содержание сайта</span>
          <h1>Контакты</h1>
          <p>Контактные данные отдела и список ответственных лиц.</p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-notice">{message}</p>}

      <section className="surface admin-contacts-overview">
        <div className="admin-contacts-section-head">
          <div>
            <span className="admin-section-kicker">Основная информация</span>
            <h2>Контакты отдела</h2>
            <p>Эти данные отображаются в верхней части публичной страницы «Контакты».</p>
          </div>
        </div>

        <form className="admin-contacts-main-form" onSubmit={saveContacts}>
          <div className="admin-contact-main-grid">
            <label>
              <span>Город</span>
              <input name="city" defaultValue={data.city} required />
            </label>
            <label>
              <span>Адрес</span>
              <input name="address" defaultValue={data.address} required />
            </label>
            <label>
              <span>Общая электронная почта</span>
              <input name="publicEmail" type="email" defaultValue={data.publicEmail} required />
            </label>
            <label>
              <span>Пояснение к почте</span>
              <input name="publicEmailNote" defaultValue={data.publicEmailNote} />
            </label>
          </div>

          <div className="admin-contacts-save-row">
            <button className="button primary">Сохранить контакты</button>
          </div>
        </form>
      </section>

      <section className="surface admin-contact-people-list">
        <div className="admin-contacts-section-head admin-contacts-section-head--people">
          <div>
            <span className="admin-section-kicker">Руководство</span>
            <h2>Ответственные лица</h2>
            <p>Можно добавлять любое количество записей и самостоятельно задавать должность, имя, почту и порядок.</p>
          </div>
          <button
            className="button primary admin-add-contact-person"
            type="button"
            onClick={() => setEditing({
              role: '',
              title: '',
              name: '',
              email: '',
              sortOrder: (data.people.length + 1) * 10,
            })}
          >
            + Добавить
          </button>
        </div>

        {data.people.length === 0 ? (
          <div className="admin-contacts-empty">
            <strong>Руководство пока не заполнено</strong>
            <p>Добавьте первую запись — она сразу появится на публичной странице контактов.</p>
            <button
              className="button secondary"
              type="button"
              onClick={() => setEditing({ role: '', title: '', name: '', email: '', sortOrder: 10 })}
            >
              Добавить ответственное лицо
            </button>
          </div>
        ) : (
          <div className="admin-contact-people-grid">
            {data.people.map((person, index) => (
              <article className="admin-contact-person-card" key={person.id ?? `${person.name}-${index}`}>
                <div className="admin-contact-person-number">{String(index + 1).padStart(2, '0')}</div>

                <div className="admin-contact-person-copy">
                  <span className="admin-contact-person-role">{person.role || 'Должность не указана'}</span>
                  {person.title && <small>{person.title}</small>}
                  <h3>{person.name || 'Без имени'}</h3>
                  {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
                </div>

                <div className="admin-contact-person-actions">
                  <button className="text-button" type="button" onClick={() => setEditing(person)}>
                    Редактировать
                  </button>
                  <button className="text-button danger" type="button" onClick={() => removePerson(person)}>
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setEditing(null)
          }}
        >
          <form className="cabinet-form modal contact-person-editor-modal" onSubmit={savePerson}>
            <div className="document-editor-header compact">
              <div>
                <span className="overline">Руководство</span>
                <h2>{editing.id ? 'Редактировать запись' : 'Новая запись'}</h2>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setEditing(null)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <div className="contact-person-editor-grid">
              <label>
                Должность / роль
                <input
                  name="role"
                  defaultValue={editing.role}
                  placeholder="Например: Председатель отдела"
                  required
                />
              </label>
              <label>
                Сан / звание
                <input name="title" defaultValue={editing.title} placeholder="Например: Протоиерей" />
              </label>
              <label>
                ФИО
                <input name="name" defaultValue={editing.name} placeholder="Сергий Якимов" required />
              </label>
              <label>
                Электронная почта
                <input
                  name="email"
                  type="email"
                  defaultValue={editing.email}
                  placeholder="mail@example.ru"
                />
              </label>
              <label className="contact-person-sort-field">
                Порядок
                <input name="sortOrder" type="number" defaultValue={editing.sortOrder} />
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setEditing(null)}>
                Отмена
              </button>
              <button className="button primary">Сохранить</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
