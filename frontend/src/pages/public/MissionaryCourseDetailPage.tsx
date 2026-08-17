import { Link, Navigate, useParams } from 'react-router-dom'
import {
  getMissionaryCourseTopic,
  MISSIONARY_COURSES_BASE,
  type MissionaryCourseBlock,
} from '../../data/missionaryCourses'

function renderBlock(block: MissionaryCourseBlock, index: number) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? (
        <h2 key={index}>{block.text}</h2>
      ) : (
        <h3 key={index}>{block.text}</h3>
      )
    case 'paragraph':
      return <p key={index}>{block.text}</p>
    case 'list':
      return block.ordered ? (
        <ol key={index}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul key={index}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'html':
      return (
        <div
          key={index}
          className="missionary-course-html"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      )
  }
}

export function MissionaryCourseDetailPage() {
  const { slug = '' } = useParams()
  const topic = getMissionaryCourseTopic(slug)

  if (!topic) {
    return <Navigate to={MISSIONARY_COURSES_BASE} replace />
  }

  return (
    <main className="article-page news-detail-page missionary-course-detail-page">
      <Link className="article-back" to={MISSIONARY_COURSES_BASE}>
        ← К миссионерско-катехизаторским курсам
      </Link>
      <span className="eyebrow">Миссионерско-катехизаторские курсы</span>
      <h1>{topic.title}</h1>
      <p className="lead">{topic.description}</p>
      {topic.cover ? (
        <div className="news-cover" aria-hidden={false}>
          <img src={topic.cover} alt={`Обложка «${topic.title}»`} />
        </div>
      ) : null}
      <div className="article-text">{topic.body.map(renderBlock)}</div>
    </main>
  )
}
