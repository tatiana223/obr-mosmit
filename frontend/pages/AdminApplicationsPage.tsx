import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '../components/Pagination'
type Application={id:number;competitionTitle:string;trackingCode:string;userEmail:string;phone?:string;participantName:string;schoolName:string;ageGroup?:string;comment?:string;status:string;adminComment?:string;createdAt:string}
const PAGE_SIZE=12
const statusLabel=(s:string)=>s==='ACCEPTED'?'Принята':s==='REJECTED'?'Отклонена':s==='REVIEW'?'На рассмотрении':'Новая'
const json=async(url:string,options?:RequestInit)=>{const r=await fetch(url,{credentials:'include',headers:{'Content-Type':'application/json'},...options});if(!r.ok)throw new Error(await r.text()||'Не удалось загрузить заявки');return r.json()}
export function AdminApplicationsPage({embedded=false}:{embedded?:boolean}){
 const[items,setItems]=useState<Application[]>([]),[filter,setFilter]=useState('ALL'),[page,setPage]=useState(1),[selected,setSelected]=useState<Application|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 const load=()=>json('/api/admin/applications').then((data:Application[])=>{setItems(data);if(selected){const fresh=data.find(x=>x.id===selected.id);if(fresh)setSelected(fresh)}}).catch(e=>setError(e.message))
 useEffect(()=>{load()},[]);useEffect(()=>{setPage(1)},[filter])
 const visible=useMemo(()=>filter==='ALL'?items:items.filter(x=>x.status===filter),[items,filter]);const pageItems=visible.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE)
 const saveReview=async(status:string,adminComment:string)=>{if(!selected)return;setSaving(true);try{const updated=await json(`/api/admin/applications/${selected.id}`,{method:'PATCH',body:JSON.stringify({status,adminComment})});setSelected(updated);await load()}finally{setSaving(false)}}
 return <>{!embedded&&<header className="page-header"><div><span className="overline">Обращения участников</span><h1>Заявки</h1><p>Открывайте карточку заявки, проверяйте данные и меняйте статус.</p></div></header>}{error&&<p className="form-error">{error}</p>}<div className="application-filters"><button className={filter==='ALL'?'active':''} onClick={()=>setFilter('ALL')}>Все <b>{items.length}</b></button><button className={filter==='NEW'?'active':''} onClick={()=>setFilter('NEW')}>Новые <b>{items.filter(x=>x.status==='NEW').length}</b></button><button className={filter==='REVIEW'?'active':''} onClick={()=>setFilter('REVIEW')}>На рассмотрении</button><button className={filter==='ACCEPTED'?'active':''} onClick={()=>setFilter('ACCEPTED')}>Принятые</button><button className={filter==='REJECTED'?'active':''} onClick={()=>setFilter('REJECTED')}>Отклонённые</button></div><section className="surface table-wrap"><table><thead><tr><th>Конкурс и участник</th><th>Школа</th><th>Статус</th><th/></tr></thead><tbody>{pageItems.map(a=><tr key={a.id}><td><b>{a.competitionTitle}</b><small>{a.participantName} · {a.userEmail}</small></td><td>{a.schoolName}</td><td><span className={`badge ${a.status.toLowerCase()}`}>{statusLabel(a.status)}</span></td><td className="row-actions"><button className="text-button" onClick={()=>setSelected(a)}>Подробнее</button></td></tr>)}</tbody></table><Pagination page={page} totalItems={visible.length} pageSize={PAGE_SIZE} onPageChange={setPage} label="Заявки"/>{visible.length===0&&<p className="empty-hint">Заявок с таким статусом нет.</p>}</section>{selected&&<ApplicationDetailsModal item={selected} saving={saving} onClose={()=>setSelected(null)} onSave={saveReview}/>}</>
}
function ApplicationDetailsModal({item,saving,onClose,onSave}:{item:Application;saving:boolean;onClose:()=>void;onSave:(status:string,comment:string)=>Promise<void>}){
 const[status,setStatus]=useState(item.status),[comment,setComment]=useState(item.adminComment||'')
 return <div className="modal-backdrop application-detail-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="application-detail-modal" role="dialog" aria-modal="true">
   <button className="application-detail-close" type="button" onClick={onClose} aria-label="Закрыть">×</button>
   <header className="application-detail-header"><span className="overline">Заявка участника</span><h2>{item.participantName}</h2><p>{item.competitionTitle}</p></header>
   <div className="application-detail-grid">
    <div><span>Email</span><b>{item.userEmail}</b></div><div><span>Телефон</span><b>{item.phone||'Не указан'}</b></div>
    <div><span>Школа / организация</span><b>{item.schoolName}</b></div><div><span>Класс / возраст</span><b>{item.ageGroup||'Не указан'}</b></div>
    <div><span>Дата подачи</span><b>{new Intl.DateTimeFormat('ru-RU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.createdAt))}</b></div><div><span>Номер заявки</span><b>{item.trackingCode}</b></div>
   </div>
   {item.comment&&<div className="application-detail-comment"><span>Дополнительная информация</span><p>{item.comment}</p></div>}
   <div className="application-review-panel">
    <label className="application-review-status"><span>Статус</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="NEW">Новая</option><option value="REVIEW">На рассмотрении</option><option value="ACCEPTED">Принята</option><option value="REJECTED">Отклонена</option></select></label>
    <label className="application-review-comment"><span>Комментарий участнику</span><textarea rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Необязательно"/></label>
   </div>
   <footer><button type="button" className="button secondary" onClick={onClose}>Закрыть</button><button type="button" className="button primary" disabled={saving} onClick={()=>onSave(status,comment)}>{saving?'Сохраняем…':'Сохранить решение'}</button></footer>
  </section>
 </div>
}
