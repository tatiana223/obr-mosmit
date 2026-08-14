export function ContactsPage() {
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
          <div><small>Адрес</small><h2>Московская область, г. Воскресенск ???</h2><p>?? улица, ??</p></div>
        </article>
        <article>
          <span className="contacts-icon" aria-hidden="true"><img src="/icon-mail.svg" alt="" /></span>
          <div><small>Электронная почта</small><h2><a href="mailto:???@mail.ru">???@mail.ru</a></h2><p>Для обращений и предложений о сотрудничестве</p></div>
        </article>
      </div>
    </section>
  </main>
}
