import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
type Contacts = {
    id: number;
    city: string;
    address: string;
    publicEmail: string;
    publicEmailNote: string;
    chairmanRole: string;
    chairmanName: string;
    chairmanEmail: string;
    assistantRole: string;
    assistantName: string;
    assistantEmail: string;
};
export function AdminContactsPage() { const [data, setData] = useState<Contacts | null>(null), [message, setMessage] = useState(''); useEffect(() => { fetch('/api/contacts').then(r => r.json()).then(setData); }, []); const save = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const r = await fetch('/api/admin/contacts', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, id: 1 }) }); if (r.ok) {
    setData(await r.json());
    setMessage('Контакты сохранены');
} }; if (!data)
    return <p>Загрузка…</p>; return <><header className="page-header"><div><span className="overline">Содержание сайта</span><h1>Контакты</h1><p>Адрес, общая почта и ответственные лица.</p></div></header><form className="surface admin-content-form" onSubmit={save}><h2>Основные контакты</h2><label>Город<input name="city" defaultValue={data.city} required/></label><label>Адрес<input name="address" defaultValue={data.address} required/></label><label>Общая электронная почта<input name="publicEmail" type="email" defaultValue={data.publicEmail} required/></label><label>Пояснение к почте<input name="publicEmailNote" defaultValue={data.publicEmailNote}/></label><h2>Руководство</h2><label>Должность руководителя<input name="chairmanRole" defaultValue={data.chairmanRole}/></label><label>Имя руководителя<input name="chairmanName" defaultValue={data.chairmanName}/></label><label>Почта руководителя<input name="chairmanEmail" type="email" defaultValue={data.chairmanEmail}/></label><label>Должность помощника<input name="assistantRole" defaultValue={data.assistantRole}/></label><label>Имя помощника<input name="assistantName" defaultValue={data.assistantName}/></label><label>Почта помощника<input name="assistantEmail" type="email" defaultValue={data.assistantEmail}/></label>{message && <p className="form-notice">{message}</p>}<button className="button primary">Сохранить контакты</button></form></>; }
