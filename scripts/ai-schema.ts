import {z} from 'zod';
import {writeFileSync} from 'node:fs';
import {questionSchema} from '../packages/shared/schema';
writeFileSync('local-ai/question.schema.json',JSON.stringify(z.toJSONSchema(questionSchema,{io:'input'}),null,2)+'\n');
