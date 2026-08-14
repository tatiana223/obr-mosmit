import { useQuery } from '@tanstack/react-query'

export type SchoolItem = { id: string; title: string; summary: string; content: string; image?: string }

async function loadSchools(): Promise<SchoolItem[]> {
  const response = await fetch('/api/schools')
  if (!response.ok) throw new Error('Не удалось загрузить школы')
  return response.json()
}

export function useSchools() {
  return useQuery({ queryKey: ['schools'], queryFn: loadSchools, retry: false })
}

export async function loadSchool(id: string): Promise<SchoolItem> {
  const response = await fetch(`/api/schools/${id}`)
  if (!response.ok) throw new Error('Школа не найдена')
  return response.json()
}
