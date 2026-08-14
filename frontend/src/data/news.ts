export type NewsStatus = 'PUBLISHED' | 'DRAFT'
export type NewsItem = { id: number; title: string; summary: string; date: string; status: NewsStatus }

export const demoNews: NewsItem[] = [
  { id: 1, title: 'Заседание Координационного совета по взаимодействию с Министерством образования', summary: 'Итоги заседания и ключевые направления совместной работы.', date: '25.06.2026', status: 'PUBLISHED' },
  { id: 2, title: 'Совещание руководителей православных школ и гимназий Московской области', summary: 'Встреча представителей образовательных организаций региона.', date: '02.04.2026', status: 'PUBLISHED' },
  { id: 3, title: 'Материалы для августовского педагогического совета', summary: 'Подборка методических материалов для обсуждения.', date: 'Сегодня, 12:40', status: 'DRAFT' },
]
