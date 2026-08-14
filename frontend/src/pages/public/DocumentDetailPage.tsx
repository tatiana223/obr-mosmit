import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { loadDocument } from '../../api/documentsApi'

export function DocumentDetailPage() {
  const { id = '' } = useParams()
  const { data: item, isLoading, isError } = useQuery({ queryKey: ['document', id], queryFn: () => loadDocument(id), retry: false })
  if (isLoading) return <main className="article-page"><p>Загружаем документ…</p></main>
  if (isError || !item) return <main className="article-page"><Link to="/dokumenty">← Все документы</Link><h1>Документ не найден</h1></main>
  return <main className="article-page document-page">
    <Link className="article-back" to={`/dokumenty/razdel/${encodeURIComponent(item.category)}`}>← Назад в раздел</Link>
    <span className="eyebrow">{item.category}</span><h1>{item.title}</h1>
    <div className="article-text document-content" dangerouslySetInnerHTML={{ __html: item.content }} />
  </main>
}
