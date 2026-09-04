import {
    isAbortOrTimeoutError,
    SAVE_TIMEOUT_MESSAGE,
    timeoutSignal,
} from '../utils/imageUpload';

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

/** Client abort so a stalled upload cannot leave the spinner running forever. */
const SAVE_TIMEOUT_MS = 60_000;

const check = async (r: Response) => {
    if (r.status === 401 || r.status === 403) {
        throw new Error('Необходимо войти как администратор');
    }
    if (!r.ok) {
        const text = (await r.text()).trim();
        throw new Error(text || `Не удалось выполнить действие (код ${r.status})`);
    }
    return r;
};

async function fetchAdmin(input: string, init?: RequestInit): Promise<Response> {
    try {
        return await fetch(input, init);
    } catch (error) {
        if (isAbortOrTimeoutError(error)) {
            throw new Error(SAVE_TIMEOUT_MESSAGE);
        }
        throw error;
    }
}

export async function loadAdminNews(query = ''): Promise<AdminNewsItem[]> {
    return (await check(await fetchAdmin(`/api/admin/news?q=${encodeURIComponent(query)}`, { credentials: 'include' }))).json();
}

export async function loadAdminNewsItem(id: string): Promise<AdminNewsItem> {
    return (await check(await fetchAdmin(`/api/admin/news/${id}`, { credentials: 'include' }))).json();
}

export async function saveAdminNews(id: string | undefined, data: FormData): Promise<AdminNewsItem> {
    // Always POST: multipart bodies are only parsed for POST (PUT left updates unbound).
    return (await check(await fetchAdmin(id ? `/api/admin/news/${id}` : '/api/admin/news', {
        method: 'POST',
        credentials: 'include',
        body: data,
        signal: timeoutSignal(SAVE_TIMEOUT_MS),
    }))).json();
}

export async function uploadNewsGallery(newsId: number, files: File[]): Promise<string[]> {
    const photos = new FormData();
    files.forEach((file) => photos.append('files', file));
    const response = await fetchAdmin(`/api/admin/media/news/${newsId}`, {
        method: 'POST',
        credentials: 'include',
        body: photos,
        signal: timeoutSignal(SAVE_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new Error((await response.text()).trim() || 'Новость сохранена, но фотографии загрузить не удалось');
    }
    return response.json();
}

export async function deleteAdminNews(id: number) {
    await check(await fetchAdmin(`/api/admin/news/${id}`, { method: 'DELETE', credentials: 'include' }));
}
