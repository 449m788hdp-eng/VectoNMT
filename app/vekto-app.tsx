"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  ClipboardCheck,
  Flame,
  Globe2,
  Home,
  Landmark,
  Languages,
  Leaf,
  LogOut,
  Settings,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Screen = "landing" | "auth" | "onboarding" | "app";
type View = "results" | "tests" | "home" | "plan" | "settings";

type Profile = { displayName: string; targetScore: number; createdAt?: string };
type SubjectStat = { slug: string; name: string; tests: number; accuracy: number | null };
type Attempt = { id: string; subject_slug: string; subject_name: string; score: number; correct_answers: number; total_questions: number; completed_at: string };
type DashboardData = {
  profile: Profile;
  stats: { completedTests: number; averageScore: number | null; streak: number };
  subjects: SubjectStat[];
  weeklyActivity: Array<{ date: string; active: boolean }>;
  recentAttempts: Attempt[];
};
type Question = { id: string; topic: string; prompt: string; options_json: string; images_json: string };
type ActiveTest = { attemptId: string; subject: string; subjectName: string; questions: Question[] };
type TestResult = { score: number; correct: number; total: number };

const subjects = [
  { slug: "mathematics", name: "Математика", short: "МАТ", icon: Calculator, count: 22, tone: "blue" },
  { slug: "ukrainian", name: "Українська мова", short: "УКР", icon: BookOpen, count: 30, tone: "lime" },
  { slug: "english", name: "Англійська мова", short: "ENG", icon: Languages, count: 32, tone: "orange" },
  { slug: "history", name: "Історія України", short: "ІСТ", icon: Landmark, count: 30, tone: "violet" },
  { slug: "german", name: "Німецька мова", short: "DEU", icon: Languages, count: 32, tone: "rose" },
  { slug: "biology", name: "Біологія", short: "БІО", icon: Leaf, count: 30, tone: "teal" },
  { slug: "geography", name: "Географія", short: "ГЕО", icon: Globe2, count: 30, tone: "cyan" },
];

const navItems = [
  { id: "results" as const, label: "Результати", icon: BarChart3 },
  { id: "tests" as const, label: "Тести", icon: ClipboardCheck },
  { id: "home" as const, label: "Огляд", icon: Home },
  { id: "plan" as const, label: "Мій план", icon: Target },
  { id: "settings" as const, label: "Налаштування", icon: Settings },
];

function Brand() {
  return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.04]"><span className="size-2.5 rounded-full bg-[#c8ff38] shadow-[0_0_18px_#c8ff38]" /></span><span className="text-[15px] font-semibold tracking-[-0.02em]">VEKTO</span></div>;
}

