import {describe,it,expect} from 'vitest';
import {questionSchema,quizSchema,publicQuestion,validAnswer} from '../packages/shared/schema';
import {grade,score,csvCell} from '../packages/shared/grading';
import {toUTC,quizState} from '../packages/shared/time';
import {questions,quiz,correct} from './fixtures';
import {dictionaries} from '../src/i18n';
describe('strict model and private serialization',()=>{
 it('validates all eight types and never exposes keys',()=>{for(const q of questions){expect(questionSchema.safeParse(q).success).toBe(true);expect(publicQuestion(q)).not.toHaveProperty('correct');expect(publicQuestion(q)).not.toHaveProperty('explanation');expect(publicQuestion(q)).not.toHaveProperty('rubric');expect(validAnswer(publicQuestion(q),correct[q.id as keyof typeof correct])).toBe(true);}});
 it('rejects dangling IDs, duplicate choices, invalid points and extras',()=>{const q=questions[0];for(const patch of [{correct:'missing'},{points:0},{extra:true},{choices:[{id:'a',text:'same'},{id:'b',text:'same'}]}])expect(questionSchema.safeParse({...q,...patch}).success).toBe(false);expect(quizSchema.safeParse({...quiz,questions:[q,q]}).success).toBe(false);});
 it('validates ordering permutations and complete bijections',()=>{expect(questionSchema.safeParse({...questions[5],correct:['a','a']}).success).toBe(false);expect(questionSchema.safeParse({...questions[4],correct:{a:'x',b:'x'}}).success).toBe(false);});
});
describe('deterministic grading',()=>{
 it('scores objective answers and leaves essays pending',()=>{const s=score(questions,correct);expect(s).toMatchObject({earned:12,total:16,gradedPossible:12,pending:2});expect(score(questions,correct,{w:1,l:2})).toMatchObject({earned:15,pending:0});});
 it('preserves accents, case, mathematical distinctions and canonical unicode',()=>{expect(grade(questions[3],['cafe'])).toBe(0);expect(grade(questions[3],['CAFÉ'])).toBe(0);expect(grade(questions[3],[' cafe\u0301 '])).toBe(2);});
 it('uses exact multi-select and bounded partial credit',()=>{expect(grade(questions[1],['a'])).toBe(0);expect(grade({...questions[1],partial:true} as any,['a'])).toBe(1);expect(grade({...questions[1],partial:true} as any,['c'])).toBe(0);expect(grade({...questions[5],partial:true} as any,['b','a'])).toBe(0);});
 it('escapes spreadsheet formulas',()=>{expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');expect(csvCell('  +1')).toContain("'");});
});
it('rejects DST gaps and folds; stores UTC',()=>{expect(()=>toUTC('2026-03-08T02:30','America/Chicago')).toThrow();expect(()=>toUTC('2026-11-01T01:30','America/Chicago')).toThrow();expect(new Date(toUTC('2026-10-11T12:00','America/Chicago')).toISOString()).toBe('2026-10-11T17:00:00.000Z');});
it('derives transitions from server time',()=>{const q={closed_at:null,start_at:100,end_at:200,expires_at:300,host_controlled:0};expect(quizState(q,99)).toBe('scheduled');expect(quizState(q,100)).toBe('open');expect(quizState(q,200)).toBe('closed');expect(quizState(q,300)).toBe('expired');});
it('contains the same complete translation keys in six languages',()=>{for(const d of Object.values(dictionaries)){expect(Object.keys(d)).toEqual(Object.keys(dictionaries.en));expect(Object.values(d).every(x=>typeof x==='string'&&x.trim().length>0)).toBe(true);}});
