import {useRef,useState} from 'react';
import {QRCodeCanvas} from 'qrcode.react';
import {Download,Copy,Check,ScanLine} from 'lucide-react';
import {useI18n} from '../../i18n';

type Level='L'|'M'|'Q'|'H';
const palettes=[
 {name:'qrSage',foreground:'#245b51',background:'#ffffff'},
 {name:'qrClassic',foreground:'#172b2b',background:'#ffffff'},
 {name:'qrOcean',foreground:'#214e68',background:'#f3f8fa'},
 {name:'qrClay',foreground:'#704d3d',background:'#fffaf3'},
] as const;

export function saveQr(canvas:HTMLCanvasElement|null,name:string){
 if(!canvas)return false;
 try{const link=document.createElement('a');link.href=canvas.toDataURL('image/png');link.download=name;document.body.append(link);link.click();link.remove();return true;}catch{return false;}
}

export function QuizQr({url,code}:{url:string;code:string}){
 const {t}=useI18n();const canvas=useRef<HTMLCanvasElement>(null);const [message,setMessage]=useState('');
 return <div className="quiz-qr"><div className="qr-image"><QRCodeCanvas ref={canvas} value={url} size={224} level="H" marginSize={2} fgColor="#245b51" bgColor="#ffffff" role="img" aria-label={t('scanToJoin')}/></div><div className="stack"><h3>{t('scanToJoin')}</h3><p className="muted">{t('qrShareNote')}</p><button className="secondary" type="button" onClick={()=>setMessage(saveQr(canvas.current,`quizora-${code.toLowerCase()}-qr.png`)?'qrDownloaded':'qrDownloadError')}><Download size={18}/>{t('downloadQr')}</button>{message&&<p role="status" className="muted">{t(message)}</p>}</div></div>;
}

export default function QrTool(){
 const {t}=useI18n();const canvas=useRef<HTMLCanvasElement>(null);
 const [value,setValue]=useState(''),[palette,setPalette]=useState(0),[size,setSize]=useState(256),[level,setLevel]=useState<Level>('H'),[margin,setMargin]=useState(true),[message,setMessage]=useState('');
 const trimmed=value.trim();const canRender=!!trimmed&&new TextEncoder().encode(trimmed).length<=900;const colors=palettes[palette];
 async function copy(){try{await navigator.clipboard.writeText(trimmed);setMessage('qrCopied');}catch{setMessage('qrCopyError');}}
 return <div className="workspace qr-workspace"><div className="page-heading"><p className="eyebrow"><ScanLine size={18}/>{t('qrTool')}</p><h1>{t('qrHeading')}</h1><p className="lede">{t('qrIntro')}</p></div><div className="qr-layout"><section className="card stack"><label className="field"><span>{t('qrContent')}</span><textarea rows={4} maxLength={500} value={value} onChange={e=>{setValue(e.target.value);setMessage('');}} placeholder="https://example.com"/></label><p className="muted">{value.length} / 500</p><fieldset className="stack"><legend>{t('qrColors')}</legend><div className="qr-palettes">{palettes.map((p,i)=><button key={p.name} type="button" className={`qr-palette ${i===palette?'selected':''}`} aria-pressed={i===palette} onClick={()=>setPalette(i)}><span className="qr-swatches"><span style={{background:p.foreground}}/><span style={{background:p.background}}/></span>{t(p.name)}</button>)}</div></fieldset><div className="grid two"><label className="field"><span>{t('qrSize')} · {size}px</span><input type="range" min="160" max="400" step="16" value={size} onChange={e=>setSize(Number(e.target.value))}/></label><label className="field"><span>{t('qrCorrection')}</span><select value={level} onChange={e=>setLevel(e.target.value as Level)}><option value="L">L · 7%</option><option value="M">M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option></select></label></div><label className="check"><input type="checkbox" checked={margin} onChange={e=>setMargin(e.target.checked)}/>{t('qrMargin')}</label><p className="muted">{t('qrLocal')}</p></section><section className="card qr-preview-panel"><h2>{t('qrPreview')}</h2><div className="qr-preview-box">{canRender?<QRCodeCanvas ref={canvas} value={trimmed} size={size} level={level} marginSize={margin?2:0} fgColor={colors.foreground} bgColor={colors.background} style={{maxWidth:'100%',height:'auto'}} role="img" aria-label={t('qrPreview')}/>:<div className="qr-empty"><ScanLine size={46}/><p>{t(trimmed?'qrTooLong':'qrEmpty')}</p></div>}</div><div className="qr-actions"><button type="button" disabled={!canRender} onClick={()=>setMessage(saveQr(canvas.current,'qr-code.png')?'qrDownloaded':'qrDownloadError')}><Download size={18}/>{t('downloadQr')}</button><button type="button" className="secondary" disabled={!trimmed} onClick={copy}>{message==='qrCopied'?<Check size={18}/>:<Copy size={18}/ >}{t('qrCopy')}</button></div>{message&&<p role="status" className="muted">{t(message)}</p>}</section></div></div>;
}
