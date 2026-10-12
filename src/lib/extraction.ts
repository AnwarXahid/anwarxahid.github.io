import {quizSchema,limits,type Question} from '../../packages/shared/schema';
import {baseQuiz} from './samples';
export async function extract(file:File):Promise<{text:string;truncated?:boolean;questions?:Question[]}>{
 if(file.size>limits.fileBytes)throw new Error('tooLarge');
 const ext=file.name.split('.').pop()?.toLowerCase();let text='';
 try{
 if(['txt','md','markdown'].includes(ext!))text=await file.text();
 else if(ext==='json'){const q=quizSchema.parse(JSON.parse(await file.text()));return {text:'',questions:q.questions};}
 else if(ext==='csv'){
  const {default:Papa}=await import('papaparse');const parsed=Papa.parse<Record<string,string>>(await file.text(),{header:true,skipEmptyLines:true});
  if(parsed.errors.length||!parsed.meta.fields?.includes('question_json')||parsed.data.length>50)throw new Error('parseFailed');
  const questions=parsed.data.map(row=>JSON.parse(row.question_json));return {text:'',questions:quizSchema.parse({...baseQuiz,title:'Import',questions}).questions};
 }else if(ext==='docx'){const mammoth=await import('mammoth/mammoth.browser');text=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;}
 else if(ext==='pdf'){
  const pdfjs=await import('pdfjs-dist');const {default:worker}=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');pdfjs.GlobalWorkerOptions.workerSrc=worker;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true});const doc=await task.promise;
  try{if(doc.numPages>50)throw new Error('tooLarge');for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);text+=(await page.getTextContent()).items.map(x=>'str'in x?x.str:'').join(' ')+'\n';if(text.length>limits.input)break;}if(!text.trim())throw new Error('ocrNeeded');}finally{await task.destroy();}
 }else throw new Error('parseFailed');
 }catch(e){if(e instanceof Error&&['tooLarge','ocrNeeded'].includes(e.message))throw e;throw new Error('parseFailed');}
 return {text:text.slice(0,limits.input),truncated:text.length>limits.input};
}
