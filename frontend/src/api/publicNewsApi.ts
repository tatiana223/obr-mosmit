import { useQuery } from '@tanstack/react-query'
import { publicNews } from '../data/publicNews'

export type PublicNewsItem = {
  id: string
  date: string
  title: string
  summary: string
  content?: string
  image: string
  publishedAt?: string
}

async function loadNews(): Promise<PublicNewsItem[]> {
  const response = await fetch('/api/news')
  if (!response.ok) throw new Error('Новости временно недоступны')
  return response.json()
}

export function usePublicNews() {
  return useQuery({ queryKey: ['public-news'], queryFn: loadNews, retry: false })
}

export async function loadNewsItem(id: string): Promise<PublicNewsItem> {
  const response = await fetch(`/api/news/${id}`)
  if (!response.ok) {
    const fallback = publicNews.find(item => item.id === id)
    if (fallback) return fallback
    throw new Error('Новость не найдена')
  }
  return response.json()
}
