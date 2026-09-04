import { useEffect, useState } from 'react'
import {
  isAbortOrTimeoutError,
  prepareCoverImage,
  prepareGalleryImages,
  SAVE_TIMEOUT_MESSAGE,
  timeoutSignal,
} from '../utils/imageUpload'

const UPLOAD_TIMEOUT_MS = 60_000

type GalleryProps = {
  endpoint: string
  images?: string[]
  onChange?: (images: string[]) => void
}

export function MediaGalleryUploader({ endpoint, images = [], onChange }: GalleryProps) {
  const [items, setItems] = useState(images)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setItems(images), [images])

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setError('')
    try {
      const prepared = await prepareGalleryImages(Array.from(files))
      let latest = items
      // One file per request so total body stays under Spring multipart limits.
      for (const file of prepared) {
        const data = new FormData()
        data.append('files', file)
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: data,
          signal: timeoutSignal(UPLOAD_TIMEOUT_MS),
        })
        if (response.status === 401 || response.status === 403) {
          throw new Error('Необходимо войти как администратор')
        }
        if (!response.ok) {
          throw new Error(
            (await response.text()).trim() ||
              'Не удалось загрузить фотографии. Проверьте размер (до 10 МБ) и попробуйте снова.',
          )
        }
        latest = await response.json()
        setItems(latest)
        onChange?.(latest)
      }
    } catch (err) {
      if (isAbortOrTimeoutError(err)) {
        setError(SAVE_TIMEOUT_MESSAGE)
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить фотографии')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="media-uploader">
      {error && <p className="form-error">{error}</p>}
      <div className="media-preview-grid">
        {items.map((src, i) => (
          <img src={src} alt={`Фотография ${i + 1}`} key={src} />
        ))}
      </div>
      <label className="button secondary">
        {busy ? 'Загрузка…' : '+ Добавить фотографии'}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
      <small>Можно выбрать несколько изображений · крупные файлы сжимаются автоматически</small>
    </div>
  )
}

type CoverProps = {
  endpoint: string
  image?: string
  onChange?: (url: string) => void
}

export function CoverUploader({ endpoint, image, onChange }: CoverProps) {
  const [src, setSrc] = useState(image)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setSrc(image), [image])

  const upload = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const prepared = await prepareCoverImage(file)
      const data = new FormData()
      data.append('file', prepared)
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: data,
        signal: timeoutSignal(UPLOAD_TIMEOUT_MS),
      })
      if (response.status === 401 || response.status === 403) {
        throw new Error('Необходимо войти как администратор')
      }
      if (!response.ok) {
        throw new Error(
          (await response.text()).trim() ||
            'Не удалось загрузить обложку. Проверьте размер (до 10 МБ) и попробуйте снова.',
        )
      }
      const url = (await response.text()).trim()
      setSrc(url)
      onChange?.(url)
    } catch (err) {
      if (isAbortOrTimeoutError(err)) {
        setError(SAVE_TIMEOUT_MESSAGE)
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить обложку')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="media-uploader cover-uploader">
      {error && <p className="form-error">{error}</p>}
      {src && <img src={src} alt="Обложка" />}
      <label className="button secondary">
        {busy ? 'Загрузка…' : 'Выбрать обложку'}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}
