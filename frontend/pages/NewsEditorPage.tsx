import { useEffect, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { loadAdminNewsItem, saveAdminNews, uploadNewsGallery } from '../api/adminNewsApi'
import { htmlToPlainText } from '../utils/plainText'
import { prepareCoverImage, prepareGalleryImages } from '../utils/imageUpload'
import { RichTextEditor } from '../components/RichTextEditor'
import { MediaGalleryUploader } from '../components/MediaUploaders'

type NewsStatus = 'PUBLISHED' | 'DRAFT'
type SavePhase = 'idle' | 'compressing' | 'saving' | 'gallery'

const SAVE_LABEL: Record<SavePhase, string> = {
  idle: 'Сохранить изменения',
  compressing: 'Сжимаем изображение…',
  saving: 'Сохраняем…',
  gallery: 'Загружаем фотографии…',
}

export function NewsEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<NewsStatus>('DRAFT')
  const [image, setImage] = useState<string>()
  const [gallery, setGallery] = useState<string[]>([])
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [imageFile, setImageFile] = useState<File>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [phase, setPhase] = useState<SavePhase>('idle')
  const saving = phase !== 'idle'

  useEffect(() => {
    if (!id) return
    loadAdminNewsItem(id)
      .then((item) => {
        setTitle(item.title)
        setSummary(htmlToPlainText(item.summary || ''))
        setContent(item.content || '')
        setSlug(item.slug || '')
        setStatus(item.status)
        setImage(item.image)
        setGallery(item.gallery || [])
      })
      .catch((e) => setError(e.message))
  }, [id])

  const pickImage = (file?: File) => {
    if (!file?.type.startsWith('image/')) return
    setError('')
    setImageFile(file)
    setImage(URL.createObjectURL(file))
  }
  const onFile = (e: ChangeEvent<HTMLInputElement>) => pickImage(e.target.files?.[0])
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    pickImage(e.dataTransfer.files[0])
  }
  const chooseGallery = (files: FileList | null) =>
    setGalleryFiles(files ? Array.from(files).filter((file) => file.type.startsWith('image/')) : [])

  const save = async () => {
    setError('')
    setNotice('')
    setPhase(imageFile || galleryFiles.length ? 'compressing' : 'saving')
    try {
      const data = new FormData()
      data.append('title', title)
      data.append('summary', summary)
      data.append('content', content)
      data.append('slug', slug)
      data.append('status', status)

      if (imageFile) {
        const cover = await prepareCoverImage(imageFile)
        data.append('image', cover)
        setImageFile(cover)
      }

      let preparedGallery = galleryFiles
      if (galleryFiles.length) {
        preparedGallery = await prepareGalleryImages(galleryFiles)
      }

      setPhase('saving')
      const saved = await saveAdminNews(id, data)

      if (preparedGallery.length) {
        setPhase('gallery')
        setGallery(await uploadNewsGallery(saved.id, preparedGallery))
        setGalleryFiles([])
      }

      setStatus(saved.status)
      await queryClient.invalidateQueries({ queryKey: ['public-news'] })
      setNotice(
        saved.status === 'PUBLISHED'
          ? 'Новость сохранена и опубликована.'
          : 'Новость сохранена как черновик.',
      )
      if (!id) navigate(`/control-center/news/${saved.id}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPhase('idle')
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <Link className="back" to="/control-center/news">
            ← Вернуться к новостям
          </Link>
          <h1>{id ? 'Редактирование новости' : 'Новая новость'}</h1>
        </div>
        {id && status === 'PUBLISHED' && (
          <Link className="button secondary" to={`/novosti/${id}`}>
            Открыть публикацию ↗
          </Link>
        )}
      </header>
      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}
      <div className="editor-grid">
        <section className="surface editor-content">
          <label>
            <span>
              Заголовок <small>{title.length} / 300</small>
            </span>
            <input
              maxLength={300}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Состоялась встреча руководителей православных школ"
            />
          </label>
          <label>
            <span>
              Краткое описание <small>{summary.length} / 1000</small>
            </span>
            <textarea
              rows={4}
              maxLength={1000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Коротко расскажите, о чём публикация"
            />
          </label>
          <label>
            <span>Текст новости</span>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Введите полный текст новости…"
            />
          </label>
        </section>
        <aside className="editor-settings">
          <section className="surface setting-card">
            <div className="setting-title">
              <i>1</i>
              <span>
                <b>Публикация</b>
                <small>Кто увидит материал</small>
              </span>
            </div>
            <label>
              Статус
              <select value={status} onChange={(e) => setStatus(e.target.value as NewsStatus)}>
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликовано</option>
              </select>
            </label>
            <button
              className="button primary full"
              type="button"
              disabled={saving || !title.trim() || !content.trim()}
              onClick={save}
            >
              {SAVE_LABEL[phase]}
            </button>
          </section>
          <section className="surface setting-card">
            <div className="setting-title">
              <i>2</i>
              <span>
                <b>Обложка</b>
                <small>Главное изображение</small>
              </span>
            </div>
            <label className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
              {image ? (
                <img src={image} alt="Предпросмотр" />
              ) : (
                <>
                  <span>↑</span>
                  <b>Перетащите изображение</b>
                  <small>или нажмите для выбора</small>
                </>
              )}
              <input type="file" accept="image/*" onChange={onFile} />
            </label>
            <p className="hint">JPG, PNG или WebP · крупные файлы сжимаются автоматически · до 10 МБ</p>
          </section>
          <section className="surface setting-card">
            <div className="setting-title">
              <i>3</i>
              <span>
                <b>Фотогалерея</b>
                <small>Дополнительные фотографии</small>
              </span>
            </div>
            {id ? (
              <MediaGalleryUploader endpoint={`/api/admin/media/news/${id}`} images={gallery} />
            ) : (
              <div className="media-uploader">
                <div className="media-preview-grid">
                  {galleryFiles.map((file, index) => (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Новая фотография ${index + 1}`}
                      key={`${file.name}-${file.lastModified}`}
                    />
                  ))}
                </div>
                <label className="button secondary">
                  {galleryFiles.length
                    ? `Выбрано фотографий: ${galleryFiles.length}`
                    : '+ Выбрать фотографии'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => chooseGallery(e.target.files)}
                  />
                </label>
                <small>Можно выбрать несколько изображений сразу.</small>
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}
