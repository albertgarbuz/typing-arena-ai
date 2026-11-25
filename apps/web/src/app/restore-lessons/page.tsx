"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, saveUser, type UserProfile } from "@/lib/auth/user";
import { getCourseLevels } from "@/lib/typing/texts";
import { getProgressRaw } from "@/lib/typing/storage";

const digest = "fc8fefb8b50d15fda0c3097a8f201b20bc8dc77987ab2b26c9dbacd456e9af16";
type CreditProfile = UserProfile & { creditedLessons?: string[] };

function redeem() {
  const profile: CreditProfile = getCurrentUser();
  if (!/^(fantom|фантом)7777$/.test(profile.nickname.normalize("NFKC").toLowerCase().replace(/[\s_-]/g, ""))) {
    return "Открой ссылку в браузере, где выбран твой профиль Fantom 7777.";
  }
  const recorded = JSON.parse(getProgressRaw()).completedExercises || {};
  const credits = new Set(profile.creditedLessons || []);
  const missing = getCourseLevels("ru")[0].exercises.slice(0, 3)
    .filter(ex => !credits.has(ex.id) && !(recorded[ex.id]?.accuracy >= ex.minAccuracy));
  if (!missing.length) return "Первые три урока уже зачтены.";
  const xp = profile.xp + 40 * missing.length;
  const next: CreditProfile = {
    ...profile, xp, level: Math.max(profile.level, Math.floor(xp / 200) + 1),
    coins: profile.coins + 20 * missing.length,
    creditedLessons: [...credits, ...missing.map(ex => ex.id)],
  };
  saveUser(next);
  const saved: CreditProfile = getCurrentUser();
  if (!missing.every(ex => saved.creditedLessons?.includes(ex.id))) throw new Error();
  return `Зачтено уроков: ${missing.length}. Получено ${40 * missing.length} XP и ${20 * missing.length} монет.`;
}

export default function RestoreLessons() {
  const [message, setMessage] = useState("Проверяем личную ссылку…");
  useEffect(() => {
    let mounted = true;
    async function apply() {
      const secret = window.location.hash.slice(1);
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
      const actual = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
      if (!mounted) return;
      if (actual !== digest) { setMessage("Открой личную ссылку из сообщения."); return; }
      const result = navigator.locks ? await navigator.locks.request("typing-arena-personal-credit", redeem) : redeem();
      if (mounted) setMessage(result);
    }
    apply().catch(() => { if (mounted) setMessage("Сохранить зачёт не удалось. Проверь доступ браузера к хранилищу и обнови страницу."); });
    return () => { mounted = false; };
  }, []);
  return <main className="layout-container public-card"><section className="campaign-board">
    <h1>Перенос пройденных уроков</h1><p role="status">{message}</p>
    <Link href="/learn" className="button button--primary">К моим урокам →</Link>
  </section></main>;
}
