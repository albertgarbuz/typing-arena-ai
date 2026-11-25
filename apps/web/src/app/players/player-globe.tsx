"use client";

import { useEffect, useRef, useState } from "react";

const latitudes = Array.from({length:15}, (_,i) =>
  Array.from({length:45}, (_,j) => {
    const lat = (i+1)*Math.PI/16 - Math.PI/2;
    const lon = j*Math.PI*2/45;
    return [Math.cos(lat)*Math.sin(lon), Math.sin(lat), Math.cos(lat)*Math.cos(lon)];
  })
);

export function PlayerGlobe({players, select}: {
  players: {id:number; name:string}[];
  select: (id:number)=>void;
}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const angle=useRef(.28);
  const pitch=useRef(-.14);
  const pointer=useRef<{x:number;y:number}|null>(null);
  const [running,setRunning]=useState(true);
  useEffect(()=>{
    const surface=canvas.current;
    const ctx=surface?.getContext("2d");
    if(!surface || !ctx)return;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame=0;
    let visible=true;
    let previous=0;
    let width=0,height=0;
    let lastPaint="";
    function render(now:number){
      if(!surface || !ctx || !visible)return;
      frame=requestAnimationFrame(render);
      if(width<1 || height<1 || now-previous<29)return;
      if(running && !motion.matches && !pointer.current && previous)
        angle.current+=Math.min(now-previous,40)*.00019;
      previous=now;
      const view=[width,height,angle.current,pitch.current].join("/");
      if(view===lastPaint)return;
      lastPaint=view;
      const r=Math.min(width*.43,height*.41);
      const cx=width/2,cy=height/2;
      const c=Math.cos(angle.current),s=Math.sin(angle.current);
      const cp=Math.cos(pitch.current),sp=Math.sin(pitch.current);
      ctx.clearRect(0,0,width,height);
      for(let i=0;i<2;i++){
        ctx.beginPath();ctx.ellipse(cx,cy,Math.min(width*.48,r*(1.19+i*.16)),r*(.32+i*.21),-.29+i*.64,0,Math.PI*2);
        ctx.strokeStyle=i?"#5396ce50":"#69ebca66";ctx.setLineDash([3,6]);ctx.stroke();ctx.setLineDash([]);
      }
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
      const glow=ctx.createRadialGradient(cx-r*.27,cy-r*.44,r*.1,cx,cy,r);
      glow.addColorStop(0,"#13415c");glow.addColorStop(.81,"#091c32");glow.addColorStop(1,"#155474");
      ctx.fillStyle=glow;ctx.fill();ctx.strokeStyle="#74e8ed88";ctx.stroke();
      const space=latitudes.map(row=>row.map(([x,y,z])=>{
        const depth=z*c-x*s;
        const front=depth*cp+y*sp;
        const scale=r*(1+front*.05);
        return {x:cx+(x*c+z*s)*scale,y:cy+(y*cp-depth*sp)*scale,front};
      }));
      for(const [i,row] of space.entries()){
        for(const [j,dot] of row.entries()){
          if(dot.front<0)continue;
          const neighbours=[row[(j+1)%row.length],space[i+1]?.[j],space[i+1]?.[(j+1)%row.length]];
          ctx.strokeStyle="rgba(71,209,245,"+(.08+.28*dot.front)+")";
          ctx.beginPath();
          for(const next of neighbours){if(next?.front>=0){ctx.moveTo(dot.x,dot.y);ctx.lineTo(next.x,next.y)}}
          ctx.stroke();
          const spark=(i*19+j*37)%31===0;
          ctx.fillStyle=spark?"#abffed":"rgba(90,223,253,"+(.20+.7*dot.front)+")";
          ctx.beginPath();ctx.arc(dot.x,dot.y,spark?2.35:1,0,Math.PI*2);ctx.fill();
        }
      }
    }
    const resize=new ResizeObserver(()=>{
      const ratio=Math.min(devicePixelRatio,2);
      width=surface.clientWidth;height=surface.clientHeight;
      surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);lastPaint="";
    });
    const observer=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      cancelAnimationFrame(frame);
      previous=0;
      if(visible)frame=requestAnimationFrame(render);
    });
    resize.observe(surface);observer.observe(surface);
    return ()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect()};
  },[running]);

  return <div className="globe-panel">
    <div className="globe-stage">
      <canvas ref={canvas} aria-label="Планета из частиц. Вращай её свайпом или стрелками."
        tabIndex={0} onKeyDown={e=>{
          if(e.key==="ArrowLeft" || e.key==="ArrowRight"){
            e.preventDefault();angle.current+=e.key==="ArrowLeft"?-.24:.24;
          }
        }}
        onPointerDown={e=>{pointer.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}}
        onPointerMove={e=>{
          if(!pointer.current)return;
          angle.current+=(e.clientX-pointer.current.x)*.009;
          pitch.current=Math.max(-1.15,Math.min(1.15,pitch.current+(e.clientY-pointer.current.y)*.006));
          pointer.current={x:e.clientX,y:e.clientY};
        }}
        onLostPointerCapture={()=>{pointer.current=null}} />
      {players.slice(0,6).map((player,i)=><button className="globe-marker" type="button" key={player.id}
        style={{left:(i%2?80:20)+"%",top:(24+Math.floor(i/2)*25)+"%"}} onClick={()=>select(player.id)}>
        {player.name}
      </button>)}
    </div>
    <footer className="globe-footer">
      <span>{players.length ? "Выбери имя, чтобы открыть карточку" : "Здесь появятся узлы открытых карточек"}</span>
      <button type="button" aria-pressed={running} onClick={()=>setRunning(!running)}>Автовращение {running?"вкл.":"выкл."}</button>
    </footer>
  </div>;
}
