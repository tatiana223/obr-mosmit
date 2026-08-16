export function htmlToPlainText(value:string){
 if(!value)return ''
 const document=new DOMParser().parseFromString(value,'text/html')
 document.querySelectorAll('script,style,noscript,img').forEach(node=>node.remove())
 document.querySelectorAll('br').forEach(node=>node.replaceWith('\n'))
 const blocks=new Set(['P','DIV','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','TR'])
 const read=(node:Node):string=>{if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';if(!(node instanceof HTMLElement))return '';const text=Array.from(node.childNodes).map(read).join('');return blocks.has(node.tagName)?`\n${text}\n`:text}
 return read(document.body).replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim()
}
