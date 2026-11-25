// A match lives inside an already accepted friend's encrypted channel.
export function createSprint(host, send, getPlayers) {
  const texts = [
    "город ещё спит но в одном окне уже горит свет за стеклом тихо кружится снег и с первым стуком клавиш начинается новый день ",
    "вечером мы вышли к озеру сосны отражались в воде а на другом берегу кто то зажёг фонарь на минуту весь мир стал тише ",
    "у каждого свой ритм сначала пальцы ищут клавишу потом запоминают движение и однажды целая строка появляется почти сама собой "
  ];
  let game = null;
  let timer;
  let enabled = false;
  const make = (tag, text) => Object.assign(document.createElement(tag), {textContent:text});
  const status = make("p", "");
  status.setAttribute("role","status");
  const faces = make("div", "");
  faces.className = "sprint-faces";
  const passage = make("p", "");
  const input = document.createElement("textarea");
  input.placeholder = "Набирай текст после старта";
  input.setAttribute("aria-label","Текст дружеского спринта");
  const action = make("button","Вызвать на спринт · 30 с");
  action.type = "button";
  host.append(make("h3","Дружеский спринт"),faces,status,passage,input,action);
  function avatars() {
    faces.replaceChildren();
    for (const player of getPlayers()) {
      const el=make("span",player.name);
      if (player.photo && /^data:image\/(jpeg|png|webp);base64,/i.test(player.photo)) {
        const img=new Image();img.alt="";img.width=44;img.height=44;img.src=player.photo;
        el.prepend(img);
      }
      faces.append(el);
    }
  }
  function reset() {
    clearInterval(timer);game=null;passage.textContent="";input.value="";
    input.hidden=true;input.disabled=true;faces.replaceChildren();status.textContent="";
    action.textContent="Вызвать на спринт · 30 с";action.disabled=!enabled;action.hidden=false;
  }
  function updateResult() {
    if (game?.own===undefined || game.other===undefined) return;
    status.textContent=(game.own===game.other?"Ничья":game.own>game.other?"Ты победил":"Соперник победил")+
      " · верных знаков "+game.own+" : "+game.other;
    action.hidden=false;action.disabled=false;action.textContent="Реванш";
  }
  function start() {
    const current=game;
    current.phase="countdown";avatars();action.hidden=true;input.hidden=false;input.disabled=true;
    passage.textContent=texts[current.text].repeat(8);
    passage.style.maxHeight="6.4em";passage.style.overflow="auto";
    passage.scrollTop=0;
    const starts=performance.now()+3000;
    const ends=starts+30000;
    const tick=()=>{
      const now=performance.now();
      if(now<starts){status.textContent="Старт через "+Math.ceil((starts-now)/1000);return}
      if(now>=ends){
        clearInterval(timer);input.disabled=true;current.phase="done";
        current.own=Array.from(input.value).filter((c,i)=>c===passage.textContent[i]).length;
        status.textContent="Твой результат: "+current.own+" верных знаков. Ждём результат друга.";
        send({op:"score",id:current.id,value:current.own});updateResult();return;
      }
      if(current.phase==="countdown"){current.phase="running";input.disabled=false;input.focus()}
      status.textContent="До финиша "+Math.ceil((ends-now)/1000)+" с";
    };
    tick();timer=setInterval(tick,175);
  }
  input.addEventListener("paste",e=>e.preventDefault());
  input.addEventListener("drop",e=>e.preventDefault());
  action.onclick=()=>{
    if(!enabled)return;
    if(game?.phase==="invited"){
      send({op:"accept",id:game.id});action.disabled=true;status.textContent="Ожидаем старт";return;
    }
    reset();
    game={id:crypto.randomUUID(),text:Math.floor(Math.random()*texts.length),phase:"waiting"};
    avatars();send({op:"invite",id:game.id,text:game.text});action.disabled=true;status.textContent="Вызов отправлен";
  };
  reset();
  return {
    refresh:avatars,
    connected(value){enabled=Boolean(value);reset();host.hidden=!enabled;if(enabled)avatars()},
    receive(msg) {
      if(!enabled||!msg||typeof msg.id!=="string"||msg.id.length>60)return;
      if(msg.op==="invite" && Number.isInteger(msg.text) && texts[msg.text] &&
        (!game||game.phase==="done"||(game.phase==="waiting" && msg.id<game.id))){
        reset();game={id:msg.id,text:msg.text,phase:"invited"};avatars();
        action.textContent="Принять вызов";status.textContent="Друг приглашает на спринт";return;
      }
      if(!game||game.id!==msg.id)return;
      if(msg.op==="accept"&&game.phase==="waiting"){send({op:"start",id:game.id});start()}
      else if(msg.op==="start"&&game.phase==="invited"){start()}
      else if(msg.op==="score"&&["running","done"].includes(game.phase)&&Number.isInteger(msg.value)&&msg.value>=0&&msg.value<=texts[game.text].length*8){game.other=msg.value;updateResult()}
    }
  };
}

const host = document.getElementById("club-sprint");
if (host) {
  const club = () => window.typingClub;
  const match = createSprint(host,payload=>club()?.send(payload),()=>[club()?.getMine(),club()?.getPeer()].filter(Boolean));
  let active = null;
  const sync = () => {
    const id = club()?.getPeer()?.id || null;
    if (active !== id) {active=id;match.connected(id)}
    if (id) match.refresh?.();
  };
  window.addEventListener("typing-club:state",sync);
  window.addEventListener("typing-club:packet",e=>match.receive(e.detail));
  sync();
}
