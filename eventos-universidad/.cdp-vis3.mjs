const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const t=(await (await fetch("http://127.0.0.1:9333/json/list")).json()).find(x=>x.type==="page");
const ws=new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener("open",r));
let id=0;const pend=new Map();
ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}});
const send=(m,p={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}));});
const js=async e=>{const r=await send("Runtime.evaluate",{expression:e,awaitPromise:true,returnByValue:true});
 if(r.exceptionDetails)return 'JS ERROR: '+(r.exceptionDetails.exception?.description||'').slice(0,110);return r.result.value;};
await send("Runtime.enable");await send("Page.enable");
const goto=async u=>{await send("Page.navigate",{url:u});await sleep(3800);};
const fill=(sel,v)=>js(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return 'NO EXISTE';
 const P=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 Object.getOwnPropertyDescriptor(P,'value').set.call(el,${JSON.stringify(v)});
 ['input','change','blur'].forEach(e=>el.dispatchEvent(new Event(e,{bubbles:true})));return 'ok';})()`);
const ver=()=>js(`(()=>{const t=document.body.innerText;const L=['Estado publicada para prueba','Estado programada para prueba','Estado borrador para prueba','Estado archivada para prueba','Semana de festival','Congreso Internacional'];
 const vis=L.filter(x=>t.includes(x));return vis.length+'/6 -> '+vis.map(s=>s.replace('Estado ','').replace(' para prueba','')).join(', ');})()`);
const login=async(correo)=>{await goto("http://localhost:4300/login");
 await fill("input[name=username]",correo);await fill("input[name=password]","Uniremington2026");
 await js(`document.querySelector('#submitButton').click();1`);await sleep(5000);};
const salir=()=>js(`localStorage.removeItem('eu_sesion');location.href='/';1`);

console.log("=== 1) VISITANTE (sin usuario ni contrasena) ===");
await salir(); await sleep(3000);
console.log("  url:", await js("location.pathname"), "| pidio login?", await js(`location.pathname==='/login'?'SI':'no'`));
console.log("  " + await ver());

console.log("\n=== 2) ESTUDIANTE ===");
await login("mateo.rios@uniremington.edu.co");
console.log("  url tras entrar:", await js("location.pathname"), "| rol:", await js(`(()=>{try{return JSON.parse(localStorage.getItem('eu_sesion')).usuario.rol}catch(e){return 'n/d'}})()`));
console.log("  " + await ver());

console.log("\n=== 3) DOCENTE ===");
await login("juanpabon@uniremington.edu.co");
console.log("  url tras entrar:", await js("location.pathname"));
console.log("  " + await ver());

console.log("\n=== 4) ADMIN (debe ver tambien el borrador) ===");
await login("admin@uniremington.edu.co");
console.log("  url tras entrar:", await js("location.pathname"));
console.log("  " + await ver());
await goto("http://localhost:4300/admin/publicaciones");
console.log("  panel admin: " + await js(`document.body.innerText.includes('Estado borrador para prueba')?'SI ve el borrador':'NO ve el borrador'`));
process.exit(0);
