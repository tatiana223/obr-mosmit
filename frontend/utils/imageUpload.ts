/** Cover / gallery image helpers for admin uploads. */

export const MAX_COVER_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 1920;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESS_BELOW = 800 * 1024;

export function isAbortOrTimeoutError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.name === 'AbortError' || error.name === 'TimeoutError';
}

export const SAVE_TIMEOUT_MESSAGE =
    'Сохранение слишком долго… Проверьте размер изображения и соединение, затем попробуйте снова.';

/** AbortSignal that fires after `ms` (AbortSignal.timeout when available). */
export function timeoutSignal(ms: number): AbortSignal {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

const COMPRESS_TIMEOUT_MS = 45_000;
const COMPRESS_TIMEOUT_MESSAGE =
    'Сжатие изображения слишком долго. Выберите файл меньшего размера и попробуйте снова.';

/** Reject if `promise` does not settle within `ms` (compress must not spin forever). */
export async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error(message)), ms);
            }),
        ]);
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
}

/**
 * Resize/compress oversized covers before multipart upload.
 * Keeps already-small files as-is; rejects files that stay above 10 MB.
 */
async function compressCoverImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
        throw new Error('Можно загружать только изображения');
    }
    if (file.size > MAX_SOURCE_BYTES) {
        throw new Error(
            'Изображение слишком большое. Выберите файл меньше 25 МБ или уменьшите его перед загрузкой.',
        );
    }
    if (file.size <= SKIP_COMPRESS_BELOW && file.size <= MAX_COVER_BYTES) {
        return file;
    }

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error('Не удалось обработать изображение. Используйте JPG, PNG или WebP.');
    }
    try {
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        if (scale === 1 && file.size <= MAX_COVER_BYTES && file.type === 'image/jpeg') {
            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Не удалось обработать изображение в браузере');
        }
        ctx.drawImage(bitmap, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
        );
        if (!blob) {
            throw new Error('Не удалось сжать изображение');
        }
        if (blob.size > MAX_COVER_BYTES) {
            throw new Error(
                'Изображение слишком большое даже после сжатия. Выберите файл меньшего размера (до 10 МБ).',
            );
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'cover';
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    } finally {
        bitmap.close();
    }
}

export async function prepareCoverImage(file: File): Promise<File> {
    return withTimeout(compressCoverImage(file), COMPRESS_TIMEOUT_MS, COMPRESS_TIMEOUT_MESSAGE);
}

export async function prepareGalleryImages(files: File[]): Promise<File[]> {
    const out: File[] = [];
    for (const file of files) {
        out.push(await prepareCoverImage(file));
    }
    return out;
}
