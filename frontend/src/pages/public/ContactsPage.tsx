import { useEffect, useState } from 'react'

type ContactPerson = { id: number; role: string; title: string; name: string; email: string; sortOrder: number }
type Contacts = { city: string; address: string; publicEmail: string; publicEmailNote: string; people: ContactPerson[]; chairmanRole?: string; chairmanName?: string; chairmanEmail?: string; assistantRole?: string; assistantName?: string; assistantEmail?: string }

const fallback: Contacts = {
  city: 'Московская область, г. Коломна',
  address: 'Голутвинская улица, 11',
  publicEmail: 'eorok@mail.ru',
  publicEmailNote: 'Для обращений и предложений о сотрудничестве',
  people: [],
}

const normalizeContacts = (value: Partial<Contacts> | null | undefined): Contacts => {
  const people = Array.isArray(value?.people) ? value.people : [
    ...(value?.chairmanName || value?.chairmanRole || value?.chairmanEmail ? [{
      id: -1,
      role: value.chairmanRole || 'Руководитель',
      title: '',
      name: value.chairmanName || '',
      email: value.chairmanEmail || '',
      sortOrder: 10,
    }] : []),
    ...(value?.assistantName || value?.assistantRole || value?.assistantEmail ? [{
      id: -2,
      role: value.assistantRole || 'Помощник',
      title: '',
      name: value.assistantName || '',
      email: value.assistantEmail || '',
      sortOrder: 20,
    }] : []),
  ]

  return {
    city: value?.city ?? fallback.city,
    address: value?.address ?? fallback.address,
    publicEmail: value?.publicEmail ?? fallback.publicEmail,
    publicEmailNote: value?.publicEmailNote ?? fallback.publicEmailNote,
    people,
  }
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contacts>(fallback)
  useEffect(() => { fetch('/api/contacts').then(r => r.json()).then(value => setContacts(normalizeContacts(value))).catch(() => {}) }, [])

  return <main>
    <section className="page-hero contacts-hero">
      <span className="eyebrow">Связаться с нами</span>
      <h1>Контакты</h1>
      <p>Контактная информация отдела образовательной деятельности Московской митрополии.</p>
    </section>

    <section className="public-section contacts-page">
      <div className="contacts-card">
        <article>
          <span className="contacts-icon" aria-hidden="true"><img src="/icon-location.svg" alt="" /></span>
          <div><small>Адрес</small><h2>{contacts.city}</h2><p>{contacts.address}</p></div>
        </article>
        <article>
          <span className="contacts-icon" aria-hidden="true"><img src="/icon-mail.svg" alt="" /></span>
          <div><small>Электронная почта</small><h2><a href={`mailto:${contacts.publicEmail}`}>{contacts.publicEmail}</a></h2><p>{contacts.publicEmailNote}</p></div>
        </article>
      </div>

      {contacts.people.length > 0 && <section className="contacts-team" aria-labelledby="contacts-team-title">
        <div className="contacts-team-heading">
          <span className="eyebrow">Руководство отдела</span>
          <h2 id="contacts-team-title">Ответственные лица</h2>
        </div>
        <div className="contacts-team-list contacts-team-list-dynamic">
          {contacts.people.map(person => <article key={person.id}>
            <small>{person.role}</small>
            {person.title && <span className="contacts-clergy-title">{person.title}</span>}
            <h3>{person.name}</h3>
            {person.email && <a className="contacts-team-email" href={`mailto:${person.email}`}>{person.email}</a>}
          </article>)}
        </div>
      </section>}
    </section>
  </main>
}
