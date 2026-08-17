import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

type Application={trackingCode:string;competitionTitle:string;participantName:string;schoolName:string;status:string;adminComment?:string;createdAt:string}
const statusName=(s:string)=>s==='ACCEPTED'?'Принята':s==='REJECTED'?'Отклонена':s==='REVIEW'?'На рассмотрении':'Получена'

export function ApplicationStatusPage(){
 const[params]=useSearchParams()
 const[items,setItems]=useState<Application[]>([])
 const[searched,setSearched]=useState(false)
 const[error,setError]=useState('')
 const[loading,setLoading]=useState(false)

 const submit=async(e:FormEvent<HTMLFormElement>)=>{
   e.preventDefault()
   setError('');setItems([]);setSearched(false);setLoading(true)
   const f=new FormData(e.currentTarget)
   const email=String(f.get('email')||'').trim()
   try{
     const r=await fetch(`/api/competition-applications?email=${encodeURIComponent(email)}`)
     if(!r.ok){
       const text=await r.text().catch(()=> '')
       throw new Error(text||`Ошибка ${r.status}`)
     }
     const data=await r.json()
     setItems(Array.isArray(data)?data:[])
     setSearched(true)
   }catch(err){
     setError(err instanceof Error?err.message:'Не удалось проверить заявки. Попробуйте ещё раз.')
   }finally{setLoading(false)}
 }

 return <main>
   <section className="page-hero compact-application-hero">
     <span className="eyebrow">Конкурсы</span>
     <h1>Статус заявки</h1>
     <p>Введите электронную почту, которую указывали при подаче заявки.</p>
   </section>
   <section className="public-section application-status-page">
     <div className="application-status-tools"><Link className="article-back" to="/konkursy">← К конкурсам</Link></div>
     <form className="application-status-form" onSubmit={submit}>
       <label className="application-status-field">
         <span>Электронная почта</span>
         <input name="email" type="email" defaultValue={params.get('email')||''} placeholder="name@example.ru" required/>
       </label>
       <button className="button application-brown-button application-status-submit" disabled={loading}>{loading?'Ищем…':'Найти заявки'}</button>
     </form>
     {error&&<p className="form-error application-status-error">{error}</p>}
     {searched&&items.length===0&&!error&&<p className="application-status-empty">По этой почте заявок пока не найдено.</p>}
     <div className="application-status-list">{items.map(item=><article className="application-status-card" key={item.trackingCode}>
       <div className="application-status-card-head"><div><span>Конкурс</span><h2>{item.competitionTitle}</h2></div><strong className={`public-status status-${item.status.toLowerCase()}`}>{statusName(item.status)}</strong></div>
       <dl><div><dt>Участник</dt><dd>{item.participantName}</dd></div><div><dt>Организация</dt><dd>{item.schoolName}</dd></div><div><dt>Дата подачи</dt><dd>{new Intl.DateTimeFormat('ru-RU').format(new Date(item.createdAt))}</dd></div></dl>
       {item.adminComment&&<p className="application-admin-note"><b>Комментарий администратора:</b> {item.adminComment}</p>}
     </article>)}</div>
   </section>
 </main>
}
