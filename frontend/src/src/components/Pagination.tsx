type PaginationProps = {
  page: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  label?: string
}

export function Pagination({ page, totalItems, pageSize = 12, onPageChange, label = 'Страница' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalItems <= pageSize) return null

  const current = Math.min(Math.max(page, 1), totalPages)
  const candidates = [1, current - 2, current - 1, current, current + 1, current + 2, totalPages]
  const pages = [...new Set(candidates.filter(value => value >= 1 && value <= totalPages))].sort((a, b) => a - b)

  return <nav className="site-pagination" aria-label={`${label}: навигация по страницам`}>
    <button type="button" className="pagination-arrow" disabled={current === 1} onClick={() => onPageChange(current - 1)} aria-label="Предыдущая страница">←</button>
    <div className="pagination-pages">
      {pages.map((value, index) => <span className="pagination-slot" key={value}>
        {index > 0 && value - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
        <button type="button" className={value === current ? 'active' : ''} aria-current={value === current ? 'page' : undefined} onClick={() => onPageChange(value)}>{value}</button>
      </span>)}
    </div>
    <button type="button" className="pagination-arrow" disabled={current === totalPages} onClick={() => onPageChange(current + 1)} aria-label="Следующая страница">→</button>
    <span className="pagination-caption">{current} из {totalPages}</span>
  </nav>
}
