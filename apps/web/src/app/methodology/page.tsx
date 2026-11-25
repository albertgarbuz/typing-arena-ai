import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MetricDemo } from "./metric-demo";

export const metadata: Metadata = {
  title: "Методика подсчёта результатов",
  description: "Как Typing Arena считает скорость и точность печати.",
};

export default function MethodologyPage() {
  return <><SiteHeader /><main id="main-content" className="document-page">
    <div className="container document-shell">
      <h1 className="document-title">Как считаются результаты</h1>
      <p className="document-lead">В тесте скорости таймер запускается с первого символа. Когда заканчивается время, результат сохраняется в статистике профиля в этом браузере.</p>
      <div className="hero__actions">
        <Link href="/test" className="button button--primary">Проверить скорость</Link>
        <Link href="/stats" className="button button--secondary">Моя статистика</Link>
      </div>
      <section className="document-section">
        <h2>Скорость и точность</h2>
        <dl>
          <dt><strong>Знаков в минуту (CPM)</strong></dt>
          <dd>Число знаков, совпавших с заданием на своих позициях, умножается на 60 и делится на время в секундах. Пробелы тоже считаются.</dd>
          <dt><strong>Слов в минуту (WPM)</strong></dt>
          <dd>Скорость в знаках делится на пять. Это стандартное условное слово.</dd>
          <dt><strong>Точность</strong></dt>
          <dd>Доля верных нажатий в процентах. Backspace помогает исправить текст, но исходная ошибка остаётся в точности попытки.</dd>
        </dl>
        <p>Например, 90 верных знаков за 30 секунд дают 180 зн/мин и 36 слов/мин. Если 90 из 100 нажатий были верными, точность составит 90%.</p>
      </section>
      <MetricDemo />
      <section className="document-section">
        <h2>Заезды</h2>
        <p>В дружеском спринте клуба оба игрока набирают один текст. Побеждает тот, у кого за 30 секунд больше верных знаков. При равном счёте засчитывается ничья.</p>
        <Link href="/arena">Открыть арену →</Link>
      </section>
    </div>
  </main><SiteFooter /></>;
}
