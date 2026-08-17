import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { AdminApplicationsPage } from './AdminApplicationsPage'
import { CoverUploader, MediaGalleryUploader } from '../components/MediaUploaders'
import { Pagination } from '../components/Pagination'

type Competition={id?:number;title:string;description:string;deadline?:string;published:boolean;cover?:string;gallery?:string[]}
const json=async(url:string,options?:RequestInit)=>{const r=await fetch(url,{credentials:'include',headers:{'Content-Type':'application/json'},...options});if(r.status===401||r.status===403)throw new Error('Войдите как администратор');if(!r.ok)throw new Error(await r.text());return r.status===204?null:r.json()}

export function AdminCompetitionsPage(){
 const[items,setItems]=useState<Competition[]>([]),[search,setSearch]=useState(''),[page,setPage]=useState(1),[editing,setEditing]=useState<Competition|null>(null),[error,setError]=useState(''),[tab,setTab]=useState<'competitions'|'applications'>('competitions')
 const load=()=>json('/api/admin/competitions').then(setItems).catch(e=>setError(e.message))
 useEffect(()=>{load()},[])
 useEffect(()=>{setPage(1)},[search])
 const normalizedSearch=search.trim().toLocaleLowerCase('ru')
 const visibleItems=normalizedSearch?items.filter(x=>[x.title,x.description,x.deadline].some(value=>(value||'').toLocaleLowerCase('ru').includes(normalizedSearch))):items
 const pageSize=12,pageItems=visibleItems.slice((page-1)*pageSize,page*pageSize)
 const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));await json('/api/admin/competitions',{method:'POST',body:JSON.stringify({...d,id:editing?.id,published:d.published==='on'})});setEditing(null);load()}
 return <>
  {error&&<p className="form-error">{error}</p>}
  <header className="page-header"><div><span className="overline">Управление</span><h1>Конкурсы</h1><p>Создавайте конкурсы и рассматривайте поступившие заявки участников.</p></div>{tab==='competitions'&&<button className="button primary" onClick={()=>setEditing({title:'',description:'',published:false})}>+ Новый конкурс</button>}</header>
  <div className="competition-tabs" role="tablist"><button className={tab==='competitions'?'active':''} onClick={()=>setTab('competitions')}>Конкурсы</button><button className={tab==='applications'?'active':''} onClick={()=>setTab('applications')}>Заявки</button></div>
  {tab==='competitions'?<><div className="document-search"><div className="document-search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Найти конкурс по названию или описанию" aria-label="Поиск конкурсов" />{search&&<button type="button" onClick={()=>setSearch('')} aria-label="Очистить поиск">×</button>}</div><small>{search?`Найдено: ${visibleItems.length}`:`Всего конкурсов: ${items.length}`}</small></div><section className="surface table-wrap"><table><thead><tr><th>Название</th><th>Срок приёма заявок</th><th>Статус</th><th/></tr></thead><tbody>{pageItems.map(x=><tr key={x.id}><td><div className="competition-admin-title">{x.cover&&<img src={x.cover} alt=""/>}<span><b>{x.title}</b><small>{x.description}</small></span></div></td><td>{x.deadline||'Не указан'}</td><td><span className={`badge ${x.published?'published':''}`}>{x.published?'Опубликован':'Черновик'}</span></td><td><button className="text-button" onClick={()=>setEditing(x)}>Редактировать</button></td></tr>)}{visibleItems.length===0&&<tr><td colSpan={4} className="empty-search-result">Конкурсы не найдены. Попробуйте изменить запрос.</td></tr>}</tbody></table><Pagination page={page} totalItems={visibleItems.length} pageSize={pageSize} onPageChange={setPage} label="Конкурсы"/></section></>:<AdminApplicationsPage embedded/>}
  {editing&&<div className="modal-backdrop"><form className="cabinet-form modal content-editor-modal" onSubmit={save}><h2>{editing.id?'Редактировать конкурс':'Новый конкурс'}</h2><label>Название<input name="title" defaultValue={editing.title} required/></label><label>Описание<textarea name="description" defaultValue={editing.description} rows={6} required/></label><label>Приём заявок до<input name="deadline" type="date" defaultValue={editing.deadline}/></label>{editing.id?<><label>Обложка конкурса<CoverUploader endpoint={`/api/admin/media/competitions/${editing.id}`} image={editing.cover}/></label><label>Изображения конкурса<MediaGalleryUploader endpoint={`/api/admin/media/competitions/${editing.id}/gallery`} images={editing.gallery}/></label></>:<p className="editor-hint">Сохраните конкурс, затем откройте его снова и добавьте обложку и изображения.</p>}<label className="check"><input name="published" type="checkbox" defaultChecked={editing.published}/> Опубликовать</label><div className="form-actions"><button type="button" className="button secondary" onClick={()=>setEditing(null)}>Отмена</button><button className="button primary">Сохранить</button></div></form></div>}
 </>
}
