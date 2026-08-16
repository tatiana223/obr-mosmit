import { useEffect, useState } from 'react';
type User = {
    id: number;
    displayName: string;
    email: string;
    role: string;
    enabled: boolean;
    createdAt: string;
};
export function AdminUsersPage() { const [users, setUsers] = useState<User[]>([]), [error, setError] = useState(''); const load = () => fetch('/api/admin/users', { credentials: 'include' }).then(async (r) => { if (!r.ok)
    throw new Error('Войдите как администратор'); return r.json(); }).then(setUsers).catch(e => setError(e.message)); useEffect(() => { load(); }, []); const update = async (u: User, patch: Partial<User>) => { await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...u, ...patch }) }); load(); }; return <><header className="page-header"><div><span className="overline">Доступ</span><h1>Пользователи</h1><p>Роли и доступ зарегистрированных участников.</p></div></header>{error && <p className="form-error">{error}</p>}<section className="surface table-wrap"><table><thead><tr><th>Пользователь</th><th>Роль</th><th>Доступ</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td><b>{u.displayName}</b><small>{u.email}</small></td><td><select value={u.role} onChange={e => update(u, { role: e.target.value })}><option value="USER">Пользователь</option><option value="ADMIN">Администратор</option></select></td><td><label className="check"><input type="checkbox" checked={u.enabled} onChange={e => update(u, { enabled: e.target.checked })}/> Активен</label></td></tr>)}</tbody></table></section></>; }
