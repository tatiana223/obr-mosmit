import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

type BlockStyle = 'p' | 'h2' | 'h3' | 'blockquote'

type FontOption = { label: string; value: string; sample: string }

const FONT_OPTIONS: FontOption[] = [
  { label: 'Prata', value: 'Prata, Georgia, serif', sample: 'Prata' },
  { label: 'Manrope', value: 'Manrope, Arial, sans-serif', sample: 'Manrope' },
  { label: 'Georgia', value: 'Georgia, serif', sample: 'Georgia' },
  { label: 'Garamond', value: 'Garamond, "Times New Roman", serif', sample: 'Garamond' },
  { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', sample: 'Palatino Linotype' },
  { label: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif', sample: 'Book Antiqua' },
  { label: 'Trebuchet', value: '"Trebuchet MS", Arial, sans-serif', sample: 'Trebuchet MS' },
  { label: 'Arial', value: 'Arial, sans-serif', sample: 'Arial' },
  { label: 'Verdana', value: 'Verdana, sans-serif', sample: 'Verdana' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif', sample: 'Times New Roman' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace', sample: 'Courier New' },
]

const SIZE_OPTIONS = ['14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px']
const ZERO_WIDTH = '\u200B'

const rgbToHex = (value: string) => {
  if (value.startsWith('#')) return value
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!match) return '#49362d'
  return `#${[match[1], match[2], match[3]].map(item => Number(item).toString(16).padStart(2, '0')).join('')}`
}

const isBoldStyle = (style: CSSStyleDeclaration) => {
  const weight = Number.parseInt(style.fontWeight, 10)
  return style.fontWeight === 'bold' || (!Number.isNaN(weight) && weight >= 600)
}

export function RichTextEditor({ value, onChange, placeholder = 'Введите текст…' }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [blockStyle, setBlockStyle] = useState<BlockStyle>('p')
  const [fontFamily, setFontFamily] = useState('Georgia, serif')
  const [fontSize, setFontSize] = useState('16px')
  const [textColor, setTextColor] = useState('#49362d')
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [underline, setUnderline] = useState(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return
    if (editor.innerHTML !== value) editor.innerHTML = value
  }, [value])

  const cleanHtml = () => {
    const editor = editorRef.current
    if (!editor) return ''
    const clone = editor.cloneNode(true) as HTMLElement
    clone.querySelectorAll('[data-editor-typing]').forEach(node => node.removeAttribute('data-editor-typing'))
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT)
    const textNodes: Text[] = []
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text)
    textNodes.forEach(node => { node.data = node.data.replaceAll(ZERO_WIDTH, '') })
    clone.querySelectorAll('span').forEach(span => {
      if (!span.textContent && span.children.length === 0) span.remove()
    })
    return clone.innerHTML
  }

  const emit = () => onChange(cleanHtml())

  const currentRange = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return null
    const range = selection.getRangeAt(0)
    return editor.contains(range.commonAncestorContainer) ? range : null
  }

  const rememberSelection = () => {
    const range = currentRange()
    if (range) savedRangeRef.current = range.cloneRange()
  }

  const restoreSelection = () => {
    const editor = editorRef.current
    const range = savedRangeRef.current
    if (!editor || !range) return null
    editor.focus({ preventScroll: true })
    const selection = window.getSelection()
    if (!selection) return null
    selection.removeAllRanges()
    selection.addRange(range)
    return range
  }

  const elementAtRange = (range: Range | null) => {
    const editor = editorRef.current
    if (!editor || !range) return null
    let node: Node | null = range.startContainer
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement
    const element = node as HTMLElement | null
    return element && editor.contains(element) ? element : null
  }

  const syncToolbar = (rangeOverride?: Range | null) => {
    const range = rangeOverride ?? currentRange() ?? savedRangeRef.current
    const element = elementAtRange(range)
    if (!element) return

    const block = element.closest('h2,h3,blockquote,p,div') as HTMLElement | null
    const tag = block?.tagName.toLowerCase()
    setBlockStyle(tag === 'h2' || tag === 'h3' || tag === 'blockquote' ? tag : 'p')

    const style = window.getComputedStyle(element)
    const family = style.fontFamily.replace(/["']/g, '').toLowerCase()
    const matchedFont = FONT_OPTIONS.find(option => {
      const first = option.sample.toLowerCase()
      return family.includes(first)
    })
    if (matchedFont) setFontFamily(matchedFont.value)

    const size = `${Math.round(Number.parseFloat(style.fontSize))}px`
    setFontSize(size)
    setTextColor(rgbToHex(style.color))
    setBold(isBoldStyle(style))
    setItalic(style.fontStyle === 'italic' || style.fontStyle === 'oblique')
    setUnderline(style.textDecorationLine.includes('underline'))
  }

  const setSelectionToWrappers = (wrappers: HTMLElement[]) => {
    if (!wrappers.length) return
    const firstText = wrappers[0].firstChild
    const lastText = wrappers[wrappers.length - 1].lastChild
    if (!firstText || !lastText) return
    const nextRange = document.createRange()
    nextRange.setStart(firstText, 0)
    nextRange.setEnd(lastText, lastText.textContent?.length ?? 0)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(nextRange)
    savedRangeRef.current = nextRange.cloneRange()
  }

  const applyTypingStyle = (range: Range, styles: Partial<CSSStyleDeclaration>) => {
    const editor = editorRef.current
    if (!editor) return
    let parent: HTMLElement | null = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer as HTMLElement
    if (parent && parent !== editor && parent.dataset.editorTyping === 'true') {
      Object.assign(parent.style, styles)
      return
    }

    const span = document.createElement('span')
    span.dataset.editorTyping = 'true'
    Object.assign(span.style, styles)
    const marker = document.createTextNode(ZERO_WIDTH)
    span.appendChild(marker)
    range.insertNode(span)
    const nextRange = document.createRange()
    nextRange.setStart(marker, 1)
    nextRange.collapse(true)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(nextRange)
    savedRangeRef.current = nextRange.cloneRange()
  }

  const applyInlineStyles = (styles: Partial<CSSStyleDeclaration>) => {
    const editor = editorRef.current
    const range = restoreSelection()
    if (!editor || !range) return

    if (range.collapsed) {
      applyTypingStyle(range, styles)
      emit()
      requestAnimationFrame(() => syncToolbar())
      return
    }

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
    const selectedNodes: Array<{ node: Text; start: number; end: number }> = []
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (!node.data || !range.intersectsNode(node)) continue
      const start = node === range.startContainer ? range.startOffset : 0
      const end = node === range.endContainer ? range.endOffset : node.length
      if (end > start) selectedNodes.push({ node, start, end })
    }

    const wrappers: HTMLElement[] = []
    for (let index = selectedNodes.length - 1; index >= 0; index--) {
      const { node, start, end } = selectedNodes[index]
      const selected = start === 0 ? node : node.splitText(start)
      if (end - start < selected.length) selected.splitText(end - start)
      const span = document.createElement('span')
      Object.assign(span.style, styles)
      selected.parentNode?.insertBefore(span, selected)
      span.appendChild(selected)
      wrappers.unshift(span)
    }

    setSelectionToWrappers(wrappers)
    emit()
    requestAnimationFrame(() => syncToolbar(savedRangeRef.current))
  }

  const runNative = (command: string, commandValue?: string) => {
    restoreSelection()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand(command, false, commandValue)
    rememberSelection()
    emit()
    requestAnimationFrame(() => syncToolbar())
  }

  const applyBlock = (next: BlockStyle) => {
    restoreSelection()
    document.execCommand('formatBlock', false, `<${next}>`)
    rememberSelection()
    setBlockStyle(next)
    emit()
    requestAnimationFrame(() => syncToolbar())
  }

  const applyFontFamily = (next: string) => {
    setFontFamily(next)
    applyInlineStyles({ fontFamily: next })
  }

  const applyFontSize = (next: string) => {
    setFontSize(next)
    applyInlineStyles({ fontSize: next })
  }

  const applyColor = (next: string) => {
    setTextColor(next)
    applyInlineStyles({ color: next })
  }

  const toggleBold = () => {
    const next = !bold
    setBold(next)
    applyInlineStyles({ fontWeight: next ? '700' : '400' })
  }

  const toggleItalic = () => {
    const next = !italic
    setItalic(next)
    applyInlineStyles({ fontStyle: next ? 'italic' : 'normal' })
  }

  const toggleUnderline = () => {
    const next = !underline
    setUnderline(next)
    applyInlineStyles({ textDecorationLine: next ? 'underline' : 'none' })
  }

  useEffect(() => {
    const onSelectionChange = () => {
      const range = currentRange()
      if (!range) return
      savedRangeRef.current = range.cloneRange()
      syncToolbar(range)
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  const saveSelectionBeforeControl = () => rememberSelection()

  return <div className="rich-editor-shell">
    <div className="rich-editor-toolbar" role="toolbar" aria-label="Форматирование текста">
      <div className="rich-editor-toolbar-group rich-editor-toolbar-group--wide">
        <select aria-label="Стиль текста" value={blockStyle} onPointerDown={saveSelectionBeforeControl} onChange={event => applyBlock(event.target.value as BlockStyle)}>
          <option value="p">Обычный текст</option>
          <option value="h2">Заголовок</option>
          <option value="h3">Подзаголовок</option>
          <option value="blockquote">Цитата</option>
        </select>
        <select className="rich-editor-font-select" aria-label="Шрифт" value={fontFamily} onPointerDown={saveSelectionBeforeControl} onChange={event => applyFontFamily(event.target.value)} style={{ fontFamily }}>
          {FONT_OPTIONS.map(option => <option key={option.label} value={option.value} style={{ fontFamily: option.value }}>{option.label}</option>)}
        </select>
        <select aria-label="Размер шрифта" value={fontSize} onPointerDown={saveSelectionBeforeControl} onChange={event => applyFontSize(event.target.value)}>
          {!SIZE_OPTIONS.includes(fontSize) && <option value={fontSize}>{fontSize}</option>}
          {SIZE_OPTIONS.map(size => <option key={size} value={size}>{size.replace('px', ' px')}</option>)}
        </select>
      </div>

      <span className="rich-editor-separator" />
      <div className="rich-editor-toolbar-group">
        <button type="button" className={bold ? 'active' : ''} title="Жирный" aria-label="Жирный" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={toggleBold}><b>Ж</b></button>
        <button type="button" className={italic ? 'active' : ''} title="Курсив" aria-label="Курсив" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={toggleItalic}><i>К</i></button>
        <button type="button" className={underline ? 'active' : ''} title="Подчёркивание" aria-label="Подчёркивание" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={toggleUnderline}><u>Ч</u></button>
        <label className="rich-editor-color" title="Цвет текста" style={{ color: textColor }} onPointerDown={saveSelectionBeforeControl}>
          <span>A</span>
          <input type="color" value={textColor} aria-label="Цвет текста" onChange={event => applyColor(event.target.value)} />
        </label>
      </div>

      <span className="rich-editor-separator" />
      <div className="rich-editor-toolbar-group">
        <button type="button" title="Маркированный список" aria-label="Маркированный список" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={() => runNative('insertUnorderedList')}>•</button>
        <button type="button" title="Нумерованный список" aria-label="Нумерованный список" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={() => runNative('insertOrderedList')}>1.</button>
      </div>

      <span className="rich-editor-separator" />
      <div className="rich-editor-toolbar-group">
        <button type="button" title="По левому краю" aria-label="По левому краю" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={() => runNative('justifyLeft')}>≡</button>
        <button type="button" title="По центру" aria-label="По центру" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={() => runNative('justifyCenter')}>≡</button>
        <button type="button" title="По правому краю" aria-label="По правому краю" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={() => runNative('justifyRight')}>≡</button>
      </div>

      <span className="rich-editor-separator" />
      <div className="rich-editor-toolbar-group">
        <button type="button" title="Отменить" aria-label="Отменить" onMouseDown={event => event.preventDefault()} onClick={() => runNative('undo')}>↶</button>
        <button type="button" title="Повторить" aria-label="Повторить" onMouseDown={event => event.preventDefault()} onClick={() => runNative('redo')}>↷</button>
        <button type="button" className="rich-editor-clear" title="Убрать форматирование" aria-label="Убрать форматирование" onMouseDown={event => { event.preventDefault(); rememberSelection() }} onClick={() => runNative('removeFormat')}>Очистить</button>
      </div>
    </div>

    <div
      ref={editorRef}
      className="rich-editor-area"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={() => { rememberSelection(); emit(); syncToolbar() }}
      onKeyUp={() => { rememberSelection(); syncToolbar() }}
      onMouseUp={() => { rememberSelection(); syncToolbar() }}
      onFocus={() => { rememberSelection(); syncToolbar() }}
      onBlur={() => { rememberSelection(); emit() }}
    />
  </div>
}
