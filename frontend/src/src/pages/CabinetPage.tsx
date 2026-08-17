import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

type Me = {
  id: number
  email: string
  displayName: string
  role: 'ADMIN' | 'USER'
}

const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })

  if (!response.ok) throw new Error((await response.text()) || 'Ошибка входа')
  return response.status === 204 ? null : response.json()
}

export function CabinetPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    request('/api/auth/me')
      .then((user: Me) => {
        if (user?.role === 'ADMIN') navigate('/control-center', { replace: true })
      })
      .catch(() => undefined)
      .finally(() => setChecking(false))
  }, [navigate])

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget))

    try {
      const user: Me = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })
      if (user.role !== 'ADMIN') {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        setError('Доступ разрешён только администратору сайта.')
        return
      }
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/control-center', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось выполнить вход')
    }
  }

  if (checking) return <main className="admin-access-check"><p>Проверяем доступ…</p></main>

  return (
    <main className="admin-login-page admin-login-elegant official-theme">
      <section className="admin-login-elegant-card">
        <header>
          <span>Администрирование</span>
          <h1>Кабинет администратора</h1>
          <p>Войдите, чтобы управлять материалами сайта.</p>
        </header>

        <div className="admin-login-divider" aria-hidden="true"><i /><b>✦</b><i /></div>

        <form className="cabinet-form admin-login-form" onSubmit={login}>
          <label>
            Логин или электронная почта
            <input name="email" type="text" autoComplete="username" required />
          </label>
          <label>
            Пароль
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary admin-login-submit" type="submit">Войти</button>
        </form>

        <NavLink className="admin-login-back" to="/">← Вернуться на сайт</NavLink>
      </section>
    </main>
  )
}
