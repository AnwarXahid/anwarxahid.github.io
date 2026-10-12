import {quizSchema,type Question} from '../packages/shared/schema';
const base={points:2,explanation:'Private explanation',sourceRef:''};
export const questions:Question[]=[
 {...base,id:'s',prompt:'Which is a planet?',type:'single',choices:[{id:'a',text:'Earth'},{id:'b',text:'Sun'}],correct:'a'},
 {...base,id:'m',prompt:'Which are even?',type:'multiple',choices:[{id:'a',text:'2'},{id:'b',text:'4'},{id:'c',text:'5'}],correct:['a','b'],partial:false},
 {...base,id:'b',prompt:'Ice is solid water.',type:'boolean',correct:true},
 {...base,id:'f',prompt:'Complete the French word.',type:'blanks',accepted:[['café']],caseSensitive:true,normalizeWhitespace:true},
 {...base,id:'p',prompt:'Match each animal.',type:'matching',left:[{id:'a',text:'Dog'},{id:'b',text:'Cat'}],right:[{id:'x',text:'Bark'},{id:'y',text:'Meow'}],correct:{a:'x',b:'y'},partial:false},
 {...base,id:'o',prompt:'Order from smallest.',type:'ordering',choices:[{id:'b',text:'2'},{id:'a',text:'1'}],correct:['a','b'],partial:false},
 {...base,id:'w',prompt:'Explain water evaporation.',type:'short',rubric:'One relevant explanation.'},
 {...base,id:'l',prompt:'Describe the water cycle.',type:'long',rubric:'Mention three stages.'}
];
export const quiz=quizSchema.parse({title:'Grade 5 Science',subject:'Science',audience:'Grade 5',language:'en',settings:{mode:'practice'},questions});
export const correct={s:'a',m:['a','b'],b:true,f:['café'],p:{a:'x',b:'y'},o:['a','b'],w:'Heat changes water to vapor.',l:'Water evaporates, condenses and falls as rain.'};
