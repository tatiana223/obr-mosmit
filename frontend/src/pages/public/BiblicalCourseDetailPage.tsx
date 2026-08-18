import { Link, Navigate, useParams } from 'react-router-dom'
import {
  BIBLICAL_COURSES_BASE,
  getBiblicalCourseTopic,
} from '../../data/biblicalCourses'
import type { CourseTopicBlock } from '../../data/courseTopics'

function renderBlock(block: CourseTopicBlock, index: number) {
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

export function BiblicalCourseDetailPage() {
  const { slug = '' } = useParams()
  const topic = getBiblicalCourseTopic(slug)

  if (!topic) {
    return <Navigate to={BIBLICAL_COURSES_BASE} replace />
  }

  return (
    <main className="article-page news-detail-page missionary-course-detail-page">
      <Link className="article-back" to={BIBLICAL_COURSES_BASE}>
        ← К библейско-богословским курсам
      </Link>
      <h1>{topic.title}</h1>
      <p className="lead">{topic.description}</p>
      <div className="article-text">{topic.body.map(renderBlock)}</div>
    </main>
  )
}
