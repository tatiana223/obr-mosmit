import { Link } from 'react-router-dom'

type CourseCard = {
  title: string
  description: string
  href: string
  cover?: string
}

const CARDS: CourseCard[] = [
  {
    title: 'Профессиональная переподготовка',
    description:
      'Программа «Подготовка специалиста в сфере приходского просвещения (единого профиля)» для слушателей Коломенского отделения.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/professionalnaya-perepodgotovka/',
    cover: '/courses/missionary/i-1.webp',
  },
  {
    title: 'Информация об учебной программе',
    description:
      'Церковный образовательный стандарт и единая программа подготовки специалиста в сфере приходского просвещения.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/informacziya-ob-uchebnoj-programme/',
    cover: '/courses/missionary/book.jpg',
  },
  {
    title: 'Приём на обучение',
    description: 'Документы и условия поступления на миссионерско-катехизаторские курсы.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/priyom-na-kursy/',
    cover: '/courses/missionary/58976.jpg',
  },
  {
    title: 'Контакты',
    description: 'Контактные данные руководителей отделений миссионерско-катехизаторских курсов.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/kontakty/',
    cover: '/courses/missionary/kontakty.png',
  },
  {
    title: 'КОЛОМЕНСКОЕ ОТДЕЛЕНИЕ',
    description:
      'Очное обучение в Коломне: общецерковная программа и программа профессиональной переподготовки.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/kolomenskoe-otdelenie/',
    cover: '/courses/missionary/kolomna.webp',
  },
  {
    title: 'Королёвское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Королёве.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/korolyovskoe-otdelenie/',
    cover: '/courses/missionary/korolev.jpg',
  },
  {
    title: 'Химкинское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Химках.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/himkinskoe-otdelenie/',
    cover: '/courses/missionary/himki.jpg',
  },
  {
    title: 'Балашихинское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Балашихе.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/balashihinskoe-otdelenie/',
    cover: '/courses/missionary/balashiha.jpg',
  },
  {
    title: 'Орехово-Зуевское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Орехово-Зуеве.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/orehovo-zuevskoe-otdelenie/',
    cover: '/courses/missionary/orehovo.webp',
  },
  {
    title: 'Одинцовское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Одинцове.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/odinczovskoe-otdelenie/',
    cover: '/courses/missionary/odincovo.jpg',
  },
  {
    title: 'Подольское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Подольске.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/podolskoe-otdelenie/',
    cover: '/courses/missionary/podolsk.jpg',
  },
  {
    title: 'Материалы для слушателей',
    description: 'Учебные и методические материалы для слушателей курсов.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/materialy-dlya-slushatelej/',
    cover: '/courses/missionary/materialy.jpeg',
  },
]

export function MissionaryCatecheticalCoursesPage() {
  return (
    <main>
      <section className="page-hero">
        <span className="eyebrow">Образовательная деятельность</span>
        <h1>Миссионерско-катехизаторские курсы</h1>
        <p>
          Подготовка специалистов в сфере приходского просвещения: программа, приём на обучение,
          отделения и материалы для слушателей.
        </p>
      </section>
      <section className="public-section competitions-section">
        <div className="application-page-tools">
          <Link className="article-back" to="/kursy">
            ← К курсам
          </Link>
        </div>
        <div className="public-competitions-grid">
          {CARDS.map((card) => (
            <article className="public-competition-card" key={card.href}>
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
                <a className="button primary" href={card.href} target="_blank" rel="noreferrer">
                  Открыть
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
