import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { deduplicateDocuments, useDocuments } from '../../api/documentsApi'
import { DocumentFileLink } from '../../components/DocumentFileLink'

const categoryOrder = [
  'I. Основы Православной культуры', 'II. Воскресные школы', 'III. Катехизация и оглашение',
  'IV. Православный компонент', 'V. Конфессиональная аттестация', 'VI. Распоряжения',
  'VII. Центры подготовки приходских специалистов', 'Мониторинг',
]

export function DocumentsPage() {
  const { data = [], isLoading, isError } = useDocuments()
  const documents = useMemo(() => deduplicateDocuments(data), [data])
  const groups = useMemo(() => {
    const grouped = new Map<string, number>()
    documents.forEach(item => grouped.set(item.category || 'Документы', (grouped.get(item.category || 'Документы') ?? 0) + 1))
    return categoryOrder.map(category => [category, grouped.get(category) ?? 0] as const)
  }, [documents])
  const featured = documents.filter(item => item.category === 'Главное')

  return <main>
    <section className="page-hero"><span className="eyebrow">Официальная информация</span><h1>Документы</h1><p>Выберите раздел, чтобы открыть упорядоченный список документов.</p></section>
    <section className="public-section documents-section">
      {isLoading && <p>Загружаем разделы…</p>}
      {isError && <p>Не удалось загрузить документы. Проверьте backend.</p>}
      {!isLoading && !isError && groups.length === 0 && <p>Документы пока не импортированы.</p>}
      {featured.length > 0 && <div className="featured-documents"><h2>Главное</h2>{featured.map(item => <DocumentFileLink item={item} key={item.id}><img src="/icon-document.svg" alt="" /><span>{item.title}</span><b>{!item.attachments.length ? 'Читать →' : item.attachments[0]?.url.toLowerCase().endsWith('.pdf') ? 'Открыть PDF →' : 'Скачать →'}</b></DocumentFileLink>)}</div>}
      <div className="document-category-grid">{groups.map(([category, count], index) => <Link to={`/dokumenty/razdel/${encodeURIComponent(category)}`} key={category}>
        <span>{String(index + 1).padStart(2, '0')}</span><img src="/icon-document.svg" alt="" /><h2>{category}</h2><p>{count} документов</p><b>Открыть раздел →</b>
      </Link>)}</div>
    </section>
  </main>
}
