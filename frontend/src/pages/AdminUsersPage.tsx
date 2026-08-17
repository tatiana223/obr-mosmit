import { useEffect, useState } from 'react'
import { Pagination } from '../components/Pagination'

type User = { id: number; displayName: string; email: string; role: string; enabled: boolean; createdAt: string }

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  const load = () => fetch('/api/admin/users', { credentials: 'include' })
    .then(async response => { if (!response.ok) throw new Error('Войдите как администратор'); return response.json() })
    .then(setUsers)
    .catch(error => setError(error.message))

  useEffect(() => { load() }, [])

  const update = async (user: User, patch: Partial<User>) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, ...patch }),
    })
    load()
  }

  const remove = async (user: User) => {
    if (!confirm(`Удалить пользователя ${user.email}? Связанные данные пользователя тоже могут быть удалены.`)) return
    const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      setError(await response.text() || 'Не удалось удалить пользователя')
      return
    }
    load()
  }

  const pageSize = 12
  const pageUsers = users.slice((page - 1) * pageSize, page * pageSize)

  return <>
    <header className="page-header"><div><span className="overline">Доступ</span><h1>Пользователи</h1><p>Роли и доступ зарегистрированных участников.</p></div></header>
    {error && <p className="form-error">{error}</p>}
    <section className="surface table-wrap">
      <table>
        <thead><tr><th>Пользователь</th><th>Роль</th><th>Доступ</th><th /></tr></thead>
        <tbody>{pageUsers.map(user => <tr key={user.id}>
          <td><b>{user.displayName}</b><small>{user.email}</small></td>
          <td><select value={user.role} onChange={event => update(user, { role: event.target.value })}><option value="USER">Пользователь</option><option value="ADMIN">Администратор</option></select></td>
          <td><label className="check"><input type="checkbox" checked={user.enabled} onChange={event => update(user, { enabled: event.target.checked })}/> Активен</label></td>
          <td><button className="text-button danger" type="button" onClick={() => remove(user)}>Удалить</button></td>
        </tr>)}</tbody>
      </table>
      <Pagination page={page} totalItems={users.length} pageSize={pageSize} onPageChange={setPage} label="Пользователи" />
    </section>
  </>
}
