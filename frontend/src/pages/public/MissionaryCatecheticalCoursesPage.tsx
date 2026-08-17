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
    cover: 'https://kpds.ru/wp-content/uploads/2025/07/i-1.webp',
  },
  {
    title: 'Информация об учебной программе',
    description:
      'Церковный образовательный стандарт и единая программа подготовки специалиста в сфере приходского просвещения.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/informacziya-ob-uchebnoj-programme/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/book.jpg',
  },
  {
    title: 'Приём на обучение',
    description: 'Документы и условия поступления на миссионерско-катехизаторские курсы.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/priyom-na-kursy/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/58976.jpg',
  },
  {
    title: 'Контакты',
    description: 'Контактные данные руководителей отделений миссионерско-катехизаторских курсов.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/kontakty/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/8b1a0caec2cbb4657bb92e5a432a07b9.png',
  },
  {
    title: 'КОЛОМЕНСКОЕ ОТДЕЛЕНИЕ',
    description:
      'Очное обучение в Коломне: общецерковная программа и программа профессиональной переподготовки.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/kolomenskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/xxxl.webp',
  },
  {
    title: 'Королёвское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Королёве.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/korolyovskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/03615_20171212_121904.jpg',
  },
  {
    title: 'Химкинское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Химках.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/himkinskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/01971_20200606_174754.jpg',
  },
  {
    title: 'Балашихинское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Балашихе.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/balashihinskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/7fd9712a09d89c5cbf0079962de2c104.jpg',
  },
  {
    title: 'Орехово-Зуевское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Орехово-Зуеве.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/orehovo-zuevskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/xxl_height.webp',
  },
  {
    title: 'Одинцовское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Одинцове.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/odinczovskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/68.jpg',
  },
  {
    title: 'Подольское отделение',
    description: 'Отделение миссионерско-катехизаторских курсов в Подольске.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/podolskoe-otdelenie/',
    cover: 'https://kpds.ru/wp-content/uploads/2024/01/05117_20181111_165744.jpg',
  },
  {
    title: 'Материалы для слушателей',
    description: 'Учебные и методические материалы для слушателей курсов.',
    href: 'https://kpds.ru/kursy/missionersko-katehizatorskie-kursy/materialy-dlya-slushatelej/',
    cover: 'https://kpds.ru/wp-content/uploads/2025/07/529521ef5c0111f08180923f0c10f08f_1.jpeg',
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
                <img src={card.cover} alt={`Обложка «${card.title}»`} />
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