function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return <main className="relative min-h-screen overflow-hidden bg-[#080a09] text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_73%_27%,rgba(200,255,56,0.10),transparent_26%),radial-gradient(circle_at_15%_80%,rgba(70,104,255,0.08),transparent_30%)]" />
    <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />
    <header className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><Brand /><Button variant="outline" onClick={onLogin} className="h-11 rounded-full border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/10 hover:text-white">Увійти</Button></header>
    <section className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] max-w-[1400px] items-center gap-12 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12">
      <div className="max-w-[720px]"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-sm text-white/55"><span className="size-1.5 rounded-full bg-[#c8ff38]" /> Реальні завдання НМТ</div><h1 className="text-[clamp(3.4rem,7vw,7.3rem)] font-semibold leading-[0.88] tracking-[-0.075em]">Фокус на<br /><span className="text-[#c8ff38]">твої 200.</span></h1><p className="mt-8 max-w-xl text-lg leading-8 text-white/55 sm:text-xl">Тренуйся на справжніх завданнях, отримуй чесний результат і бач свій прогрес після кожного тесту.</p><Button size="lg" onClick={onStart} className="mt-10 h-14 rounded-full bg-[#c8ff38] px-7 text-base font-semibold text-[#10130b] hover:bg-[#d5ff65]">Почати підготовку <ArrowRight className="size-4" /></Button><div className="mt-14 grid max-w-xl grid-cols-3 border-t border-white/10 pt-7"><div><strong className="block text-2xl">7</strong><span className="text-sm text-white/36">предметів</span></div><div className="border-l border-white/10 pl-6"><strong className="block text-2xl">412</strong><span className="text-sm text-white/36">завдань</span></div><div className="border-l border-white/10 pl-6"><strong className="block text-2xl">24/7</strong><span className="text-sm text-white/36">доступ</span></div></div></div>
      <div className="relative mx-auto w-full max-w-[580px]"><div className="absolute -inset-10 rounded-full bg-[#c8ff38]/[0.055] blur-3xl" /><div className="relative rounded-[32px] border border-white/10 bg-[#101311]/90 p-6 shadow-[0_40px_120px_rgba(0,0,0,.65)]"><div className="flex items-center justify-between"><div><p className="text-sm text-white/38">Твоя статистика</p><p className="mt-1 text-2xl font-semibold">Починається з першої відповіді</p></div><Trophy className="size-5 text-[#c8ff38]" /></div><div className="mt-8 grid grid-cols-3 gap-3">{[["—", "середній бал"], ["0", "тестів"], ["1", "день серії"]].map(([value, label]) => <div key={label} className="rounded-[20px] border border-white/8 bg-black/25 p-4"><strong className="text-2xl">{value}</strong><span className="mt-8 block text-xs leading-5 text-white/35">{label}</span></div>)}</div><div className="mt-4 rounded-[22px] border border-[#c8ff38]/15 bg-[#c8ff38]/[0.055] p-5"><p className="text-sm text-[#c8ff38]">Без вигаданих цифр</p><p className="mt-2 leading-7 text-white/50">Кожен показник розраховується з твоїх завершених тестів і днів навчання.</p></div></div></div>
    </section>
  </main>;
}

