// Paste into javascript_tool once per Gemini page load (eval is blocked by CSP, so it cannot load itself).
// Needs localStorage.__ref = base64 of a ~320 px JPEG of public/bg/parlor.png (style reference); set it once:
//   PY -c "from PIL import Image;import io,base64;im=Image.open('public/bg/parlor.png').convert('RGB');im.thumbnail((320,320));b=io.BytesIO();im.save(b,'JPEG',quality=80);print(base64.b64encode(b.getvalue()).decode())"
// Per image: n0=__n(); await __send(prompt, attachRef); await __wait(n0)   then   await __at(-1)
// __at returns 'B64START...B64END' (about 1 MB): the tool result is saved to a tool-results file; run
//   PY save_b64.py <that file> assets/<faces-src|bg-src|thumbs-src>/<name>.png
// New chat without a reload (helpers survive): await __newchat()
await new Promise(r=>setTimeout(r,4000));
window.__newchat=async()=>{const b=[...document.querySelectorAll('a,button')].find(e=>/Cuộc trò chuyện mới|New chat/i.test((e.getAttribute('aria-label')||'')+e.innerText));if(!b)return 'no newchat';b.click();await new Promise(r=>setTimeout(r,2500));return location.pathname;};
window.__send=async(t,att)=>{const ed=document.querySelector('rich-textarea [contenteditable=true]');ed.focus();
if(att){const b=atob(localStorage.__ref),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
const f=new File([u],'style.jpg',{type:'image/jpeg'});const dt=new DataTransfer();dt.items.add(f);
ed.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));await new Promise(r=>setTimeout(r,5000));}
ed.focus();document.execCommand('insertText',false,t);await new Promise(r=>setTimeout(r,1000));
const bt=[...document.querySelectorAll('button')].find(b=>/Gửi|Send/.test(b.getAttribute('aria-label')||''));if(!bt)return 'no send button';bt.click();return 'sent';};
window.__n=()=>[...document.querySelectorAll('model-response img')].filter(i=>i.naturalWidth>300).length;
window.__wait=async(n0)=>{for(let i=0;i<40;i++){const busy=!!document.querySelector('button[aria-label*="Dừng"],button[aria-label*="Stop"]');if(window.__n()>n0&&!busy)return 'ready '+window.__n();await new Promise(r=>setTimeout(r,1000));}const m=document.querySelectorAll('model-response');return 'waiting: '+(m.length?m[m.length-1].innerText.slice(0,150):'');};
window.__at=async(k)=>{let imgs=[...document.querySelectorAll('model-response img')].filter(i=>i.naturalWidth>300);let im=imgs[k<0?imgs.length+k:k];if(!im)return 'no img';im.scrollIntoView();for(let t=0;t<30&&!im.src.startsWith('blob:');t++){await new Promise(r=>setTimeout(r,500));}
if(!im.src.startsWith('blob:'))return 'not blob';await im.decode().catch(()=>{});const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);const b=await new Promise(r=>c.toBlob(r,'image/png'));const u=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return 'B64START'+btoa(s)+'B64END';};
window.__FACE=`
Big expressive head, a recognizable likeness based on historical portraits, period-accurate hair
and headwear, only the neck and a hint of collar below the head (no body, no hands). calm, neutral expression, mouth closed.
Turned slightly to the viewer's right. Flat 2D cartoon, clean vector lines, soft cel shading,
slightly muted warm palette, matching the art style of the attached background image.
Plain solid pure green background (#00FF00) filling the whole image, nothing else in the picture,
no shadow, no text.`;
window.__BG=`
Full rich color, not sepia and not a pencil sketch: bold dark-brown ink outlines, flat color fills
with soft cel shading, warm saturated palette with deep shadows, like a polished animated cartoon
background (match the attached image's style if one is attached). Detailed period-accurate props.
Eye-level camera. Leave the floor or ground across the lower fifth clear and flat, because cartoon
characters will stand there. No people, no animals, no text or lettering anywhere (blank barrels,
blank signs), no frame or border.`;
'booted';
