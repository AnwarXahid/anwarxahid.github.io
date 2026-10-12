import type {Quiz,Question} from '../../packages/shared/schema';
export const baseQuiz:Quiz={title:'',subject:'',audience:'',difficulty:'',language:'en',instructions:'',questions:[],settings:{mode:'practice',durationMinutes:null,startsAt:null,endsAt:null,timezone:'UTC',hostControlled:false,lateJoin:true,maxAttempts:600,shuffle:false,leaderboard:false,youngAudience:false,feedback:false,nicknameMode:'generated',retentionDays:30,lifetimeDays:90}};
export function newQuestion(type:Question['type']='single'):Question{
 const base={id:crypto.randomUUID(),prompt:'',points:1,explanation:'',sourceRef:''};const choices=[{id:'a',text:''},{id:'b',text:''}];
 switch(type){case 'single':return {...base,type,choices,correct:'a'};case 'multiple':return {...base,type,choices,correct:['a'],partial:false};case 'boolean':return {...base,type,correct:true};case 'blanks':return {...base,type,accepted:[['']],caseSensitive:true,normalizeWhitespace:true};case 'matching':return {...base,type,left:choices,right:[{id:'r1',text:''},{id:'r2',text:''}],correct:{a:'r1',b:'r2'},partial:false};case 'ordering':return {...base,type,choices,correct:['a','b'],partial:false};default:return {...base,type,rubric:''};}
}
export function sampleQuiz(kind:string):Quiz{
 const data:Record<string,[string,string[],string,string]>={science:['Which part of a plant takes in water?',['Roots','Flowers','Leaves'],'a','Roots absorb water from the soil.'],math:['What is 7 × 8?',['54','56','64'],'b','Seven groups of eight make fifty-six.'],spelling:['Choose the correctly spelled word.',['Beautiful','Beutiful','Beautifull'],'a','The correct spelling is beautiful.'],trivia:['Which is the largest ocean?',['Atlantic','Pacific','Indian'],'b','The Pacific Ocean is the largest ocean on Earth.']};
 const [prompt,options,correct,explanation]=data[kind]||data.science;
 return {...structuredClone(baseQuiz),title:`${kind[0].toUpperCase()+kind.slice(1)} — sample`,subject:kind,settings:{...baseQuiz.settings,feedback:true},questions:[{id:'sample-1',type:'single',prompt,points:1,choices:options.map((text,i)=>({id:String.fromCharCode(97+i),text})),correct,explanation,sourceRef:''}]};
}
