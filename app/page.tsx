"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Flame,
  Home,
  Landmark,
  Languages,
  LogOut,
  Menu,
  Settings,
  Target,
  Trophy,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Screen = "landing" | "auth" | "dashboard";
type AuthMode = "signup" | "login";

const subjects = [
  { name: "Українська мова", short: "УКР", icon: BookOpen, progress: 72, tests: 8, tone: "lime" },
  { name: "Математика", short: "МАТ", icon: Calculator, progress: 54, tests: 6, tone: "blue" },
  { name: "Історія України", short: "ІСТ", icon: Landmark, progress: 41, tests: 4, tone: "violet" },
  { name: "Англійська мова", short: "ENG", icon: Languages, progress: 63, tests: 7, tone: "orange" },
];

const activity = [
  { label: "Пн", value: 36 }, { label: "Вт", value: 58 }, { label: "Ср", value: 45 },
  { label: "Чт", value: 78 }, { label: "Пт", value: 64 }, { label: "Сб", value: 91 }, { label: "Нд", value: 52 },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <button type="button" onClick={() => window.location.reload()} className="group flex items-center gap-3 text-left" aria-label="NMT Focus — на головну">
      <span className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] transition group-hover:border-[#c8ff38]/50">
        <span className="size-2.5 rounded-full bg-[#c8ff38] shadow-[0_0_18px_#c8ff38]" />
      </span>
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">NMT<span className="text-white/35">/</span>FOCUS</span>}
    </button>
  );
}

