const $ = id => document.getElementById(id);
const text = (tag, str) => Object.assign(document.createElement(tag), {textContent:str});
const user = JSON.parse(localStorage.getItem('typing-arena-current-user') || '{}');
const account = [user.authProvider || 'guest',user.email || user.id || 'guest',user.createdAt || ''].join('/');
const storage = 'typing-arena-club-v1/'+account;
const initial = {friends:{},media:[]};
let state = JSON.parse(localStorage.getItem(storage) || JSON.stringify(initial));
const nickname = String(user.nickname || 'Клавогонщик').slice(0,60);
const cleanMedia = items => (Array.isArray(items)?items:[]).filter(it =>
  it && ['photo','post','story'].includes(it.kind) && Number.isFinite(it.at) && it.at<=Date.now()+60000 &&
  (it.kind!=='story'||it.at+86400000>Date.now()) && typeof it.url==='string' &&
  it.url.length<50000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(it.url)).slice(-7);
function save(){localStorage.setItem(storage,JSON.stringify(state))}
const say = message => {$('status').textContent=message};
const guard = fn => async event => {try{await fn(event)}catch(error){say(error.message||'Не удалось выполнить действие.')}};
const bytes=new TextEncoder(),decode=new TextDecoder();
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const raw=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const digest=async key=>b64(await crypto.subtle.digest('SHA-256',raw(key)));
const algo={name:'ECDSA',namedCurve:'P-256'},signature={name:'ECDSA',hash:'SHA-256'};
let db;
function dbReq(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function loadIdentity(){
 const opening=indexedDB.open('typing-arena-club-keys',1);
 opening.onupgradeneeded=()=>opening.result.createObjectStore('keys');
 db=await dbReq(opening);
 const read=()=>dbReq(db.transaction('keys').objectStore('keys').get(account));
 const found=await read();if(found)return found;
 const pair=await crypto.subtle.generateKey(algo,false,['sign','verify']);
 try{await dbReq(db.transaction('keys','readwrite').objectStore('keys').add(pair,account));return pair}
 catch(error){const existing=await read();if(existing)return existing;throw error}
}
let keys,publicKey,ownId,pc,channel,offerId,expected='',pending,peer,selected,timeout;
const ownMedia=()=>cleanMedia(state.media);
function showMedia(id,list,editable=false){
 const gallery=document.createElement('div');gallery.className='gallery';
 for(const item of cleanMedia(list)){
  const fig=document.createElement('figure'),img=new Image();img.src=item.url;img.className=item.kind;
  img.alt={photo:'Фото профиля',post:'Фото в ленте',story:'Сторис'}[item.kind];
  const view=text('button','');view.className='photo-button';view.setAttribute('aria-label','Открыть · '+img.alt);
  view.onclick=()=>{if(!cleanMedia([item]).length){render();return}
    $('viewer-image').src=item.url;$('viewer-image').alt=img.alt;
    $('viewer-caption').textContent=img.alt+(item.kind==='story'?' · до '+new Date(item.at+86400000).toLocaleString('ru-RU'):'');
    $('viewer').showModal()
  };view.append(img);fig.append(view,text('figcaption',img.alt));
  if(editable){const del=text('button','Удалить');del.onclick=guard(()=>{state.media=state.media.filter(it=>it.at!==item.at);save();render();sendMedia()});fig.append(del)}
  gallery.append(fig)
 }
 $(id).replaceChildren(gallery)
}
async function attach(input){
 const file=input.files[0];input.value='';if(!file)return;
 if(!file.type.startsWith('image/')||file.size>16000000)throw Error('Выбери изображение до 16 МБ.');
 const bitmap=await createImageBitmap(file);
 const size=Math.min(1,320/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*size));canvas.height=Math.max(1,Math.round(bitmap.height*size));
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const url=canvas.toDataURL('image/jpeg',.58);
 if(url.length>=50000)throw Error('Попробуй изображение меньшего размера.');
 const kind=input.dataset.kind;
 const items=ownMedia().filter(it=>it.kind!==kind || kind!=='photo');
 if(items.filter(it=>it.kind===kind).length>=3)throw Error('Удали одно из трёх фото в этом разделе.');
 state.media=[...items,{kind,url,at:Date.now()}];save();render();sendMedia();
}
function render(){
 $('nick').textContent=nickname;showMedia('own',ownMedia(),true);$('friends').replaceChildren();
 for(const [id,friend] of Object.entries(state.friends)){
  const btn=text('button',friend.name+(channel?.readyState==='open'&&peer?.id===id?' · онлайн':''));btn.className='friend';
  btn.onclick=()=>{selected=id;render()};$('friends').append(btn)
 }
 const f=state.friends[selected];$('room').hidden=!f;if(!f){window.dispatchEvent(new Event('typing-club:state'));return}
 $('who').textContent=f.name;showMedia('their',f.media);
 window.dispatchEvent(new Event('typing-club:state'));
 const online=peer?.id===selected&&channel?.readyState==='open';
 $('compose').querySelector('button').disabled=!online;$('message').disabled=!online;
 $('messages').replaceChildren(...f.messages.map(m=>{
  const row=text('p',(m.me?'Вы':f.name)+' · ');
  try{const u=new URL(m.value);if(!['https://albertgarbuz.github.io','https://typing-arena-ai.albert-garbuz89.chatgpt.site'].includes(u.origin))throw Error();
   const a=text('a',m.value);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';row.append(a)}
  catch{row.append(document.createTextNode(m.value))}
  if(m.me)row.append(document.createTextNode(m.ack?' ✓':' · отправлено'));return row
 }));$('messages').scrollTop=$('messages').scrollHeight
}
function fresh(){clearTimeout(timeout);if(pc){pc.onconnectionstatechange=null;channel?.close();pc.close()} channel=null;peer=null;render();
 pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
 const current=pc;pc.onconnectionstatechange=()=>{if(current===pc&&['failed','disconnected'].includes(pc.connectionState))say('Связь прервалась. Создайте новое приглашение.');render()};return pc
}
async function gather(connection){
 if(connection.iceGatheringState!=='complete')await new Promise(resolve=>{
 const done=()=>{clearTimeout(t);connection.removeEventListener('icegatheringstatechange',change);resolve()};
 const change=()=>{if(connection.iceGatheringState==='complete')done()};const t=setTimeout(done,5000);connection.addEventListener('icegatheringstatechange',change)
 });
 return connection.localDescription.sdp
}
async function exportSignal(type,id,sdp,to){
 const payload={type,id,sdp,to,name:nickname,key:publicKey,expires:Date.now()+20*60000};
 const body=bytes.encode(JSON.stringify(payload));
 const sig=await crypto.subtle.sign(signature,keys.privateKey,body);
 $('out').value=location.origin+location.pathname+'#join='+b64(body)+'.'+b64(sig);
 $('outlabel').textContent=type==='offer'?'Приглашение другу':'Ответная ссылка для отправителя';
 $('outbox').hidden=false
}
async function inspect(value){
 const hash=new URL(value.trim()).hash.slice(1);
 if(!hash.startsWith('join=')||hash.length>40000)throw Error('Нужна ссылка-приглашение или ответ из клуба.');
 const [body,sign]=hash.slice(5).split('.');
 const decoded=raw(body),p=JSON.parse(decode.decode(decoded));
 if(!['offer','answer'].includes(p.type)||typeof p.sdp!=='string'||p.sdp.length>20000||
 !/^[a-f0-9-]{36}$/.test(p.id)||typeof p.name!=='string'||p.name.length>60||
 typeof p.key!=='string'||p.key.length!==87||!Number.isFinite(p.expires)||p.expires<=Date.now()||p.expires>Date.now()+21*60000)throw Error('Приглашение устарело или повреждено.');
 const verify=await crypto.subtle.importKey('raw',raw(p.key),algo,false,['verify']);
 if(!await crypto.subtle.verify(signature,verify,raw(sign),decoded))throw Error('Подпись ссылки не подтверждена.');
 p.peerId=await digest(p.key);
 if(p.key===publicKey)throw Error('Это твоя собственная ссылка. Нужна ссылка друга.');
 if(p.type==='offer'&&p.to&&p.to!==await digest(publicKey))throw Error('Приглашение адресовано другому игроку.');
 if(p.type==='answer'&&(!pc||pc.signalingState!=='have-local-offer'||offerId!==p.id||p.to!==await digest(publicKey)||(expected&&expected!==p.peerId)))throw Error('Вставь ответ во вкладке, где создавалось это приглашение.');
 pending=p;$('detail').textContent=p.name+' · '+p.peerId.slice(0,12)+' · '+(p.type==='offer'?'предлагает дружбу и личный чат':'принимает твоё приглашение');
 $('review').hidden=false
}
function transmit(packet){if(channel?.readyState==='open')channel.send(JSON.stringify(packet))}
function sendMedia(){if(channel?.readyState!=='open')return;transmit({kind:'album',ids:ownMedia().map(it=>it.at)});for(const item of ownMedia())transmit({kind:'image',item})}
function bind(dc){
 channel=dc;dc.onopen=()=>{if(dc!==channel||!peer)return;const id=peer.id;state.friends[id]??={name:peer.name,messages:[],media:[]};state.friends[id].name=peer.name;selected=id;save();$('outbox').hidden=true;say('Личный канал открыт. Теперь можно переписываться.');render();sendMedia()};
 dc.onclose=()=>{if(channel!==dc)return;say('Чат отключён. Переписка сохранена на устройстве.');render()};
 dc.onmessage=guard(e=>{if(dc!==channel||!peer||typeof e.data!=='string'||e.data.length>54000)return;
 const f=state.friends[peer.id];if(!f)return;const packet=JSON.parse(e.data);
 if(packet.kind==='sprint'){window.dispatchEvent(new CustomEvent('typing-club:packet',{detail:packet.payload}));return}
 if(packet.kind==='chat'&&typeof packet.value==='string'&&packet.value.length<=1200&&typeof packet.id==='string'&&packet.id.length===36){
 if(!f.messages.some(m=>m.id===packet.id))f.messages.push({id:packet.id,value:packet.value});f.messages=f.messages.slice(-150);save();transmit({kind:'ack',id:packet.id})
 }else if(packet.kind==='ack'){const m=f.messages.find(m=>m.me&&m.id===packet.id);if(m)m.ack=true;save()}
 else if(packet.kind==='album'&&Array.isArray(packet.ids)){f.media=cleanMedia(f.media).filter(it=>packet.ids.includes(it.at));save()}
 else if(packet.kind==='image'){const [item]=cleanMedia([packet.item]);if(item){f.media=cleanMedia([...f.media.filter(it=>it.at!==item.at),item]);save()}}
 render()})
}
async function invite(id=''){const conn=fresh();offerId=crypto.randomUUID();expected=id;bind(conn.createDataChannel('typing-arena'));await conn.setLocalDescription(await conn.createOffer());await exportSignal('offer',offerId,await gather(conn),expected);say('Отправь приглашение другу. Действует 20 минут.')}
$('invite').onclick=guard(()=>invite());
$('reconnect').onclick=guard(()=>invite(selected));
$('accept').onclick=guard(async()=>{const p=pending;if(!p||p.expires<=Date.now())throw Error('Ссылка устарела.');$('review').hidden=true;
 if(p.type==='offer'){const conn=fresh();peer={id:p.peerId,name:p.name};conn.ondatachannel=e=>bind(e.channel);await conn.setRemoteDescription({type:'offer',sdp:p.sdp});await conn.setLocalDescription(await conn.createAnswer());await exportSignal('answer',p.id,await gather(conn),p.peerId);say('Отправь ответ другу. Дружба подтвердится при подключении.')}
 else{peer={id:p.peerId,name:p.name};await pc.setRemoteDescription({type:'answer',sdp:p.sdp});say('Подключение…')}
 clearTimeout(timeout);timeout=setTimeout(()=>{if(channel?.readyState!=='open')say('Соединение пока не установлено. Проверь ответную ссылку. В некоторых сетях прямой канал недоступен.')},20000)
});
$('inspect').onclick=guard(async()=>{pending=null;$('review').hidden=true;await inspect($('incoming').value)});
$('copy').onclick=guard(async()=>{try{await navigator.clipboard.writeText($('out').value);say('Ссылка скопирована.')}catch{$('out').focus();$('out').select();say('Ссылка выделена для копирования.')}});
$('compose').onsubmit=guard(e=>{e.preventDefault();const value=$('message').value.trim();if(!value||channel?.readyState!=='open'||peer?.id!==selected)return;
const id=crypto.randomUUID();transmit({kind:'chat',value,id});const f=state.friends[selected];f.messages.push({me:true,id,value,ack:false});f.messages=f.messages.slice(-150);save();$('message').value='';render()});
$('close-viewer').onclick=()=>$('viewer').close();
$('viewer').onclose=()=>{$('viewer-image').removeAttribute('src')};
$('forget').onclick=guard(()=>{
 const id=selected,friend=state.friends[id];
 if(!friend||!confirm('Удалить '+friend.name+' и локальную историю чата?'))return;
 if(peer?.id===id){channel?.close();pc?.close();channel=null;peer=null}
 delete state.friends[id];selected=null;save();render();say('Друг удалён из этого браузера.')
});
for(const el of document.querySelectorAll('[data-kind]'))el.onchange=guard(()=>attach(el));
window.typingClub={
 getMine:()=>({id:ownId,name:nickname,photo:ownMedia().find(i=>i.kind==='photo')?.url||''}),
 getPeer:()=>channel?.readyState==='open'&&peer?{...peer,photo:cleanMedia(state.friends[peer.id]?.media).find(i=>i.kind==='photo')?.url||''}:null,
 isOnline:()=>channel?.readyState==='open',
 send:payload=>{if(channel?.readyState!=='open')return false;transmit({kind:'sprint',payload});return true}
};
try{keys=await loadIdentity();publicKey=b64(await crypto.subtle.exportKey('raw',keys.publicKey));ownId=await digest(publicKey);render();if(location.hash.startsWith('#join=')){const val=location.href;history.replaceState(null,'',location.pathname);await inspect(val)}}catch(e){say(e.message)}
setInterval(()=>{const album=ownMedia();if(album.length!==state.media.length){state.media=album;save();sendMedia()}render()},60000);
