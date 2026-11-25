"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CAMPAIGN, ACHIEVEMENTS_LIST } from "@/lib/auth/user";
type Card = {n:string; a:string; l:number; t:string; m:Record<string,number>; r:string[]; d:number; h:string[]};
export default function PlayerCard(){
  const [card,setCard]=useState<Card|null>(null);
  useEffect(()=>{
    function load(){
      try{
        const raw=location.hash.slice(1);
        if(raw.length>16000) throw Error();
        const data=JSON.parse(decodeURIComponent(raw));
        if(!["n","a","t"].every(k=>typeof data[k]==="string") ||
          !Number.isSafeInteger(data.l)||!Number.isSafeInteger(data.d)||!Array.isArray(data.r)||!Array.isArray(data.h)||
          !["gold","silver","bronze"].every(k=>Number.isSafeInteger(data.m?.[k]))) throw Error();
        setCard(data);
      }catch{setCard(null)}
    }
    load();window.addEventListener("hashchange",load);return ()=>window.removeEventListener("hashchange",load);
  },[]);
  return <main className="layout-container public-card"><section className="campaign-board">
    <p className="eyebrow">Typing Arena · Карточка игрока</p>
    {card ? <><h1>{card.a} {card.n}</h1><h2>Уровень {card.l} · {card.t}</h2>
    <p>🥇 {card.m.gold}　🥈 {card.m.silver}　🥉 {card.m.bronze}</p>
    <p>Зачётных дней · {card.d}</p>
    <div className="campaign-rewards">{CAMPAIGN.map(s=><article key={s.days} data-owned={card.r.includes(s.avatar)}><span>{s.avatar}</span><h3>{s.name}</h3><small>{card.r.includes(s.avatar)?"Получено":"Закрыто"}</small></article>)}</div>
    <h2>Достижения</h2><ul>{ACHIEVEMENTS_LIST.filter(a=>card.h.includes(a.code)).map(a=><li key={a.code}>{a.icon} {a.title}</li>)}</ul></> : <h1>Открой ссылку из профиля игрока</h1>}
    <Link href="/arena" className="button button--primary">На арену →</Link></section></main>;
}
