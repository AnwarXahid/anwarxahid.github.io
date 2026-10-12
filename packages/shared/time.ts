import {Temporal} from '@js-temporal/polyfill';
/** Reject DST folds and gaps: creators must choose an unambiguous local time. */
export function toUTC(local:string,zone:string){return Temporal.PlainDateTime.from(local).toZonedDateTime(zone,{disambiguation:'reject'}).epochMilliseconds;}
export function quizState(q:{closed_at:number|null;start_at:number|null;end_at:number|null;expires_at:number;host_controlled:number},now:number){
 if(now>=q.expires_at)return 'expired';
 if(q.closed_at!==null||(q.end_at!==null&&now>=q.end_at))return 'closed';
 if(q.start_at===null&&q.host_controlled)return 'published';
 if(q.start_at!==null&&now<q.start_at)return 'scheduled';
 return 'open';
}
