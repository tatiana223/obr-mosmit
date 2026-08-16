import { useEffect, useRef } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value)
}

export function RichTextEditor({ value, onChange, placeholder = 'Введите текст…' }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return
    if (editor.innerHTML !== value) editor.innerHTML = value
  }, [value])

  const apply = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    exec(command, commandValue)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const select = (command: string, commandValue: string) => {
    apply(command, commandValue)
  }

  return <div className="rich-editor-shell">
    <div className="rich-editor-toolbar" role="toolbar" aria-label="Форматирование текста">
      <select aria-label="Стиль текста" defaultValue="p" onChange={event => { select('formatBlock', event.target.value); event.currentTarget.value = 'p' }}>
        <option value="p">Обычный текст</option>
        <option value="h2">Заголовок</option>
        <option value="h3">Подзаголовок</option>
        <option value="blockquote">Цитата</option>
      </select>
      <select aria-label="Шрифт" defaultValue="" onChange={event => { if (event.target.value) select('fontName', event.target.value); event.currentTarget.value = '' }}>
        <option value="">Шрифт</option>
        <option value="Georgia">Georgia</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </select>
      <select aria-label="Размер шрифта" defaultValue="" onChange={event => { if (event.target.value) select('fontSize', event.target.value); event.currentTarget.value = '' }}>
        <option value="">Размер</option>
        <option value="2">Мелкий</option>
        <option value="3">Обычный</option>
        <option value="4">Крупный</option>
        <option value="5">Очень крупный</option>
      </select>
      <span className="rich-editor-separator" />
      <button type="button" title="Жирный" aria-label="Жирный" onClick={() => apply('bold')}><b>Ж</b></button>
      <button type="button" title="Курсив" aria-label="Курсив" onClick={() => apply('italic')}><i>К</i></button>
      <button type="button" title="Подчёркивание" aria-label="Подчёркивание" onClick={() => apply('underline')}><u>Ч</u></button>
      <span className="rich-editor-separator" />
      <button type="button" title="Маркированный список" aria-label="Маркированный список" onClick={() => apply('insertUnorderedList')}>•≡</button>
      <button type="button" title="Нумерованный список" aria-label="Нумерованный список" onClick={() => apply('insertOrderedList')}>1.</button>
      <span className="rich-editor-separator" />
      <button type="button" title="По левому краю" aria-label="По левому краю" onClick={() => apply('justifyLeft')}>≡</button>
      <button type="button" title="По центру" aria-label="По центру" onClick={() => apply('justifyCenter')}>≡</button>
      <button type="button" title="По правому краю" aria-label="По правому краю" onClick={() => apply('justifyRight')}>≡</button>
      <span className="rich-editor-separator" />
      <button type="button" title="Убрать форматирование" aria-label="Убрать форматирование" onClick={() => apply('removeFormat')}>Очистить</button>
    </div>
    <div
      ref={editorRef}
      className="rich-editor-area"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={event => onChange(event.currentTarget.innerHTML)}
      onBlur={event => onChange(event.currentTarget.innerHTML)}
    />
  </div>
}
