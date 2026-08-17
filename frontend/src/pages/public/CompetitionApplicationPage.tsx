import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

type Competition={id:number;title:string;description?:string;deadline?:string}
type Result={participantName:string;competitionTitle:string;status:string;userEmail:string}

export function CompetitionApplicationPage(){
 const{id}=useParams(),[competition,setCompetition]=useState<Competition|null>(null),[result,setResult]=useState<Result|null>(null),[error,setError]=useState(''),[sending,setSending]=useState(false)
 useEffect(()=>{fetch('/api/competitions').then(r=>r.json()).then((items:Competition[])=>setCompetition(items.find(x=>String(x.id)===id)||null)).catch(()=>setError('Не удалось загрузить конкурс.'))},[id])
 const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setError('');setSending(true);const f=new FormData(e.currentTarget);const body=Object.fromEntries(f.entries());try{const r=await fetch('/api/competition-applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,competitionId:Number(id),consent:f.get('consent')==='on'})});if(!r.ok)throw new Error(await r.text()||'Не удалось отправить заявку');setResult(await r.json())}catch(err){setError(err instanceof Error?err.message:'Не удалось отправить заявку')}finally{setSending(false)}}
 if(result)return <main><section className="page-hero compact-application-hero"><span className="eyebrow">Заявка отправлена</span><h1>Спасибо!</h1><p>Заявка зарегистрирована. Проверить её статус можно по электронной почте.</p></section><section className="public-section application-success"><p>Мы получили заявку на конкурс «{result.competitionTitle}».</p><p className="application-success-email">Почта заявки: <b>{result.userEmail}</b></p><Link className="button application-brown-button" to={`/proverit-zayavku?email=${encodeURIComponent(result.userEmail)}`}>Проверить статус</Link></section></main>
 return <main>
  <section className="page-hero compact-application-hero"><span className="eyebrow">Участие в конкурсе</span><h1>Подать заявку</h1><p>{competition?.title||'Заполните данные участника.'}</p></section>
  <section className="public-section competition-application-section">
   <div className="application-page-tools"><Link className="article-back" to="/konkursy">← К конкурсам</Link><Link className="application-status-link" to="/proverit-zayavku">Проверить статус заявки</Link></div>
   <form className="competition-application-form" onSubmit={submit}>
    <header className="competition-application-heading"><h2>Данные участника</h2><p>Поля со звёздочкой обязательны.</p></header>
    <label className="competition-field"><span>ФИО участника *</span><input name="participantName" required maxLength={250}/><small className="competition-field-spacer" aria-hidden="true">&nbsp;</small></label>
    <label className="competition-field"><span>Электронная почта *</span><input name="email" type="email" required maxLength={320}/><small>По этой почте можно будет проверить статус.</small></label>
    <label className="competition-field competition-field-wide"><span>Школа / образовательная организация *</span><input name="schoolName" required maxLength={500}/></label>
    <label className="competition-field"><span>Телефон</span><input name="phone" type="tel" maxLength={50} placeholder="+7 …"/></label>
    <label className="competition-field"><span>Класс / возраст</span><input name="ageGroup" maxLength={100} placeholder="Например, 8 класс"/></label>
    <label className="competition-field competition-field-wide"><span>Дополнительная информация</span><textarea name="comment" rows={3} placeholder="Необязательно"/></label>
    <label className="competition-consent competition-field-wide"><input name="consent" type="checkbox" required/><span>Я согласен(на) на обработку указанных персональных данных для рассмотрения заявки на конкурс.</span></label>
    {error&&<p className="form-error competition-field-wide">{error}</p>}
    <div className="competition-form-actions competition-field-wide"><button className="button application-brown-button" disabled={sending}>{sending?'Отправляем…':'Отправить заявку'}</button></div>
   </form>
  </section>
 </main>
}