function AuthScreen({ signInPath, onBack }: { signInPath: string; onBack: () => void }) {
  return <main className="grid min-h-screen bg-[#080a09] text-white lg:grid-cols-2"><section className="relative hidden overflow-hidden border-r border-white/8 p-12 lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(200,255,56,.12),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(70,104,255,.10),transparent_34%)]" /><div className="relative"><Brand /></div><div className="relative max-w-xl"><p className="mb-5 text-sm uppercase tracking-[.18em] text-[#c8ff38]">Особистий кабінет</p><h1 className="text-6xl font-semibold leading-none tracking-[-.06em]">Твій прогрес належить тобі.</h1><p className="mt-6 max-w-md text-lg leading-8 text-white/45">Безпечний вхід потрібен, щоб результати зберігалися на всіх твоїх пристроях.</p></div><p className="relative text-sm text-white/25">VEKTO · 2026</p></section><section className="flex min-h-screen flex-col px-5 py-5 sm:px-10"><div className="flex justify-end"><Button variant="ghost" onClick={onBack} className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"><ArrowLeft className="size-4" /> Назад</Button></div><div className="m-auto w-full max-w-[440px] py-12"><p className="text-sm font-medium text-[#c8ff38]">Реєстрація або вхід</p><h2 className="mt-3 text-5xl font-semibold tracking-[-.05em]">Продовжити у Vekto</h2><p className="mt-4 leading-7 text-white/42">Обери Google або Apple на захищеній сторінці входу. Після першого входу Vekto попросить твоє справжнє ім’я.</p><div className="mt-9 space-y-3"><a href={signInPath} target="_top" className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white font-semibold text-black transition hover:bg-white/85"><span className="text-lg font-bold text-[#4285f4]">G</span> Продовжити через Google</a><a href={signInPath} target="_top" className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/14 bg-white/[0.04] font-semibold text-white transition hover:bg-white/10"><Apple className="size-5" /> Продовжити через Apple</a></div><div className="mt-7 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4"><Check className="mt-0.5 size-4 shrink-0 text-[#c8ff38]" /><p className="text-sm leading-6 text-white/38">Авторизацію обробляє захищений вхід ChatGPT. Vekto зберігає лише профіль і навчальні результати.</p></div></div></section></main>;
}

function Onboarding({ email, onReady }: { email: string; onReady: (profile: Profile) => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState(180);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return <main className="grid min-h-screen place-items-center bg-[#080a09] px-5 text-white"><div className="w-full max-w-[520px] rounded-[32px] border border-white/10 bg-[#111412] p-6 shadow-2xl sm:p-10"><Brand /><div className="mt-10"><span className="grid size-12 place-items-center rounded-full bg-[#c8ff38]/10 text-[#c8ff38]"><Sparkles className="size-5" /></span><h1 className="mt-7 text-4xl font-semibold tracking-[-.045em]">Як до тебе звертатися?</h1><p className="mt-3 leading-7 text-white/42">Вкажи справжнє ім’я. Воно з’явиться у привітанні й твоїх результатах.</p></div><form className="mt-8 space-y-5" onSubmit={async (event) => { event.preventDefault(); setSaving(true); setError(""); const response = await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: name, targetScore: target }) }); const payload = await response.json(); setSaving(false); if (!response.ok) return setError(payload.error ?? "Не вдалося зберегти"); onReady({ displayName: payload.profile.displayName, targetScore: payload.profile.targetScore }); }}><label className="block"><span className="mb-2 block text-sm text-white/62">Справжнє ім’я</span><Input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Наприклад, Марія" className="h-14 rounded-2xl border-white/10 bg-white/[.035] px-4 text-white" /></label><label className="block"><span className="mb-2 block text-sm text-white/62">Бажаний бал: <strong className="text-[#c8ff38]">{target}</strong></span><input type="range" min="140" max="200" step="5" value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full accent-[#c8ff38]" /></label>{error && <p className="text-sm text-red-400">{error}</p>}<Button disabled={saving} className="h-14 w-full rounded-full bg-[#c8ff38] font-semibold text-black hover:bg-[#d5ff65]">{saving ? "Зберігаю…" : "Створити профіль"}<ArrowRight className="size-4" /></Button></form><p className="mt-5 text-center text-xs text-white/25">{email}</p></div></main>;
}

function StatCard({ icon: Icon, label, value, note, color }: { icon: typeof Trophy; label: string; value: string; note: string; color: string }) {
  return <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-sm text-white/38">{label}</p><Icon className={`size-4 ${color}`} /></div><p className="mt-7 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-1 text-sm text-white/28">{note}</p></article>;
}

