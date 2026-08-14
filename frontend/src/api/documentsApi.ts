import { useQuery } from '@tanstack/react-query'
export type DocumentItem={id:string;title:string;category:string;summary:string;attachments:{title:string;url:string}[];sourceUrl:string}
export type DocumentDetails={id:string;title:string;category:string;content:string;attachments:{title:string;url:string}[]}
export function deduplicateDocuments<T extends DocumentItem>(items:T[]):T[]{const parentFiles=new Set(items.filter(item=>item.sourceUrl.includes('/dokumenty/')).flatMap(item=>item.attachments.map(file=>`${item.category}|${file.url}`)));return items.filter(item=>item.sourceUrl.includes('/dokumenty/')||item.attachments.length!==1||!parentFiles.has(`${item.category}|${item.attachments[0].url}`))}
async function loadDocuments():Promise<DocumentItem[]>{const response=await fetch('/api/documents');if(!response.ok)throw new Error('Не удалось загрузить документы');return response.json()}
export function useDocuments(){return useQuery({queryKey:['documents'],queryFn:loadDocuments,retry:false})}
export async function loadDocument(id:string):Promise<DocumentDetails>{const response=await fetch(`/api/documents/${id}`);if(!response.ok)throw new Error('Документ не найден');return response.json()}
