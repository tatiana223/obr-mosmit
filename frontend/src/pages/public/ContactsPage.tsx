import { useEffect,useState } from 'react'
type Contacts={city:string;address:string;publicEmail:string;publicEmailNote:string;chairmanRole:string;chairmanName:string;chairmanEmail:string;assistantRole:string;assistantName:string;assistantEmail:string}
export function ContactsPage() {
  const [contacts,setContacts]=useState<Contacts>({city:'Московская область, г. Коломна',address:'Голутвинская улица, 11',publicEmail:'eorok@mail.ru',publicEmailNote:'Для обращений и предложений о сотрудничестве',chairmanRole:'Председатель отдела',chairmanName:'Протоиерей Сергий Якимов',chairmanEmail:'kolomna-obr@yandex.ru',assistantRole:'Помощник председателя отдела',assistantName:'Чтец Николай Казинов',assistantEmail:'nkazinov@mail.ru'})
  useEffect(()=>{fetch('/api/contacts').then(r=>r.json()).then(setContacts).catch(()=>{})},[])
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
          <div>
            <small>Адрес</small>
            <h2>{contacts.city}</h2>
            <p>{contacts.address}</p>
          </div>
        </article>
        <article>
          <span className="contacts-icon" aria-hidden="true"><img src="/icon-mail.svg" alt="" /></span>
          <div>
            <small>Электронная почта</small>
            <h2><a href={`mailto:${contacts.publicEmail}`}>{contacts.publicEmail}</a></h2>
            <p>{contacts.publicEmailNote}</p>
          </div>
        </article>
      </div>

      <section className="contacts-team" aria-labelledby="contacts-team-title">
        <div className="contacts-team-heading">
          <span className="eyebrow">Руководство отдела</span>
          <h2 id="contacts-team-title">Ответственные лица</h2>
        </div>
        <div className="contacts-team-list">
          <article>
            <small>{contacts.chairmanRole}</small><h3>{contacts.chairmanName}</h3><a className="contacts-team-email" href={`mailto:${contacts.chairmanEmail}`}>{contacts.chairmanEmail}</a>
          </article>
          <article>
            <small>{contacts.assistantRole}</small><h3>{contacts.assistantName}</h3><a className="contacts-team-email" href={`mailto:${contacts.assistantEmail}`}>{contacts.assistantEmail}</a>
          </article>
        </div>
      </section>
    </section>
  </main>
}
