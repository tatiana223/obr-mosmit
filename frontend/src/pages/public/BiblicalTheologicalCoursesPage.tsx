import { Link } from 'react-router-dom'
import {
  BIBLICAL_COURSES_BASE,
  biblicalCourseTopics,
} from '../../data/biblicalCourses'

export function BiblicalTheologicalCoursesPage() {
  return (
    <main>
      <section className="page-hero">
        <span className="eyebrow">Образовательная деятельность</span>
        <h1>Библейско-богословские курсы</h1>
        <p>
          Библейско-богословские курсы имени преподобного Сергия Радонежского: программа, приём на
          обучение, отделения и контакты.
        </p>
      </section>
      <section className="public-section competitions-section">
        <div className="application-page-tools">
          <Link className="article-back" to="/kursy">
            ← К курсам
          </Link>
        </div>
        <div className="public-competitions-grid">
          {biblicalCourseTopics.map((card) => (
            <article className="public-competition-card" key={card.slug}>
              {card.cover ? (
                <img src={card.cover} alt={`Обложка «${card.title}»`} loading="lazy" />
              ) : (
                <div className="competition-placeholder" aria-hidden="true">
                  <span>Курс</span>
                </div>
              )}
              <div className="public-competition-content">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <Link className="button primary" to={`${BIBLICAL_COURSES_BASE}/${card.slug}`}>
                  Подробнее
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
