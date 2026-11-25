"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import {
  IconArrowDown,
  IconArrowRight,
  IconBars,
  IconBook,
  IconChat,
  IconCheck,
  IconClock,
  IconGlobe,
  IconInfo,
  IconKeyboard,
  IconLayers,
  IconRepeat,
  IconRoute,
  IconShield,
  IconTarget,
  IconUsers,
} from "@/components/icons";

/* -------------------------------------------------------------------------- */
/*  Keyboard model (decorative illustration, NOT a working trainer)           */
/* -------------------------------------------------------------------------- */

type Finger = "pinky" | "ring" | "middle" | "index" | "thumb";
type Hand = "left" | "right" | "both";

interface KeyDef {
  label: string;
  finger: Finger;
  hand: Hand;
  home?: boolean;
  anchor?: boolean;
  mod?: boolean;
  space?: boolean;
}

interface KeyRow {
  id: "top" | "home" | "bottom" | "space";
  keys: KeyDef[];
}

/** Standard ten-finger zones for a letter row, left to right. */
const ROW_FINGERS: Finger[] = [
  "pinky",
  "ring",
  "middle",
  "index",
  "index",
  "index",
  "index",
  "middle",
  "ring",
  "pinky",
  "pinky",
  "pinky",
];

const HOME_LEFT_FINGERS: Finger[] = ["pinky", "ring", "middle", "index"];
const HOME_RIGHT_FINGERS: Finger[] = ["index", "middle", "ring", "pinky"];

function letterKeys(letters: string, homeKeys = "", anchorKeys = ""): KeyDef[] {
  return Array.from(letters).map(
    (label, index): KeyDef => ({
      label,
      finger: ROW_FINGERS[index] ?? "pinky",
      hand: index < 5 ? "left" : "right",
      home: homeKeys.includes(label),
      anchor: anchorKeys.includes(label),
    }),
  );
}

function modKey(label: string, hand: "left" | "right"): KeyDef {
  return { label, finger: "pinky", hand, mod: true };
}

const HERO_ROWS: KeyRow[] = [
  { id: "top", keys: [modKey("Tab", "left"), ...letterKeys("ЙЦУКЕНГШЩЗХЪ")] },
  {
    id: "home",
    keys: [
      modKey("Caps", "left"),
      ...letterKeys("ФЫВАПРОЛДЖЭ", "ФЫВАОЛДЖ", "АО"),
      modKey("Enter", "right"),
    ],
  },
  {
    id: "bottom",
    keys: [modKey("Shift", "left"), ...letterKeys("ЯЧСМИТЬБЮ."), modKey("Shift", "right")],
  },
  { id: "space", keys: [{ label: "пробел", finger: "thumb", hand: "both", space: true }] },
];

function keycapClassName(key: KeyDef): string {
  return [
    "keycap",
    `keycap--finger-${key.finger}`,
    `keycap--hand-${key.hand}`,
    key.home ? "keycap--home" : null,
    key.anchor ? "keycap--anchor" : null,
    key.mod ? "keycap--mod" : null,
    key.space ? "keycap--space" : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function Keycap({ keyDef }: { keyDef: KeyDef }) {
  return (
    <span className={keycapClassName(keyDef)}>
      <span className="keycap__label">{keyDef.label}</span>
      {keyDef.anchor ? <span className="keycap__bump" /> : null}
    </span>
  );
}

const FINGER_LEGEND: { finger: Finger; label: string }[] = [
  { finger: "pinky", label: "Мизинцы" },
  { finger: "ring", label: "Безымянные" },
  { finger: "middle", label: "Средние" },
  { finger: "index", label: "Указательные" },
  { finger: "thumb", label: "Большие — пробел" },
];

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner layout-container">
        <div className="hero__content">
          <div className="hero__meta">
            <p className="hero__eyebrow">ТОЧНОСТЬ. РИТМ. СВОБОДА.</p>
            <p className="stage-badge">
              <span className="stage-badge__dot" aria-hidden="true" />
              Этап 1 · знакомство с платформой
            </p>
          </div>

          <h1 id="hero-title" className="hero__title">
            <span className="hero__title-line">Печатай быстрее.</span>{" "}
            <span className="hero__title-line">Думай свободнее.</span>{" "}
            <span className="hero__title-line hero__title-line--accent">Побеждай сильнейших.</span>
          </h1>

          <p className="hero__subtitle">
            Научись слепой десятипальцевой печати с персональным AI-тренером, отслеживай прогресс
            и соревнуйся с пользователями со всего мира
          </p>

          <div className="hero__actions">
            <Link className="button button--primary" href="/test">
              <span>Проверить скорость</span>
              <IconArrowRight className="button__icon" size={18} />
            </Link>
            <a className="button button--secondary" href="#program">
              <span>Посмотреть программу</span>
              <IconArrowDown className="button__icon" size={18} />
            </a>
            <Link className="button button--secondary" href="/learn">
              <span>Начать обучение</span>
            </Link>
          </div>

          <p className="hero__note">
            <IconInfo className="hero__note-icon" size={18} />
            <span>
              Интерактивный тренажёр запущен: вы можете пройти тест скорости, тренировать частые слова
              или начать пошаговый курс обучения ЙЦУКЕН и QWERTY.
            </span>
          </p>
        </div>

        <HeroKeyboard />
      </div>
    </section>
  );
}

