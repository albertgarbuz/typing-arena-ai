"use client";

import { useState } from "react";
import { calculateTypingMetrics } from "@/lib/typing/engine";

const sample="ровный ритм помогает печатать точнее";

export function MetricDemo(){
  const [typed,setTyped]=useState("");
  const [seconds,setSeconds]=useState(15);
  const hits=[...typed].filter((char,index)=>char===sample[index]).length;
  const metrics=calculateTypingMetrics({targetText:sample,finalBuffer:typed,
    durationSec:seconds,totalAttempts:typed.length,hits,backspaces:0});
  return <section className="document-section"><h2>Попробуй формулу</h2>
    <p>Перепечатай «{sample}» и задай время для примера. Точность здесь считается по текущей строке. В полноценном тесте ошибочные нажатия учитываются даже после исправления.</p>
    <label className="metrics-input">Твой текст<input value={typed} maxLength={sample.length} onChange={event=>setTyped(event.target.value)} /></label>
    <label className="metrics-input">Время в секундах
      <input type="number" min={1} max={120} value={seconds||""} onChange={event=>setSeconds(Math.max(0,Math.min(120,Number(event.target.value))))} />
    </label>
    <p aria-live="polite">{seconds>0 ? <><strong>{metrics.cpm} зн/мин</strong> · {metrics.wpm} слов/мин · точность {metrics.accuracy}%</> : "Введи время от 1 до 120 секунд."}</p>
  </section>;
}