function TestsView({ stats, onStart }: { stats: SubjectStat[]; onStart: (slug: string) => void }) {
  return <section><p className="text-sm font-medium text-[#c8ff38]">Банк завдань</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Обери предмет</h1><p className="mt-3 max-w-2xl leading-7 text-white/40">Швидкий тест містить 10 випадкових завдань із реальних комплектів НМТ-2025.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{subjects.map(({ slug, name, icon: Icon, count, tone }) => { const stat = stats.find((item) => item.slug === slug); return <button key={slug} onClick={() => onStart(slug)} className="group rounded-[24px] border border-white/8 bg-white/[.025] p-5 text-left transition hover:-translate-y-1 hover:border-white/20"><div className="flex items-center justify-between"><span className={`grid size-11 place-items-center rounded-full subject-bg-${tone}`}><Icon className="size-5" /></span><ArrowRight className="size-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-white" /></div><h2 className="mt-7 text-xl font-medium">{name}</h2><p className="mt-1 text-sm text-white/32">{count} завдань у реальному тесті</p><div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-sm"><span className="text-white/35">Пройдено: {stat?.tests ?? 0}</span><span className="text-[#c8ff38]">{stat?.accuracy == null ? "Новий" : `${stat.accuracy}%`}</span></div></button>; })}</div></section>;
}

function TestPlayer({ test, onClose, onCompleted }: { test: ActiveTest; onClose: () => void; onCompleted: (result: TestResult) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const question = test.questions[index];
  const groups = JSON.parse(question.options_json || "[]") as Array<{ title: string; options: Array<{ marker: string; text: string; images?: string[] }> }>;
  const options = groups[0]?.options ?? [];
  const images = JSON.parse(question.images_json || "[]") as string[];
  const selected = answers[question.id];
  const finish = async () => { setSending(true); const response = await fetch("/api/tests/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId: test.attemptId, answers }) }); const payload = await response.json(); setSending(false); if (response.ok) onCompleted(payload); };
  return <main className="min-h-screen bg-[#080a09] px-4 py-5 text-white sm:px-8"><div className="mx-auto max-w-4xl"><header className="flex items-center justify-between"><button onClick={onClose} className="flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft className="size-4" /> Вийти</button><span className="text-sm text-white/38">{index + 1} / {test.questions.length}</span></header><Progress value={((index + 1) / test.questions.length) * 100} className="mt-5 h-1.5 bg-white/8 [&_[data-slot=progress-indicator]]:bg-[#c8ff38]" /><article className="mt-8 rounded-[30px] border border-white/10 bg-[#111412] p-5 sm:p-9"><p className="text-sm text-[#c8ff38]">{test.subjectName} · {question.topic}</p><h1 className="mt-5 whitespace-pre-line text-xl font-medium leading-8 sm:text-2xl">{question.prompt.replaceAll("\\\\(", "").replaceAll("\\\\)", "")}</h1>{images.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{images.map((src) => <img key={src} src={src} alt="Ілюстрація до завдання" className="max-h-72 rounded-2xl bg-white object-contain p-2" />)}</div>}<div className="mt-8 grid gap-3">{options.map((option) => <button key={option.marker} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.marker }))} className={`flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${selected === option.marker ? "border-[#c8ff38]/60 bg-[#c8ff38]/10" : "border-white/9 bg-white/[.025] hover:border-white/20"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${selected === option.marker ? "bg-[#c8ff38] text-black" : "bg-white/8 text-white/55"}`}>{option.marker}</span><span className="leading-6 text-white/75">{option.text || "Варіант із зображенням"}</span>{option.images?.map((src) => <img key={src} src={src} alt="Варіант відповіді" className="ml-auto max-h-20 max-w-32 rounded bg-white object-contain p-1" />)}</button>)}</div><div className="mt-8 flex items-center justify-between"><Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="rounded-full text-white/50 hover:bg-white/10 hover:text-white">Назад</Button>{index < test.questions.length - 1 ? <Button disabled={!selected} onClick={() => setIndex((value) => value + 1)} className="h-12 rounded-full bg-white px-6 text-black hover:bg-white/85">Далі <ArrowRight className="size-4" /></Button> : <Button disabled={!selected || sending} onClick={finish} className="h-12 rounded-full bg-[#c8ff38] px-6 text-black hover:bg-[#d5ff65]">{sending ? "Перевіряю…" : "Завершити тест"}</Button>}</div></article><p className="mt-5 text-center text-xs text-white/22">© УЦОЯО · навчальне використання</p></div></main>;
}

function ResultScreen({ result, onContinue }: { result: TestResult; onContinue: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#080a09] p-5 text-white"><div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#111412] p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#c8ff38]/10 text-[#c8ff38]"><Trophy className="size-7" /></span><p className="mt-7 text-sm text-white/38">Тренувальний бал</p><h1 className="mt-2 text-7xl font-semibold tracking-[-.07em] text-[#c8ff38]">{result.score}</h1><p className="mt-4 text-lg text-white/55">{result.correct} правильних із {result.total}</p><p className="mt-6 text-sm leading-6 text-white/32">Бал розраховано за твоїми відповідями за шкалою 100–200. Результат уже додано до статистики.</p><Button onClick={onContinue} className="mt-8 h-13 w-full rounded-full bg-white text-black hover:bg-white/85">До результатів <ArrowRight className="size-4" /></Button></div></main>;
}

function Dashboard({ data, view, setView, onStart, onRefresh, signOutPath }: { data: DashboardData; view: View; setView: (view: View) => void; onStart: (slug: string) => void; onRefresh: () => void; signOutPath: string }) {
  const name = data.profile.displayName;
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const date = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const mergedStats = subjects.map((subject) => data.subjects.find((item) => item.slug === subject.slug) ?? { slug: subject.slug, name: subject.name, tests: 0, accuracy: null });
  const weakest = [...mergedStats].filter((item) => item.tests > 0).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];
  return <main className="min-h-screen bg-[#090b0a] pb-32 text-white"><header className="sticky top-0 z-20 border-b border-white/7 bg-[#090b0a]/85 backdrop-blur-xl"><div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-4 sm:px-8"><Brand /><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium">{name}</p><p className="text-xs text-white/28">ціль: {data.profile.targetScore}+</p></div><span className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#171b18] text-sm font-semibold text-[#c8ff38]">{initials}</span></div></div></header><div className="mx-auto max-w-[1380px] px-5 py-10 sm:px-8 lg:py-12">
    {view === "home" && <><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm capitalize text-white/30">{date}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Привіт, {name}.</h1><p className="mt-3 text-white/38">Твої цифри оновлюються після кожного завершеного тесту.</p></div><Button onClick={() => onStart(weakest?.slug ?? "mathematics")} className="h-12 rounded-full bg-[#c8ff38] px-6 text-black hover:bg-[#d5ff65]">Швидкий тест <ArrowRight className="size-4" /></Button></div><div className="mt-9 grid gap-4 md:grid-cols-3"><StatCard icon={Trophy} label="Середній бал" value={data.stats.averageScore == null ? "—" : String(data.stats.averageScore)} note={data.stats.completedTests ? "за всі завершені тести" : "з’явиться після першого тесту"} color="text-[#c8ff38]" /><StatCard icon={ClipboardCheck} label="Тестів пройдено" value={String(data.stats.completedTests)} note="лише завершені спроби" color="text-blue-400" /><StatCard icon={Flame} label="Серія занять" value={`${data.stats.streak} ${data.stats.streak === 1 ? "день" : "днів"}`} note="оновлюється щодня" color="text-orange-400" /></div><div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><article className="rounded-[28px] border border-white/8 bg-[#111412] p-6"><p className="text-sm text-white/35">Наступний крок</p><h2 className="mt-2 text-2xl font-semibold">{weakest ? `Підтягнути: ${weakest.name}` : "Пройти перший тест"}</h2><p className="mt-4 leading-7 text-white/38">{weakest ? `Поточна точність — ${weakest.accuracy}%. Vekto радить почати саме з цього предмета.` : "Обери предмет — після тесту тут з’явиться персональна рекомендація."}</p><Button onClick={() => onStart(weakest?.slug ?? "ukrainian")} className="mt-8 h-11 rounded-full bg-white px-5 text-black hover:bg-white/85">Почати</Button></article><article className="rounded-[28px] border border-white/8 bg-white/[.025] p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/35">Активність</p><h2 className="mt-2 text-xl font-semibold">Останні 7 днів</h2></div><span className="text-sm text-[#c8ff38]">{data.weeklyActivity.filter((day) => day.active).length}/7</span></div><div className="mt-8 grid grid-cols-7 gap-2">{data.weeklyActivity.map((day) => <div key={day.date} className="text-center"><div className={`mx-auto h-24 w-full max-w-8 rounded-full ${day.active ? "bg-[#c8ff38]" : "bg-white/[.06]"}`} /><span className="mt-2 block text-[11px] text-white/25">{new Intl.DateTimeFormat("uk-UA", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`))}</span></div>)}</div></article></div></>}
    {view === "tests" && <TestsView stats={mergedStats} onStart={onStart} />}
    {view === "results" && <section><p className="text-sm font-medium text-[#c8ff38]">Твоя історія</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Усі результати</h1>{data.recentAttempts.length ? <div className="mt-8 space-y-3">{data.recentAttempts.map((attempt) => <article key={attempt.id} className="flex flex-col gap-4 rounded-[22px] border border-white/8 bg-white/[.025] p-5 sm:flex-row sm:items-center"><div className="grid size-11 place-items-center rounded-full bg-white/[.06]"><ClipboardCheck className="size-5 text-[#c8ff38]" /></div><div className="flex-1"><h2 className="font-medium">{attempt.subject_name}</h2><p className="mt-1 text-sm text-white/32">{new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(`${attempt.completed_at}Z`))}</p></div><div className="text-left sm:text-right"><strong className="text-2xl text-[#c8ff38]">{attempt.score}</strong><p className="text-sm text-white/32">{attempt.correct_answers}/{attempt.total_questions} правильно</p></div></article>)}</div> : <div className="mt-8 rounded-[28px] border border-dashed border-white/12 p-10 text-center"><BarChart3 className="mx-auto size-7 text-white/25" /><h2 className="mt-5 text-xl font-medium">Поки немає результатів</h2><p className="mt-2 text-white/35">Заверши перший тест — він з’явиться тут.</p><Button onClick={() => setView("tests")} className="mt-6 rounded-full bg-white px-5 text-black">Обрати тест</Button></div>}</section>}
    {view === "plan" && <section><p className="text-sm font-medium text-[#c8ff38]">Персональна рекомендація</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Мій план</h1><div className="mt-8 grid gap-4 lg:grid-cols-2"><article className="rounded-[28px] border border-white/8 bg-[#111412] p-7"><Target className="size-6 text-[#c8ff38]" /><h2 className="mt-7 text-2xl font-semibold">Ціль: {data.profile.targetScore}+</h2><p className="mt-3 leading-7 text-white/40">{weakest ? `Найбільший резерв зараз у предметі «${weakest.name}». Додай один короткий тест сьогодні.` : "Щоб скласти персональний план, Vekto потрібен хоча б один завершений тест."}</p>{weakest && <Button onClick={() => onStart(weakest.slug)} className="mt-7 rounded-full bg-[#c8ff38] px-5 text-black">Тренуватися</Button>}</article><article className="rounded-[28px] border border-white/8 bg-white/[.025] p-7"><p className="text-sm text-white/35">Принцип плану</p><div className="mt-6 space-y-5">{["Спочатку — предмет із найнижчою точністю", "Потім — повторення сильних тем", "Кожен результат одразу змінює рекомендацію"].map((text, index) => <div key={text} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[.06] text-sm text-white/45">{index + 1}</span><p className="pt-1 text-white/55">{text}</p></div>)}</div></article></div></section>}
    {view === "settings" && <SettingsView profile={data.profile} signOutPath={signOutPath} onSaved={onRefresh} />}
  </div><nav className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-24px)] max-w-[620px] -translate-x-1/2 items-center justify-between rounded-[24px] border border-white/10 bg-[#131614]/90 p-2 shadow-2xl backdrop-blur-xl" aria-label="Швидкий доступ">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[17px] px-2 py-2.5 transition ${view === id ? "bg-white/[.09] text-white" : "text-white/35 hover:text-white"}`}><Icon className={`size-5 ${view === id ? "text-[#c8ff38]" : ""}`} /><span className="truncate text-[11px] sm:text-xs">{label}</span></button>)}</nav></main>;
}

function SettingsView({ profile, signOutPath, onSaved }: { profile: Profile; signOutPath: string; onSaved: () => void }) {
  const [name, setName] = useState(profile.displayName);
  const [target, setTarget] = useState(profile.targetScore);
  const [message, setMessage] = useState("");
  return <section><p className="text-sm font-medium text-[#c8ff38]">Профіль</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Налаштування</h1><form className="mt-8 max-w-xl rounded-[28px] border border-white/8 bg-[#111412] p-6 sm:p-8" onSubmit={async (event) => { event.preventDefault(); setMessage("Зберігаю…"); const response = await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: name, targetScore: target }) }); setMessage(response.ok ? "Збережено" : "Не вдалося зберегти"); if (response.ok) onSaved(); }}><label className="block"><span className="mb-2 block text-sm text-white/60">Ім’я</span><Input value={name} onChange={(event) => setName(event.target.value)} className="h-13 rounded-2xl border-white/10 bg-white/[.035] px-4 text-white" /></label><label className="mt-6 block"><span className="mb-3 block text-sm text-white/60">Бажаний бал: <strong className="text-[#c8ff38]">{target}</strong></span><input type="range" min="140" max="200" step="5" value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full accent-[#c8ff38]" /></label><div className="mt-7 flex items-center gap-4"><Button className="rounded-full bg-white px-6 text-black hover:bg-white/85">Зберегти</Button>{message && <span className="text-sm text-white/38">{message}</span>}</div></form><a href={signOutPath} target="_top" className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-red-300/70 hover:bg-red-400/10 hover:text-red-300"><LogOut className="size-4" /> Вийти з акаунта</a></section>;
}

export default function VektoApp({ initialIdentity, signInPath, signOutPath }: { initialIdentity: { userId: string; email: string } | null; signInPath: string; signOutPath: string }) {
  const [screen, setScreen] = useState<Screen>(initialIdentity ? "app" : "landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [view, setView] = useState<View>("home");
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const refresh = useCallback(async () => {
    if (!initialIdentity) return;
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    if (response.status === 409) { setScreen("onboarding"); return; }
    if (response.ok) { const payload = await response.json() as DashboardData; setDashboard(payload); setProfile(payload.profile); setScreen("app"); }
  }, [initialIdentity]);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  useEffect(() => {
    const modelContext = (document as unknown as { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: "open_vekto_section",
      title: "Відкрити розділ Vekto",
      description: "Відкрити у видимому інтерфейсі огляд, тести, результати, план або налаштування Vekto.",
      inputSchema: { type: "object", properties: { section: { type: "string", enum: ["home", "tests", "results", "plan", "settings"] } }, required: ["section"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input: unknown) {
        const section = (input as { section?: View })?.section;
        if (!section || !navItems.some((item) => item.id === section)) throw new Error("Невідомий розділ");
        if (!initialIdentity) { setScreen("auth"); return { screen: "auth" }; }
        setScreen("app"); setView(section);
        return { screen: "app", section };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [initialIdentity]);

  const startTest = async (slug: string) => {
    setLoadingTest(true);
    const response = await fetch("/api/tests/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: slug, limit: 10 }) });
    const payload = await response.json();
    setLoadingTest(false);
    if (response.ok) setActiveTest(payload);
  };

  const completed = async (nextResult: TestResult) => { setActiveTest(null); setResult(nextResult); await refresh(); };
  const ready = useMemo(() => profile && dashboard, [profile, dashboard]);

  if (activeTest) return <TestPlayer test={activeTest} onClose={() => setActiveTest(null)} onCompleted={completed} />;
  if (result) return <ResultScreen result={result} onContinue={() => { setResult(null); setView("results"); }} />;
  if (screen === "auth") return <AuthScreen signInPath={signInPath} onBack={() => setScreen("landing")} />;
  if (screen === "onboarding" && initialIdentity) return <Onboarding email={initialIdentity.email} onReady={(nextProfile) => { setProfile(nextProfile); void refresh(); }} />;
  if (screen === "app" && ready) return <><Dashboard data={dashboard} view={view} setView={setView} onStart={startTest} onRefresh={refresh} signOutPath={signOutPath} />{loadingTest && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 text-white backdrop-blur-sm"><div className="rounded-full border border-white/10 bg-[#151815] px-5 py-3 text-sm">Готую реальні завдання…</div></div>}</>;
  if (screen === "app") return <main className="grid min-h-screen place-items-center bg-[#080a09] text-white"><p className="text-white/40">Завантажую твій кабінет…</p></main>;
  return <Landing onStart={() => setScreen(initialIdentity ? "app" : "auth")} onLogin={() => setScreen(initialIdentity ? "app" : "auth")} />;
}
