const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const t=(await (await fetch("http://127.0.0.1:9333/json/list")).json()).find(x=>x.type==="page");
const ws=new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener("open",r));
let id=0;const pend=new Map();
ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}});
const send=(m,p={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}));});
const js=async e=>(await send("Runtime.evaluate",{expression:e,awaitPromise:true,returnByValue:true})).result.value;
await send("Runtime.enable");await send("Page.enable");
const goto=async u=>{await send("Page.navigate",{url:u});await sleep(3800);};
const fill=(sel,v)=>js(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return 'NO EXISTE';
 const P=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 Object.getOwnPropertyDescriptor(P,'value').set.call(el,${JSON.stringify(v)});
 ['input','change','blur'].forEach(e=>el.dispatchEvent(new Event(e,{bubbles:true})));return 'ok';})()`);
const verTitulos=()=>js(`(()=>{const t=document.body.innerText;
 return ['Estado publicada para prueba','Estado programada para prueba','Estado borrador para prueba','Estado archivada para prueba','Semana de festival','Congreso Internacional']
   .filter(x=>t.includes(x)).map(x=>'  ' + x + ': SI').join('\\n') || '  (ninguna visible)';})()`);

console.log("=== A) VISITANTE SIN LOGIN en / ===");
await goto("http://localhost:4300/");
console.log("  url:", await js("location.pathname"), "| pide login?", await js(`location.pathname==='/login'?'SI (expulsado)':'no'`));
console.log("  cuenta activa mostrada:", (await js(`document.body.innerText.match(/Publicaciones guardadas\\s*\\d+/)?.[0] || 'n/d'`)));
console.log(await verTitulos());

console.log("\n=== B) LOGIN COMO ESTUDIANTE ===");
await goto("http://localhost:4300/login");
await fill("input[name=username]","mateo.rios@uniremington.edu.co");
await fill("input[name=password]","Uniremington2026");
await js(`document.querySelector('#submitButton').click();1`);
await sleep(5000);
console.log("  url tras entrar:", await js("location.pathname"));
console.log("  rol en sesion:", await js(`(()=>{try{return JSON.parse(localStorage.getItem('eu_sesion')).usuario?.rol||'n/d'}catch(e){return 'n/d'}})()`));
await goto("http://localhost:4300/");
console.log("  url del tablero:", await js("location.pathname"));
console.log(await verTitulos());
process.exit(0);
