import { useMemo,useState } from 'react'
import { Link,useParams } from 'react-router-dom'
import { deduplicateDocuments, useDocuments } from '../../api/documentsApi'
import { DocumentFileLink } from '../../components/DocumentFileLink'

export function DocumentCategoryPage(){const{category=''}=useParams();const title=decodeURIComponent(category);const{data=[],isLoading,isError}=useDocuments();const[query,setQuery]=useState('');const items=useMemo(()=>deduplicateDocuments(data.filter(item=>item.category===title&&item.title.toLowerCase().includes(query.toLowerCase()))),[data,title,query]);return <main>
 <section className="page-hero"><span className="eyebrow">Документы</span><h1>{title}</h1><p>Выберите документ для просмотра на сайте.</p></section>
 <section className="public-section documents-section"><Link className="section-back" to="/dokumenty">← Все разделы</Link><label className="public-search">⌕<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск в разделе"/></label>
 {isLoading&&<p>Загружаем документы…</p>}{isError&&<p>Не удалось загрузить документы.</p>}
 <div className="document-list category-document-list">{items.map((item,index)=><article key={item.id}><span className="document-number">{String(index+1).padStart(2,'0')}</span><img src="/icon-document.svg" alt=""/><div><h3>{item.attachments.length>1?item.title:<DocumentFileLink item={item}>{item.title}</DocumentFileLink>}</h3>{item.attachments.length>1&&<div className="document-subfiles">{item.attachments.map(file=><DocumentFileLink item={item} file={file} key={file.url}>{file.title} →</DocumentFileLink>)}</div>}</div><div className="document-downloads">{item.attachments.length>1?<span className="document-file-count">{item.attachments.length} файла</span>:<DocumentFileLink item={item}/>}</div></article>)}</div>
 </section></main>}
