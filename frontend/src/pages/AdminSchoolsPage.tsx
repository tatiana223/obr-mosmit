import { useEffect,useState } from 'react'
import { htmlToPlainText } from '../utils/plainText'
import { CoverUploader, MediaGalleryUploader } from '../components/MediaUploaders'
import { Pagination } from '../components/Pagination'

type Field={label:string;content:string}
type Section={key:string;title:string;fields:Field[]}
type School={id:string;title:string;summary:string;image?:string;gallery?:string[];sections:Section[]}

const emptySections=():Section[]=>[
 {key:'about',title:'О школе',fields:[]},
 {key:'contacts',title:'Контакты',fields:[]},
 {key:'management',title:'Руководство',fields:[]},
 {key:'documents',title:'Документы',fields:[]},
 {key:'education',title:'Образовательная деятельность',fields:[]},
 {key:'additional',title:'Дополнительная информация',fields:[]},
]

export function AdminSchoolsPage(){
 const[schools,setSchools]=useState<School[]>([]),[search,setSearch]=useState(''),[page,setPage]=useState(1),[edit,setEdit]=useState<School|null>(null),[isNew,setIsNew]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 const load=()=>fetch('/api/schools').then(r=>r.json()).then(setSchools)
 useEffect(()=>{load()},[])
 const change=(si:number,fi:number,key:keyof Field,value:string)=>setEdit(e=>e&&({...e,sections:e.sections.map((s,i)=>i===si?{...s,fields:s.fields.map((f,j)=>j===fi?{...f,[key]:value}:f)}:s)}))
 const add=(si:number)=>setEdit(e=>e&&({...e,sections:e.sections.map((s,i)=>i===si?{...s,fields:[...s.fields,{label:'',content:''}]}:s)}))
 const removeField=(si:number,fi:number)=>setEdit(e=>e&&({...e,sections:e.sections.map((s,i)=>i===si?{...s,fields:s.fields.filter((_,j)=>j!==fi)}:s)}))
 const openEditor=(school:School)=>{setIsNew(false);setError('');setEdit({...structuredClone(school),summary:htmlToPlainText(school.summary||''),sections:school.sections.map(section=>({...section,fields:section.fields.map(field=>({...field,label:htmlToPlainText(field.label),content:htmlToPlainText(field.content)}))}))})}
 const openCreate=()=>{setError('');setIsNew(true);setEdit({id:'',title:'',summary:'',gallery:[],sections:emptySections()})}
 const closeEditor=()=>{setEdit(null);setIsNew(false);setError('')}
 useEffect(()=>{setPage(1)},[search])
 const normalizedSearch=search.trim().toLocaleLowerCase('ru')
 const visibleSchools=normalizedSearch?schools.filter(s=>[s.title,s.summary,...s.sections.flatMap(section=>[section.title,...section.fields.flatMap(field=>[field.label,field.content])])].some(value=>(value||'').toLocaleLowerCase('ru').includes(normalizedSearch))):schools
 const pageSize=12,pageSchools=visibleSchools.slice((page-1)*pageSize,page*pageSize)
 const removeSchool=async(school:School)=>{if(!school.id||!confirm(`Удалить школу «${school.title}»?`))return;const r=await fetch(`/api/schools/${school.id}`,{method:'DELETE',credentials:'include'});if(!r.ok){setError('Не удалось удалить школу.');return}await load()}
 const save=async()=>{
  if(!edit||saving)return
  if(!edit.title.trim()){setError('Укажите название школы.');return}
  setSaving(true);setError('')
  try{
   const url=isNew?'/api/schools':`/api/schools/${edit.id}`
   const r=await fetch(url,{method:isNew?'POST':'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(edit)})
   if(!r.ok){setError(r.status===401||r.status===403?'Войдите как администратор.':'Не удалось сохранить школу.');return}
   const saved:School=await r.json()
   await load()
   if(isNew){
    setIsNew(false)
    setEdit(saved)
   }else closeEditor()
  }finally{setSaving(false)}
 }
 return <>
  <header className="page-header"><div><span className="overline">Каталог</span><h1>Школы</h1><p>Основные сведения и структурированные разделы карточек школ.</p></div><button className="button primary" type="button" onClick={openCreate}>+ Добавить школу</button></header>
  {error&&!edit&&<p className="form-error">{error}</p>}
  <div className="document-search"><div className="document-search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Найти школу по названию или содержанию" aria-label="Поиск школ" />{search&&<button type="button" onClick={()=>setSearch('')} aria-label="Очистить поиск">×</button>}</div><small>{search?`Найдено: ${visibleSchools.length}`:`Всего школ: ${schools.length}`}</small></div>
  <section className="surface table-wrap"><table><thead><tr><th>Школа</th><th>Заполнено разделов</th><th/></tr></thead><tbody>{pageSchools.map(s=><tr key={s.id}><td><b>{s.title}</b><small>{htmlToPlainText(s.summary)}</small></td><td>{s.sections.filter(x=>x.fields.length).length} из {s.sections.length}</td><td className="row-actions"><button className="text-button" onClick={()=>openEditor(s)}>Редактировать →</button><button className="text-button danger" onClick={()=>removeSchool(s)}>Удалить</button></td></tr>)}{visibleSchools.length===0&&<tr><td colSpan={3} className="empty-search-result">Школы не найдены. Попробуйте изменить запрос.</td></tr>}</tbody></table><Pagination page={page} totalItems={visibleSchools.length} pageSize={pageSize} onPageChange={setPage} label="Школы"/></section>
  {edit&&<div className="modal-backdrop"><div className="school-editor modal"><div className="panel-header"><div><span className="overline">{isNew?'Новая школа':'Редактирование'}</span><h2>{isNew?'Добавить школу':'Карточка школы'}</h2></div><button className="text-button" onClick={closeEditor}>Закрыть</button></div>{error&&<p className="form-error">{error}</p>}<label>Название<input autoFocus value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})} placeholder="Название образовательной организации"/></label><label>Краткое описание<textarea value={edit.summary||''} onChange={e=>setEdit({...edit,summary:e.target.value})} placeholder="Короткое описание для каталога"/></label>{!isNew&&<section><div className="panel-header"><h3>Обложка школы</h3></div><p className="editor-hint">Главная фотография для карточки в каталоге и страницы школы.</p><CoverUploader endpoint={`/api/admin/media/schools/${edit.id}/cover`} image={edit.image}/></section>}{isNew&&<p className="editor-hint">Сначала создайте школу. После сохранения здесь появятся загрузка обложки и фотогалерея.</p>}{edit.sections.map((s,si)=><section key={s.key}><div className="panel-header"><h3>{s.title}</h3><button className="text-button" type="button" onClick={()=>add(si)}>+ Поле</button></div>{s.fields.length===0&&<p className="empty-hint">Раздел пока не заполнен.</p>}{s.fields.map((f,fi)=><div className="school-field" key={fi}><input aria-label="Название поля" placeholder="Название поля" value={f.label} onChange={e=>change(si,fi,'label',e.target.value)}/><textarea className="school-plain-text" aria-label="Содержание" placeholder="Обычный текст без HTML-кода" value={f.content} onChange={e=>change(si,fi,'content',e.target.value)}/><button className="text-button danger school-field-delete" type="button" onClick={()=>removeField(si,fi)}>Удалить поле</button></div>)}</section>)}{!isNew&&<section><div className="panel-header"><h3>Фотогалерея</h3></div><p className="editor-hint">Дополнительные фотографии школы.</p><MediaGalleryUploader endpoint={`/api/admin/media/schools/${edit.id}`} images={edit.gallery||[]}/></section>}<div className="form-actions"><button className="button secondary" type="button" onClick={closeEditor}>Отмена</button><button className="button primary" type="button" disabled={saving} onClick={save}>{saving?'Сохраняю…':isNew?'Создать школу':'Сохранить'}</button></div></div></div>}
 </>
}