function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080a09] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_73%_27%,rgba(200,255,56,0.10),transparent_26%),radial-gradient(circle_at_15%_80%,rgba(70,104,255,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Brand />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/42 sm:inline">Твій простір підготовки</span>
          <Button variant="outline" onClick={onLogin} className="h-11 rounded-full border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/10 hover:text-white">Увійти</Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] w-full max-w-[1400px] items-center gap-12 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-16">
        <div className="max-w-[720px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-sm text-white/55">
            <span className="size-1.5 rounded-full bg-[#c8ff38]" /> Підготовка до НМТ без хаосу
          </div>
          <h1 className="text-[clamp(3.4rem,7vw,7.3rem)] font-semibold leading-[0.88] tracking-[-0.075em]">Фокус на<br /><span className="text-[#c8ff38]">твої 200.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/55 sm:text-xl">Тренуйся за темами, проходь симуляції та бач, що саме наближає тебе до бажаного бала.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onStart} className="h-14 rounded-full bg-[#c8ff38] px-7 text-base font-semibold text-[#10130b] shadow-[0_14px_40px_rgba(200,255,56,.16)] hover:bg-[#d5ff65]">Почати підготовку <ArrowRight className="size-4" /></Button>
            <div className="flex items-center gap-3 px-3 text-sm text-white/38"><CheckCircle2 className="size-4 text-white/55" /> Перший тест — одразу після входу</div>
          </div>
          <div className="mt-14 grid max-w-xl grid-cols-3 border-t border-white/10 pt-7">
            <div><strong className="block text-2xl font-semibold tracking-tight">4</strong><span className="text-sm text-white/36">предмети</span></div>
            <div className="border-l border-white/10 pl-6"><strong className="block text-2xl font-semibold tracking-tight">200</strong><span className="text-sm text-white/36">твоя ціль</span></div>
            <div className="border-l border-white/10 pl-6"><strong className="block text-2xl font-semibold tracking-tight">24/7</strong><span className="text-sm text-white/36">доступ</span></div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[600px] lg:mr-0">
          <div className="absolute -inset-10 rounded-full bg-[#c8ff38]/[0.055] blur-3xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#101311]/90 p-4 shadow-[0_40px_120px_rgba(0,0,0,.65)] sm:p-6">
            <div className="mb-7 flex items-center justify-between">
              <div><p className="text-sm text-white/38">Твій прогноз</p><p className="mt-1 text-2xl font-semibold tracking-tight">168 → 185</p></div>
              <span className="rounded-full border border-[#c8ff38]/25 bg-[#c8ff38]/10 px-3 py-1.5 text-sm text-[#c8ff38]">+17 балів</span>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/30 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-5"><div><p className="text-sm text-white/40">Сьогодні</p><h2 className="mt-1 text-xl font-medium">Квадратні рівняння</h2></div><Calculator className="size-5 text-[#c8ff38]" /></div>
              <div className="mt-12 flex items-end justify-between"><div><p className="text-sm text-white/35">15 завдань · 25 хв</p><p className="mt-2 text-sm text-white/60">Опрацювати до 19:00</p></div><span className="grid size-12 place-items-center rounded-full bg-white text-black"><ArrowUpRight className="size-5" /></span></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.035] p-5"><Flame className="size-5 text-orange-400" /><strong className="mt-8 block text-3xl tracking-tight">6</strong><span className="text-sm text-white/35">днів поспіль</span></div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.035] p-5"><Target className="size-5 text-blue-400" /><strong className="mt-8 block text-3xl tracking-tight">64%</strong><span className="text-sm text-white/35">плану за тиждень</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthScreen({ mode, setMode, onBack, onSuccess }: { mode: AuthMode; setMode: (mode: AuthMode) => void; onBack: () => void; onSuccess: () => void }) {
  return (
    <main className="grid min-h-screen bg-[#080a09] text-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/8 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(200,255,56,.12),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(70,104,255,.10),transparent_34%)]" />
        <div className="relative"><Brand /></div>
        <div className="relative max-w-xl">
          <p className="mb-6 text-sm uppercase tracking-[0.18em] text-[#c8ff38]">Твоя система підготовки</p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] xl:text-6xl">Менше здогадок. Більше правильних відповідей.</h1>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[["01", "Тренуйся"], ["02", "Аналізуй"], ["03", "Покращуй"]].map(([number, label]) => (
              <div key={number} className="border-t border-white/12 pt-4"><span className="text-sm text-white/25">{number}</span><p className="mt-2 text-sm text-white/62">{label}</p></div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/25">NMT/FOCUS · 2026</p>
      </section>
      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10 sm:py-8 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between lg:justify-end"><div className="lg:hidden"><Brand compact /></div><Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label="Закрити"><X className="size-5" /></Button></div>
        <div className="m-auto w-full max-w-[470px] py-12">
          <p className="text-sm font-medium text-[#c8ff38]">{mode === "signup" ? "Новий профіль" : "З поверненням"}</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{mode === "signup" ? "Почнемо з тебе" : "Продовжуй свій прогрес"}</h2>
          <p className="mt-4 text-base leading-7 text-white/42">{mode === "signup" ? "Створи профіль, щоб зберігати результати й отримати персональний темп підготовки." : "Увійди, щоб повернутися до свого плану та статистики."}</p>
          <div className="mt-9 flex rounded-full bg-white/[0.05] p-1">
            <button type="button" onClick={() => setMode("signup")} className={`flex-1 rounded-full px-4 py-2.5 text-sm transition ${mode === "signup" ? "bg-white text-black" : "text-white/45 hover:text-white"}`}>Реєстрація</button>
            <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-full px-4 py-2.5 text-sm transition ${mode === "login" ? "bg-white text-black" : "text-white/45 hover:text-white"}`}>Вхід</button>
          </div>
          <form className="mt-7 space-y-5" onSubmit={(event) => { event.preventDefault(); onSuccess(); }}>
            {mode === "signup" && <label className="block"><span className="mb-2 block text-sm text-white/62">Ім’я</span><Input required name="name" placeholder="Як до тебе звертатися?" className="h-13 rounded-2xl border-white/10 bg-white/[0.035] px-4 text-white placeholder:text-white/22 focus-visible:border-[#c8ff38]/55 focus-visible:ring-[#c8ff38]/15" /></label>}
            <label className="block"><span className="mb-2 block text-sm text-white/62">Email</span><Input required name="email" type="email" placeholder="you@example.com" className="h-13 rounded-2xl border-white/10 bg-white/[0.035] px-4 text-white placeholder:text-white/22 focus-visible:border-[#c8ff38]/55 focus-visible:ring-[#c8ff38]/15" /></label>
            <label className="block"><span className="mb-2 block text-sm text-white/62">Пароль</span><Input required name="password" type="password" minLength={6} placeholder="Щонайменше 6 символів" className="h-13 rounded-2xl border-white/10 bg-white/[0.035] px-4 text-white placeholder:text-white/22 focus-visible:border-[#c8ff38]/55 focus-visible:ring-[#c8ff38]/15" /></label>
            <Button type="submit" className="h-14 w-full rounded-full bg-[#c8ff38] text-base font-semibold text-[#10130b] hover:bg-[#d5ff65]">{mode === "signup" ? "Створити профіль" : "Увійти"} <ArrowRight className="size-4" /></Button>
          </form>
          <p className="mt-6 text-center text-sm leading-6 text-white/28">Продовжуючи, ти погоджуєшся з умовами використання сервісу.</p>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ onExit }: { onExit: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  return (
    <main className="min-h-screen bg-[#090b0a] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[236px_1fr]">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-white/8 bg-[#0d0f0e] p-5 transition-transform lg:static lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between"><Brand /><Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} className="rounded-full text-white/45 hover:bg-white/10 hover:text-white lg:hidden"><X /></Button></div>
          <nav className="mt-12 space-y-2" aria-label="Головна навігація">
            <button className="flex w-full items-center gap-3 rounded-xl bg-white/[0.07] px-3 py-3 text-sm font-medium text-white"><Home className="size-4 text-[#c8ff38]" /> Огляд</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/42 transition hover:bg-white/[0.04] hover:text-white"><ClipboardCheck className="size-4" /> Мої тести</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/42 transition hover:bg-white/[0.04] hover:text-white"><BarChart3 className="size-4" /> Статистика</button>
          </nav>
          <div className="mt-9 border-t border-white/8 pt-7"><p className="px-3 text-xs uppercase tracking-[0.16em] text-white/20">Предмети</p><div className="mt-3 space-y-1">
            {subjects.map((subject) => <button key={subject.short} onClick={() => setActiveSubject(subject.name)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/42 transition hover:bg-white/[0.04] hover:text-white"><span className={`size-2 rounded-full subject-${subject.tone}`} /> {subject.short}</button>)}
          </div></div>
          <div className="mt-auto space-y-1 pt-6"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/35 hover:text-white"><Settings className="size-4" /> Налаштування</button><button onClick={onExit} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/35 hover:text-white"><LogOut className="size-4" /> Вийти</button></div>
        </aside>
        {menuOpen && <button aria-label="Закрити меню" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/70 lg:hidden" />}
        <section className="min-w-0 px-5 pb-12 pt-5 sm:px-8 lg:px-10 xl:px-14">
          <header className="flex items-center justify-between"><Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} className="rounded-full text-white hover:bg-white/10 lg:hidden"><Menu /></Button><div className="hidden lg:block"><p className="text-sm text-white/30">Середа, 9 вересня</p></div><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium">Олексій</p><p className="text-xs text-white/28">ціль: 185+</p></div><span className="grid size-11 place-items-center rounded-full border border-white/10 bg-[#171b18] text-sm font-semibold text-[#c8ff38]">О</span></div></header>
          <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#c8ff38]">Твій кабінет</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Привіт, Олексію.</h1><p className="mt-3 text-base text-white/38">Сьогодні достатньо зробити один сильний крок.</p></div><Button onClick={() => setActiveSubject("Швидкий тест")} className="h-12 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/85">Швидкий тест <ArrowRight className="size-4" /></Button></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[{ icon: Trophy, label: "Середній бал", value: "168", note: "+6 за 30 днів", color: "text-[#c8ff38]" }, { icon: ClipboardCheck, label: "Тестів пройдено", value: "25", note: "7 цього тижня", color: "text-blue-400" }, { icon: Flame, label: "Серія занять", value: "6 днів", note: "твій рекорд — 11", color: "text-orange-400" }].map(({ icon: Icon, label, value, note, color }) => (
              <article key={label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-sm text-white/38">{label}</p><Icon className={`size-4 ${color}`} /></div><p className="mt-7 text-3xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-sm text-white/28">{note}</p></article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
            <article className="rounded-[28px] border border-white/8 bg-[#111412] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-white/35">Наступний крок</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Математика: рівняння</h2></div><span className="grid size-10 place-items-center rounded-full bg-[#c8ff38]/10 text-[#c8ff38]"><Calculator className="size-5" /></span></div><p className="mt-4 max-w-xl text-base leading-7 text-white/38">Короткий сет із 15 завдань за темою, де ти найчастіше втрачаєш бали.</p><div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"><span className="flex items-center gap-2 text-sm text-white/38"><Clock3 className="size-4" /> 25 хвилин</span><span className="flex items-center gap-2 text-sm text-white/38"><Target className="size-4" /> ціль: 12/15</span><Button onClick={() => setActiveSubject("Математика")} className="ml-auto h-11 rounded-full bg-[#c8ff38] px-5 text-black hover:bg-[#d5ff65]">Почати <ArrowUpRight className="size-4" /></Button></div></article>
            <article className="rounded-[28px] border border-white/8 bg-white/[0.025] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-sm text-white/35">Активність</p><h2 className="mt-2 text-xl font-semibold">Цей тиждень</h2></div><span className="text-sm text-[#c8ff38]">4 год 20 хв</span></div><div className="mt-8 flex h-32 items-end gap-2 sm:gap-3">{activity.map((day) => <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-full bg-white/[0.06]"><div className="w-full rounded-full bg-white/45 transition hover:bg-[#c8ff38]" style={{ height: `${day.value}px` }} /></div><span className="text-xs text-white/25">{day.label}</span></div>)}</div></article>
          </div>
          <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm text-white/30">Твій прогрес</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Предмети</h2></div><button className="text-sm text-white/35 transition hover:text-white">Усі результати</button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {subjects.map(({ name, short, icon: Icon, progress, tests, tone }) => <button key={name} onClick={() => setActiveSubject(name)} className="group rounded-[22px] border border-white/8 bg-white/[0.025] p-5 text-left transition hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.045]"><div className="flex items-center justify-between"><span className={`grid size-10 place-items-center rounded-full subject-bg-${tone}`}><Icon className="size-4" /></span><ChevronRight className="size-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/70" /></div><p className="mt-7 text-base font-medium">{name}</p><p className="mt-1 text-sm text-white/28">{tests} тестів пройдено</p><div className="mt-5 flex items-center gap-3"><Progress value={progress} className="h-1.5 bg-white/8 [&_[data-slot=progress-indicator]]:bg-white/70" /><span className="text-xs text-white/35">{progress}%</span></div><span className="sr-only">{short}</span></button>)}
          </div></section>
        </section>
      </div>
      {activeSubject && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="demo-title"><div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#141715] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-full bg-[#c8ff38]/10 text-[#c8ff38]"><CheckCircle2 className="size-5" /></span><Button variant="ghost" size="icon" onClick={() => setActiveSubject(null)} className="rounded-full text-white/45 hover:bg-white/10 hover:text-white"><X /></Button></div><h2 id="demo-title" className="mt-8 text-3xl font-semibold tracking-tight">{activeSubject}</h2><p className="mt-3 text-base leading-7 text-white/42">Каркас цього розділу готовий. Питання, таймер і збереження результатів додамо разом із базою даних.</p><Button onClick={() => setActiveSubject(null)} className="mt-8 h-12 w-full rounded-full bg-white text-black hover:bg-white/85">Зрозуміло</Button></div></div>}
    </main>
  );
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  useEffect(() => {
    const modelContext = (document as unknown as {
      modelContext?: {
        registerTool?: (
          tool: unknown,
          options?: { signal?: AbortSignal },
        ) => void | Promise<void>;
      };
    }).modelContext;

    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(modelContext.registerTool({
      name: "start_nmt_access",
      title: "Відкрити NMT Focus",
      description: "Відкрити у видимому інтерфейсі реєстрацію або вхід до кабінету підготовки НМТ.",
      inputSchema: {
        type: "object",
        properties: { mode: { type: "string", enum: ["signup", "login"] } },
        required: ["mode"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const mode = (input as { mode?: unknown })?.mode;
        if (mode !== "signup" && mode !== "login") throw new Error("mode має бути signup або login");
        setAuthMode(mode);
        setScreen("auth");
        return { screen: "auth", mode };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  if (screen === "auth") return <AuthScreen mode={authMode} setMode={setAuthMode} onBack={() => setScreen("landing")} onSuccess={() => setScreen("dashboard")} />;
  if (screen === "dashboard") return <Dashboard onExit={() => setScreen("landing")} />;
  return <Landing onStart={() => { setAuthMode("signup"); setScreen("auth"); }} onLogin={() => { setAuthMode("login"); setScreen("auth"); }} />;
}