function HeroKeyboard() {
  const [typed, setTyped] = useState("");
  const [pressed, setPressed] = useState<KeyDef | null>(null);
  const demo = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const release = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const manual = useRef(false);
  const frame = useRef<HTMLElement>(null);
  function strike(key: KeyDef) {
    const cap = frame.current?.querySelector<HTMLButtonElement>(`[data-letter="${key.label}"]`);
    const display = frame.current?.querySelector(".typing-display");
    if (cap && display && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const start = cap.getBoundingClientRect();
      const target = display.getBoundingClientRect();
      const dx = target.left + target.width * .72 - start.left - start.width / 2;
      const dy = target.top + target.height / 2 - start.top - start.height / 2;
      const glyph = document.createElement("i");
      glyph.className = "flying-letter";
      glyph.textContent = key.space ? "␣" : key.label;
      glyph.setAttribute("aria-hidden", "true");
      cap.appendChild(glyph);
      const flight = glyph.animate([
        { transform:"translate(-50%, -50%) scale(.8)", opacity:0 },
        { transform:`translate(calc(-50% + ${dx*.22}px), calc(-50% + ${dy*.55}px)) skew(-12deg)`, opacity:1, offset:.4 },
        { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.75)`, opacity:0 }
      ], {duration:470, easing:"ease-out"});
      flight.onfinish = () => glyph.remove();
    }
    clearTimeout(release.current);
    setPressed(key);
    release.current = setTimeout(() => setPressed(null), 150);
  }
  function playKey(key: KeyDef) {
    clearInterval(demo.current);
    const append = manual.current;
    setTyped(previous => ((append ? previous : "") + (key.space ? " " : key.label)).slice(-24));
    manual.current = true;
    strike(key);
  }
  useEffect(() => {
    const keys = HERO_ROWS.flatMap(row => row.keys).filter(key => !key.mod);
    const phrase = "АРЕНА ПЕЧАТИ";
    function replay() {
      clearInterval(demo.current);
      clearTimeout(release.current);
      manual.current = false;
      setPressed(null);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setTyped(phrase);
        return;
      }
      setTyped("");
      let position = 0;
      demo.current = setInterval(() => {
        const letter = phrase[position++];
        const key = keys.find(item => item.label === (letter === " " ? "пробел" : letter));
        if (key) strike(key);
        setTyped(phrase.slice(0, position));
        if (position === phrase.length) clearInterval(demo.current);
      }, 205);
    }
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey ||
          (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable=true]"))) return;
      const bounds = frame.current?.getBoundingClientRect();
      if (!bounds || bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      if (event.key === " " && event.target instanceof Element && event.target.closest("button,a")) return;
      const key = keys.find(item => item.label === (event.key === " " ? "пробел" : event.key.toUpperCase()));
      if (key) playKey(key);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        if (!manual.current) replay();
      }
    });
    if (frame.current) observer.observe(frame.current);
    window.addEventListener("typing-arena:replay", replay);
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(demo.current);
      clearTimeout(release.current);
      observer.disconnect();
      window.removeEventListener("typing-arena:replay", replay);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <figure className="hero-visual" ref={frame}>
      <div className="hero-visual__frame">
        <div className="hero-visual__topbar" aria-hidden="true">
          <span className="hero-visual__layout">ЙЦУКЕН</span>
          <span className="hero-visual__hint">основной ряд · опора на А и О</span>
        </div>

        <div className="typing-display" aria-label="Набранный текст">{typed}<i aria-hidden="true" /></div>
        <div className="keyboard keyboard--hero" aria-label="Русская клавиатура">
          {HERO_ROWS.map((row) => (
            <div key={row.id} className={`keyboard__row keyboard__row--${row.id}`}>
              {row.keys.map((keyDef, index) => (
                keyDef.mod ? <Keycap key={index} keyDef={keyDef} /> :
                <button key={index} type="button" className={keycapClassName(keyDef)} data-letter={keyDef.label} data-pressed={pressed === keyDef}
                  onClick={() => playKey(keyDef)}>{keyDef.label}</button>
              ))}
            </div>
          ))}
        </div>

        <div className="finger-map" aria-hidden="true" data-hand={pressed?.hand} data-finger={pressed?.finger}>
          <div className="finger-map__hand finger-map__hand--left">
            {HOME_LEFT_FINGERS.map((finger) => (
              <span key={finger} className={`finger-map__finger finger-map__finger--${finger}`} />
            ))}
            <span className="finger-map__finger finger-map__finger--thumb" />
            <span className="finger-map__hand-label">левая</span>
          </div>
          <div className="finger-map__hand finger-map__hand--right">
            <span className="finger-map__finger finger-map__finger--thumb" />
            {HOME_RIGHT_FINGERS.map((finger) => (
              <span key={finger} className={`finger-map__finger finger-map__finger--${finger}`} />
            ))}
            <span className="finger-map__hand-label">правая</span>
          </div>
        </div>

        <ul className="finger-legend" aria-label="Цветовые зоны пальцев">
          {FINGER_LEGEND.map((item) => (
            <li
              key={item.finger}
              className={`finger-legend__item finger-legend__item--${item.finger}`}
            >
              <span className="finger-legend__swatch" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <figcaption className="hero-visual__caption">
        <span className="hero-visual__caption-title">Попробуй напечатать своё имя</span>
        <span className="hero-visual__caption-text">Печатай в русской раскладке или нажимай клавиши на экране. Подсветка покажет, каким пальцем нажимать.</span>
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature strip                                                              */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    id: "touch",
    Icon: IconKeyboard,
    title: "Слепая печать с нуля",
    text: "От посадки и основного ряда до уверенного связного текста.",
  },
  {
    id: "layouts",
    Icon: IconGlobe,
    title: "Русская и английская раскладки",
    text: "ЙЦУКЕН и QWERTY — две независимые программы, прогресс по каждой отдельно.",
  },
  {
    id: "metrics",
    Icon: IconTarget,
    title: "Прозрачные метрики",
    text: "CPM, WPM и точность считаются по открытой методике.",
  },
  {
    id: "fair",
    Icon: IconShield,
    title: "Честная арена",
    text: "Платформа не будет выдавать своих ботов за живых соперников.",
  },
] as const;

function FeatureStrip() {
  return (
    <section className="feature-strip" aria-labelledby="feature-strip-title">
      <div className="layout-container">
        <h2 id="feature-strip-title" className="sr-only">
          Принципы платформы
        </h2>
        <ul className="feature-strip__list">
          {FEATURES.map(({ id, Icon, title, text }) => (
            <li key={id} className="feature-strip__item">
              <span className="feature-strip__icon">
                <Icon size={22} />
              </span>
              <div className="feature-strip__body">
                <h3 className="feature-strip__title">{title}</h3>
                <p className="feature-strip__text">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Program (#program) — interactive RU / EN layout switch                     */
/* -------------------------------------------------------------------------- */

type LayoutId = "ru" | "en";

interface CourseLayout {
  id: LayoutId;
  code: string;
  name: string;
  tabLabel: string;
  courseLabel: string;
  lang: "ru" | "en";
  homeLeft: string[];
  homeRight: string[];
  anchors: string[];
  anchorsText: string;
  sample: string;
  description: string;
  firstWords: string;
}

const LAYOUT_ORDER: LayoutId[] = ["ru", "en"];

const COURSE_LAYOUTS: Record<LayoutId, CourseLayout> = {
  ru: {
    id: "ru",
    code: "RU",
    name: "ЙЦУКЕН",
    tabLabel: "Русская раскладка",
    courseLabel: "Курс русской раскладки · ЙЦУКЕН",
    lang: "ru",
    homeLeft: ["Ф", "Ы", "В", "А"],
    homeRight: ["О", "Л", "Д", "Ж"],
    anchors: ["А", "О"],
    anchorsText: "А и О",
    sample: "фыва олдж",
    description:
      "Левая рука лежит на ФЫВА, правая — на ОЛДЖ. Указательные пальцы находят А и О по выступам: с этой позиции начинается каждое движение, и сюда же пальцы возвращаются.",
    firstWords: "вода, лава, жало, два",
  },
  en: {
    id: "en",
    code: "EN",
    name: "QWERTY",
    tabLabel: "Английская раскладка",
    courseLabel: "Курс английской раскладки · QWERTY",
    lang: "en",
    homeLeft: ["A", "S", "D", "F"],
    homeRight: ["J", "K", "L", ";"],
    anchors: ["F", "J"],
    anchorsText: "F и J",
    sample: "asdf jkl;",
    description:
      "Левая рука лежит на ASDF, правая — на JKL;. Указательные пальцы находят F и J по выступам: с этой позиции начинается каждое движение, и сюда же пальцы возвращаются.",
    firstWords: "ask, fall, salad, flask",
  },
};

interface ProgramStage {
  id: string;
  title: string;
  text: string;
  kind: "keys" | "fragments";
  sample: Record<LayoutId, string[]>;
  /** false → chips are Russian descriptors, identical for both layouts (no `lang` switch). */
  localized?: boolean;
}

/** Exactly ten course levels, in order (approved product spec). */
const PROGRAM_STAGES: ProgramStage[] = [
  {
    id: "hand-position",
    title: "Правильное положение рук",
    text: "Посадка, положение кистей и опорные клавиши с выступами. Пальцы учатся находить позицию вслепую и возвращаться на неё.",
    kind: "keys",
    sample: { ru: ["А", "О"], en: ["F", "J"] },
  },
  {
    id: "home-row",
    title: "Основной ряд",
    text: "Все клавиши основного ряда, включая центральные под указательными пальцами. Ладони остаются на месте.",
    kind: "keys",
    sample: { ru: ["ФЫВА", "ПР", "ОЛДЖЭ"], en: ["ASDF", "GH", "JKL;'"] },
  },
  {
    id: "top-row",
    title: "Верхний ряд",
    text: "Движение вверх и обязательный возврат на основной ряд — без взгляда на клавиши.",
    kind: "keys",
    sample: { ru: ["ЙЦУКЕ", "НГШЩЗХЪ"], en: ["QWERT", "YUIOP[]"] },
  },
  {
    id: "bottom-row",
    title: "Нижний ряд",
    text: "Короткий ход вниз без поворота кисти и смещения ладони.",
    kind: "keys",
    sample: { ru: ["ЯЧСМИ", "ТЬБЮ."], en: ["ZXCVB", "NM,./"] },
  },
  {
    id: "capitals",
    title: "Заглавные буквы",
    text: "Shift нажимает мизинец противоположной руки — так ритм не сбивается.",
    kind: "keys",
    sample: { ru: ["Shift", "А–Я"], en: ["Shift", "A–Z"] },
  },
  {
    id: "numbers-symbols",
    title: "Цифры и символы",
    text: "Цифровой ряд, знаки препинания и символы. Опора на основной ряд сохраняется и здесь.",
    kind: "keys",
    sample: { ru: ["1–0", "!", "?", "№", "%"], en: ["1–0", "!", "?", "@", "#"] },
  },
  {
    id: "simple-words",
    title: "Простые слова",
    text: "Короткие частые слова из уже изученных клавиш — первый переход от букв к словам.",
    kind: "fragments",
    sample: { ru: ["вода", "рука", "поле"], en: ["hand", "fall", "desk"] },
  },
  {
    id: "complex-words",
    title: "Сложные слова",
    text: "Длинные слова, редкие буквосочетания и неудобные переходы между пальцами.",
    kind: "fragments",
    sample: {
      ru: ["впечатление", "объявление", "здравствуйте"],
      en: ["necessary", "rhythm", "acknowledge"],
    },
  },
  {
    id: "sentences-texts",
    title: "Предложения и тексты",
    text: "Связный текст с заглавными буквами и знаками препинания в ровном темпе.",
    kind: "fragments",
    sample: { ru: ["предложения", "абзацы"], en: ["sentences", "paragraphs"] },
  },
  {
    id: "speed-typing",
    title: "Скоростная печать",
    text: "Наращивание скорости без потери точности: ровный ритм на длинных текстах.",
    kind: "fragments",
    localized: false,
    sample: { ru: ["темп", "ритм", "точность"], en: ["темп", "ритм", "точность"] },
  },
];

function ProgramSection() {
  const [layoutId, setLayoutId] = useState<LayoutId>("ru");
  const tabRefs = useRef<Record<LayoutId, HTMLButtonElement | null>>({ ru: null, en: null });
  const layout = COURSE_LAYOUTS[layoutId];

  const selectLayout = (next: LayoutId, focus = false) => {
    setLayoutId(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = LAYOUT_ORDER.indexOf(layoutId);
    const lastIndex = LAYOUT_ORDER.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;
        break;
      case "ArrowLeft":
        nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    const next = LAYOUT_ORDER[nextIndex];
    if (next) {
      event.preventDefault();
      selectLayout(next, true);
    }
  };

  return (
    <section id="program" className="section program" aria-labelledby="program-title">
      <div className="layout-container">
        <div className="program__top">
          <header className="section-head program__head">
            <p className="section-head__kicker">
              <span className="section-head__index" aria-hidden="true">
                01
              </span>
              Обучение
            </p>
            <h2 id="program-title" className="section-head__title">
              Программа из десяти этапов
            </h2>
            <p className="section-head__lead">
              Курс ведёт от правильного положения рук до скоростной печати. Новые клавиши
              добавляются только тогда, когда прежние уже не требуют взгляда на клавиатуру.
              Русская и английская программы независимы: прогресс по ним будет считаться отдельно.
            </p>
          </header>

          <div className="program__switch">
            <p id="program-layout-label" className="program__switch-label">
              Раскладка курса
            </p>
            <div className="layout-tabs" role="tablist" aria-labelledby="program-layout-label">
              {LAYOUT_ORDER.map((id) => {
                const item = COURSE_LAYOUTS[id];
                const selected = id === layoutId;
                return (
                  <button
                    key={id}
                    ref={(node) => {
                      tabRefs.current[id] = node;
                    }}
                    id={`program-tab-${id}`}
                    data-testid={`program-tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="program-panel"
                    tabIndex={selected ? 0 : -1}
                    className={
                      selected ? "layout-tabs__tab layout-tabs__tab--active" : "layout-tabs__tab"
                    }
                    onClick={() => selectLayout(id)}
                    onKeyDown={handleTabKeyDown}
                  >
                    <span className="layout-tabs__code" aria-hidden="true">
                      {item.code}
                    </span>
                    <span className="layout-tabs__name">{item.tabLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          id="program-panel"
          role="tabpanel"
          aria-labelledby={`program-tab-${layoutId}`}
          className={`program__panel program__panel--${layoutId}`}
          tabIndex={0}
        >
          <aside className="program-sample" aria-labelledby="program-sample-label">
            <p id="program-sample-label" className="program-sample__label">
              {layout.courseLabel}
            </p>
            <p className="program-sample__caption">Основной ряд — стартовая позиция</p>

            <div className="program-sample__keys" aria-hidden="true">
              <div className="program-sample__hand program-sample__hand--left">
                {layout.homeLeft.map((label, index) => (
                  <Keycap
                    key={`${layoutId}-l-${label}`}
                    keyDef={{
                      label,
                      finger: HOME_LEFT_FINGERS[index] ?? "index",
                      hand: "left",
                      home: true,
                      anchor: layout.anchors.includes(label),
                    }}
                  />
                ))}
              </div>
              <div className="program-sample__hand program-sample__hand--right">
                {layout.homeRight.map((label, index) => (
                  <Keycap
                    key={`${layoutId}-r-${label}`}
                    keyDef={{
                      label,
                      finger: HOME_RIGHT_FINGERS[index] ?? "index",
                      hand: "right",
                      home: true,
                      anchor: layout.anchors.includes(label),
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="program-sample__string-label">Строка основного ряда</p>
            <p className="program-sample__string" data-testid="keyboard-sample" lang={layout.lang}>
              {layout.sample}
            </p>

            <p className="program-sample__text">{layout.description}</p>

            <dl className="program-sample__facts">
              <div className="program-sample__fact">
                <dt>Опорные клавиши</dt>
                <dd>{layout.anchorsText}</dd>
              </div>
              <div className="program-sample__fact">
                <dt>Первые слова</dt>
                <dd lang={layout.lang}>{layout.firstWords}</dd>
              </div>
            </dl>

            <p className="program-sample__status">
              <IconInfo className="program-sample__status-icon" size={16} />
              <span>Это образец строки, а не упражнение: тренажёр ещё не запущен.</span>
            </p>
          </aside>

          <div className="program__stages">
            <ol className="program-stages">
              {PROGRAM_STAGES.map((stage, index) => (
                <li key={stage.id} className={`program-stage program-stage--${stage.kind}`}>
                  <span className="program-stage__number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="program-stage__body">
                    <h3 className="program-stage__title">{stage.title}</h3>
                    <p
                      className="program-stage__chips"
                      lang={stage.localized === false ? undefined : layout.lang}
                    >
                      <span className="sr-only">
                        {stage.kind === "keys" ? "Клавиши: " : "Материал: "}
                      </span>
                      {stage.sample[layoutId].map((chip) =>
                        stage.kind === "keys" ? (
                          <kbd key={chip} className="program-stage__chip program-stage__chip--key">
                            {chip}
                          </kbd>
                        ) : (
                          <span
                            key={chip}
                            className="program-stage__chip program-stage__chip--fragment"
                          >
                            {chip}
                          </span>
                        ),
                      )}
                    </p>
                    <p className="program-stage__text">{stage.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="program__progress-note">
              <IconClock className="program__progress-icon" size={18} />
              <span>
                Прохождение этапов пока не отслеживается: тренажёр и учётные записи ещё
                не запущены, поэтому здесь нет процентов и отметок о выполнении.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Coach (#coach) — future feature, explained honestly                        */
/* -------------------------------------------------------------------------- */

const COACH_STEPS = [
  {
    id: "measure",
    Icon: IconBars,
    step: "Шаг 1",
    title: "Измерить",
    text: "Тренажёр фиксирует скорость, точность, паузы между нажатиями и ошибки — по ожидаемым клавишам текста.",
    input: "ваши нажатия в сессиях",
    output: "карта ошибок и ритма",
  },
  {
    id: "explain",
    Icon: IconChat,
    step: "Шаг 2",
    title: "Объяснить",
    text: "Тренер переводит измерения в понятные выводы: где сбивается ритм, какие клавиши путаются и почему.",
    input: "карта ошибок и ритма",
    output: "вывод простыми словами",
  },
  {
    id: "practice",
    Icon: IconRepeat,
    step: "Шаг 3",
    title: "Потренировать",
    text: "Короткие упражнения под ваши слабые места, а затем повторный замер — чтобы увидеть, сработало ли.",
    input: "вывод и слабые места",
    output: "упражнение и новый замер",
  },
] as const;

const COACH_PRINCIPLES = [
  "Нет измерений — нет советов. Тренер не делает выводов на пустом месте.",
  "Тренер не видит ваших рук: какой палец нажал клавишу, проверить нельзя. Выводы строятся по ожидаемым клавишам и ошибкам.",
  "Видно, на чём основан совет: конкретные клавиши, сочетания и сессии.",
  "Тренер подсказывает, но не решает за вас: план можно изменить.",
];

function CoachSection() {
  return (
    <section id="coach" className="section coach" aria-labelledby="coach-title">
      <div className="coach__inner layout-container">
        <header className="section-head coach__head">
          <p className="section-head__kicker">
            <span className="section-head__index" aria-hidden="true">
              02
            </span>
            AI-тренер
          </p>
          <p className="status-pill status-pill--planned">
            <IconClock className="status-pill__icon" size={16} />
            Запланировано · этап 5
          </p>
          <h2 id="coach-title" className="section-head__title">
            Тренер, который опирается на данные
          </h2>
          <p className="section-head__lead">
            Сейчас AI-тренер не подключён и ничего не анализирует. Он запланирован на этап 5 —
            ниже описано, как он будет устроен: каждый совет опирается на измерения ваших
            собственных сессий.
          </p>
        </header>

        <ol className="coach-flow">
          {COACH_STEPS.map(({ id, Icon, step, title, text, input, output }) => (
            <li key={id} className={`coach-step coach-step--${id}`}>
              <div className="coach-step__top">
                <span className="coach-step__icon">
                  <Icon size={22} />
                </span>
                <span className="coach-step__index">{step}</span>
              </div>
              <h3 className="coach-step__title">{title}</h3>
              <p className="coach-step__text">{text}</p>
              <dl className="coach-step__io">
                <div className="coach-step__io-row">
                  <dt>На входе</dt>
                  <dd>{input}</dd>
                </div>
                <div className="coach-step__io-row">
                  <dt>На выходе</dt>
                  <dd>{output}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>

        <div className="coach-principles">
          <h3 className="coach-principles__title">Принципы, которые мы закладываем</h3>
          <ul className="coach-principles__list">
            {COACH_PRINCIPLES.map((principle) => (
              <li key={principle} className="coach-principles__item">
                <IconCheck className="coach-principles__icon" size={18} />
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Arena (#arena) — future mode, no fake players                              */
/* -------------------------------------------------------------------------- */

const TRACK_TICKS = Array.from({ length: 9 }, (_, index) => index);

function ArenaLane({ variant, label }: { variant: "you" | "rival"; label: string }) {
  return (
    <div className={`arena-track__lane arena-track__lane--${variant}`}>
      <span className="arena-track__who">
        <span className={`arena-track__avatar arena-track__avatar--${variant}`}>
          <span className="arena-track__avatar-core" />
        </span>
        <span className="arena-track__label">{label}</span>
      </span>
      <span className="arena-track__rail">
        <span className="arena-track__start" />
        {TRACK_TICKS.map((tick) => (
          <span key={tick} className="arena-track__tick" />
        ))}
        <span className="arena-track__finish">
          <IconClock size={16} />
        </span>
      </span>
    </div>
  );
}

const ARENA_RULES = [
  {
    id: "humans",
    Icon: IconUsers,
    title: "Соперники — реальные люди",
    text: "Платформа не будет выдавать своих ботов за людей. Результаты пройдут базовую проверку на сервере: она отсекает явные нарушения, но не даёт абсолютной гарантии.",
  },
  {
    id: "same-text",
    Icon: IconKeyboard,
    title: "Равные условия",
    text: "Оба участника получат одинаковый текст на одном языке и одинаковое фиксированное время матча.",
  },
  {
    id: "accuracy",
    Icon: IconTarget,
    title: "Считаются верные знаки",
    text: "Побеждает тот, у кого к концу времени больше верно набранных знаков. При равенстве решает точность.",
  },
  {
    id: "matching",
    Icon: IconLayers,
    title: "Подбор по рейтингу",
    text: "Соперника подберут прежде всего по рейтингу, с учётом скорости и точности. Язык и длительность матча у обоих строго совпадают.",
  },
] as const;

function ArenaSection() {
  return (
    <section id="arena" className="section arena" aria-labelledby="arena-title">
      <div className="arena__inner layout-container">
        <div className="arena__top">
          <header className="section-head arena__head">
            <p className="section-head__kicker">
              <span className="section-head__index" aria-hidden="true">
                03
              </span>
              Арена
            </p>
            <p className="status-pill status-pill--future">
              <IconRoute className="status-pill__icon" size={16} />
              Будущий режим
            </p>
            <h2 id="arena-title" className="section-head__title">
              Матчи один на один с живыми людьми
            </h2>
            <p className="section-head__lead">
              Матч длится фиксированное время, оба участника печатают один и тот же текст.
              Побеждает тот, кто к концу времени наберёт больше верных знаков; при равном счёте
              решает точность.
            </p>
          </header>

          <div className="arena__notice" role="note">
            <IconInfo className="arena__notice-icon" size={20} />
            <p className="arena__notice-text">
              Онлайн-матчи появятся на этапе 6. Сейчас поиск соперника не запущен.
            </p>
          </div>
        </div>

        <figure className="arena-track">
          <div className="arena-track__board" aria-hidden="true">
            <div className="arena-track__scale">
              <span className="arena-track__scale-start">начало матча</span>
              <span className="arena-track__scale-finish">конец времени</span>
            </div>
            <ArenaLane variant="you" label="Вы" />
            <ArenaLane variant="rival" label="Соперник" />
          </div>
          <figcaption className="arena-track__caption">
            <span className="arena-track__caption-title">Схема дорожек · иллюстрация</span>
            <span className="arena-track__caption-text">
              Здесь нет игроков и результатов: матчи ещё не запущены. Это не гонка до финиша —
              дорожка будет отражать число верно набранных знаков за фиксированное время.
            </span>
          </figcaption>
        </figure>

        <ul className="arena-rules">
          {ARENA_RULES.map(({ id, Icon, title, text }) => (
            <li key={id} className="arena-rule">
              <span className="arena-rule__icon">
                <Icon size={20} />
              </span>
              <h3 className="arena-rule__title">{title}</h3>
              <p className="arena-rule__text">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Methodology (#methodology)                                                 */
/* -------------------------------------------------------------------------- */

const METRICS = [
  {
    id: "cpm",
    abbr: "CPM",
    title: "Знаков в минуту",
    formula: "CPM = верные знаки ÷ минуты",
    text: "Чистый темп печати без поправки на длину слов. Удобен для русского языка.",
    example: "250 верных знаков за 1 минуту = 250 CPM",
  },
  {
    id: "wpm",
    abbr: "WPM",
    title: "Слов в минуту",
    formula: "WPM = CPM ÷ 5",
    text: "Международный стандарт: «словом» считаются 5 знаков, включая пробелы.",
    example: "250 CPM ÷ 5 = 50 WPM",
  },
  {
    id: "accuracy",
    abbr: "%",
    title: "Точность",
    formula: "Точность = верные попытки ÷ все попытки × 100%",
    text: "Считаются попытки ввода символов. Backspace и модификаторы исключены; исправленная ошибка всё равно учитывается.",
    example: "196 верных из 200 попыток ввода = 98%",
  },
] as const;

function MethodologySection() {
  return (
    <section id="methodology" className="section methodology" aria-labelledby="methodology-title">
      <div className="layout-container">
        <header className="section-head methodology__head">
          <p className="section-head__kicker">
            <span className="section-head__index" aria-hidden="true">
              04
            </span>
            Методика
          </p>
          <h2 id="methodology-title" className="section-head__title">
            Как мы считаем результат
          </h2>
          <p className="section-head__lead">
            Три метрики, понятные формулы и никаких скрытых коэффициентов. Одни и те же правила
            будут действовать в тренажёре, у AI-тренера и на арене.
          </p>
        </header>

        <ul className="metric-grid">
          {METRICS.map((metric) => (
            <li key={metric.id} className={`metric-card metric-card--${metric.id}`}>
              <p className="metric-card__abbr" aria-hidden="true">
                {metric.abbr}
              </p>
              <h3 className="metric-card__title">
                {metric.id === "accuracy" ? metric.title : `${metric.abbr} — ${metric.title}`}
              </h3>
              <p className="metric-card__formula">{metric.formula}</p>
              <p className="metric-card__text">{metric.text}</p>
              <p className="metric-card__example">
                <span className="metric-card__example-label">Пример расчёта:</span>{" "}
                {metric.example}
              </p>
            </li>
          ))}
        </ul>

        <div className="methodology__footer">
          <IconBook className="methodology__footer-icon" size={20} />
          <p className="methodology__footer-text">
            Округление, учёт пробелов, исправлений и пауз описаны в полной методике.
          </p>
          <Link href="/methodology" className="inline-link">
            <span>Читать полную методику</span>
            <IconArrowRight className="inline-link__icon" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Closing CTA + development scope                                            */
/* -------------------------------------------------------------------------- */

const SCOPE_NOW = [
  "Обзор платформы и принципов обучения",
  "Программа из 10 этапов для RU и EN",
  "Методика расчёта CPM, WPM и точности",
  "Тёмная и светлая темы",
];

const SCOPE_NEXT = [
  "Тренажёр с упражнениями",
  "Персональный AI-тренер — этап 5",
  "Учётная запись и сохранение прогресса",
  "Онлайн-матчи — этап 6",
];

function ClosingSection() {
  return (
    <section className="section closing" aria-labelledby="closing-title">
      <div className="closing__inner layout-container">
        <div className="closing__cta">
          <p className="section-head__kicker">С чего начать</p>
          <h2 id="closing-title" className="closing__title">
            Начните с карты курса
          </h2>
          <p className="closing__text">
            Посмотрите, из каких этапов складывается путь к слепой печати, и выберите раскладку,
            с которой начнёте, когда откроется тренажёр.
          </p>
          <a className="button button--primary" href="#program">
            <span>К программе курса</span>
            <IconArrowRight className="button__icon" size={18} />
          </a>
        </div>

        <aside className="dev-note" aria-labelledby="dev-note-title">
          <h3 id="dev-note-title" className="dev-note__title">
            Что уже есть и что впереди
          </h3>
          <div className="dev-note__columns">
            <div className="dev-note__column dev-note__column--now">
              <p className="dev-note__label">Доступно сейчас · этап 1</p>
              <ul className="dev-note__list">
                {SCOPE_NOW.map((item) => (
                  <li key={item} className="dev-note__item">
                    <IconCheck className="dev-note__icon" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="dev-note__column dev-note__column--next">
              <p className="dev-note__label">В следующих этапах</p>
              <ul className="dev-note__list">
                {SCOPE_NEXT.map((item) => (
                  <li key={item} className="dev-note__item">
                    <IconClock className="dev-note__icon" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Link href="/roadmap" className="inline-link">
            <span>Подробный план этапов</span>
            <IconArrowRight className="inline-link__icon" size={16} />
          </Link>
        </aside>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page composition                                                           */
/* -------------------------------------------------------------------------- */

export function LandingPage() {
  const landing = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("landing-in-view");
        observer.unobserve(entry.target);
      }
    }, {threshold:.15});
    landing.current?.querySelectorAll(".section-head,.program-sample,.arena-track__board,.closing__cta,.dev-note").forEach(el=>observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={landing} className="landing-motion">
      <HeroSection />
      <FeatureStrip />
      <ProgramSection />
      <CoachSection />
      <ArenaSection />
      <MethodologySection />
      <ClosingSection />
    </div>
  );
}

export default LandingPage;
