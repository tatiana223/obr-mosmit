export type AdminNewsItem = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image?: string;
    gallery?: string[];
    status: 'PUBLISHED' | 'DRAFT';
    date: string;
    updatedAt: string;
};
const check = async (r: Response) => { if (r.status === 401 || r.status === 403)
    throw new Error('Необходимо войти как администратор'); if (!r.ok)
    throw new Error(await r.text() || 'Не удалось выполнить действие'); return r; };
export async function loadAdminNews(query = ''): Promise<AdminNewsItem[]> { return (await check(await fetch(`/api/admin/news?q=${encodeURIComponent(query)}`, { credentials: 'include' }))).json(); }
export async function loadAdminNewsItem(id: string): Promise<AdminNewsItem> { return (await check(await fetch(`/api/admin/news/${id}`, { credentials: 'include' }))).json(); }
export async function saveAdminNews(id: string | undefined, data: FormData): Promise<AdminNewsItem> { return (await check(await fetch(id ? `/api/admin/news/${id}` : '/api/admin/news', { method: id ? 'PUT' : 'POST', credentials: 'include', body: data }))).json(); }
export async function deleteAdminNews(id: number) { await check(await fetch(`/api/admin/news/${id}`, { method: 'DELETE', credentials: 'include' })); }
