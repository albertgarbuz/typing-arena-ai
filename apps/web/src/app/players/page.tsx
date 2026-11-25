"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getUserRaw, getUserServerSnapshot, subscribeUser } from "@/lib/auth/user";
import "./plaza.css";
import { PlayerGlobe } from "./player-globe";

const repo = "albertgarbuz/typing-arena-ai";
const prefix = "[Typing Arena] ";
const kinds = ["Ищу соперника", "Тренируемся вместе", "Моя цель"] as const;
type Kind = typeof kinds[number];
type Card = {id:number; name:string; kind:Kind; note:string; login:string; replies:number; updated:string};
type Issue = {number:number; title:string; body:string|null; user:{login:string}; comments:number; updated_at:string; pull_request?:unknown};
type Watch = Record<string,string>;

function decodeIssue(issue: Issue): Card[] {
  if (issue.pull_request || !issue.title.startsWith(prefix)) return [];
  const kind=kinds.find(k => issue.title.startsWith(prefix+k+" · "));
  if (!kind) return [];
  const name=issue.title.slice((prefix+kind+" · ").length).trim().slice(0,48);
  if(!name) return [];
  return [{id:issue.number,name,kind,note:(issue.body||"").trim().slice(0,320),login:issue.user.login,
    replies:issue.comments,updated:issue.updated_at}];
}
async function loadBoard(signal: AbortSignal) {
  const cards:Card[]=[];
  for(let page=1;;page++){
    const res=await fetch(`https://api.github.com/repos/${repo}/issues?state=open&sort=updated&direction=desc&per_page=100&page=${page}`,{signal});
    if(!res.ok) throw Error();
    const issues:Issue[]=await res.json();
    cards.push(...issues.flatMap(decodeIssue));
    if(issues.length<100) return cards;
  }
}
function readWatch(key:string):Watch {
  try {return JSON.parse(localStorage.getItem(key) || "{}") || {}} catch {return {}}
}
export default function PlayersPage(){
  const raw=useSyncExternalStore(subscribeUser,getUserRaw,getUserServerSnapshot);
  let profile;
  try {profile=JSON.parse(raw)} catch {profile={}}
  const watchKey="typing-arena-plaza-follow-v1/"+[profile.authProvider,profile.id,profile.email,profile.createdAt].join("/");
  const [watch,setWatch]=useState<Watch>({});
  const [cards,setCards]=useState<Card[]>([]);
  const [filter,setFilter]=useState("Все");
  const [search,setSearch]=useState("");
  const [kind,setKind]=useState<Kind>(kinds[0]);
  const [note,setNote]=useState("");
  const [name,setName]=useState<string|null>(null);
  const [view,setView]=useState<"globe"|"list">("globe");
  const [compose,setCompose]=useState(false);
  const [version,refresh]=useState(0);
  const [status,setStatus]=useState("loading");
  useEffect(()=>{setWatch(readWatch(watchKey))},[watchKey]);
  useEffect(()=>{
    const ctrl=new AbortController();
    async function reload(){
      try {const next=await loadBoard(ctrl.signal);if(!ctrl.signal.aborted){setCards(next);setStatus("ready")}}
      catch {if(!ctrl.signal.aborted)setStatus("error")}
    }
    setStatus("loading");void reload();
    const onVisible=()=>{if(document.visibilityState==="visible")void reload()};
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{ctrl.abort();document.removeEventListener("visibilitychange",onVisible)};
  },[version]);
  function updateWatch(card:Card,action:"toggle"|"read"){
    const next={...readWatch(watchKey)};
    const account="@"+card.login;
    if(action==="toggle"){
      if(next[account]) delete next[account]; else next[account]=new Date().toISOString();
    } else next["read-"+card.id]=card.updated;
    setWatch(next);try{localStorage.setItem(watchKey,JSON.stringify(next))}catch{}
  }
  const nick=(name ?? profile.nickname ?? "").trim();
  const postUrl="https://github.com/"+repo+"/issues/new?"+new URLSearchParams({title:prefix+kind+" · "+nick,body:note.trim()});
  const visible=cards.filter(card=>(filter==="Все" || (filter==="Слежу" ? Boolean(watch["@"+card.login]) : card.kind===filter)) &&
    [card.name,card.login,card.note].some(v=>v.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  return <><SiteHeader/><main className="plaza layout-container" id="main-content">
    <header className="plaza-head"><div><h1>Клубная площадь</h1><p>Найди напарника для тренировки, предложи заезд или делись прогрессом на пути к цели.</p></div>
    <button className="button button--primary" aria-expanded={compose} onClick={()=>setCompose(!compose)}>{compose?"Закрыть форму":"＋ Разместить карточку"}</button></header>
    <div className="plaza-view" role="group" aria-label="Вид площади">
      <button aria-pressed={view==="globe"} onClick={()=>setView("globe")}>3D-планета</button>
      <button aria-pressed={view==="list"} onClick={()=>setView("list")}>Список</button>
    </div>
    {view==="globe" && <PlayerGlobe players={visible} select={id=>document.getElementById("player-"+id)?.focus()} />}
    {compose && <section className="plaza-compose"><h2>Открытая карточка</h2>
      <label>Ник игрока<input maxLength={48} value={name??profile.nickname??""} onChange={e=>setName(e.target.value)}/></label>
      <label>Тема<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{kinds.map(k=><option key={k}>{k}</option>)}</select></label>
      <label>Что предложишь игрокам?<textarea rows={3} maxLength={320} value={note} onChange={e=>setNote(e.target.value)} placeholder="Например, ищу напарника на русский спринт по вечерам."/></label>
      <p>В GitHub откроется черновик. После публикации ник, текст и имя аккаунта GitHub увидят все посетители. Закрой запись в GitHub, чтобы убрать её с площади.</p>
      {nick && note.trim() ? <a className="button button--primary" href={postUrl} target="_blank" rel="noreferrer">Открыть черновик в GitHub ↗</a> : <button className="button" disabled>Открыть черновик в GitHub ↗</button>}
    </section>}
    <div className="plaza-tools"><div role="group" aria-label="Фильтр карточек">{["Все",...kinds,"Слежу"].map(k=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{k}</button>)}</div>
      <input type="search" aria-label="Поиск игроков" placeholder="Поиск по нику или тексту" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="plaza-bar"><h2>{filter==="Слежу"?"Мои подписки":"Открытые карточки"}</h2><button onClick={()=>refresh(n=>n+1)}>Обновить</button></div>
    {status==="error" && <p role="status">GitHub временно не вернул список. Можно повторить загрузку или <a href={`https://github.com/${repo}/issues`}>открыть записи в GitHub</a>.</p>}
    {status==="loading" && <p role="status">Загружаем карточки…</p>}
    {status==="ready" && !visible.length && <section className="plaza-empty"><h3>{filter==="Слежу"?"Здесь появятся твои подписки":cards.length?"Карточек по этому запросу пока нет":"Кто выйдет на первый заезд?"}</h3>
      <p>{filter==="Слежу"?"Нажми «Следить за игроком» на его карточке. Здесь появятся его записи, новые ответы и изменения.":cards.length?"Попробуй другой ник или фильтр.":"Площадь открыта. Оставь время, раскладку и дистанцию, чтобы соперник мог ответить."}</p></section>}
    <div className="plaza-grid">{visible.map(c=><article key={c.id} id={"player-"+c.id} tabIndex={-1}><small>{c.kind}</small><h3>{c.name}</h3><span>@{c.login}</span><p>{c.note}</p>
      {watch["@"+c.login] && (watch["read-"+c.id] || watch["@"+c.login])<c.updated && <strong>Есть обновление</strong>}
      <footer><a href={`https://github.com/${repo}/issues/${c.id}`} target="_blank" rel="noreferrer" onClick={()=>{if(watch["@"+c.login])updateWatch(c,"read")}}>Ответы · {c.replies} ↗</a>
      <button aria-pressed={Boolean(watch["@"+c.login])} onClick={()=>updateWatch(c,"toggle")}>{watch["@"+c.login]?"✓ Слежу":"Следить за игроком"}</button></footer></article>)}</div>
    <aside><a href="../club/">Друзья и личный чат →</a><Link href="/arena">На арену →</Link></aside>
  </main><SiteFooter/></>;
}
