"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Database,
  Download,
  Flag,
  Flame,
  Globe2,
  Home,
  Landmark,
  Languages,
  Leaf,
  LockKeyhole,
  LogOut,
  Settings,
  Target,
  Trophy,
  X,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";

type Screen = "landing" | "app";
type View = "results" | "tests" | "home" | "plan" | "settings";
type Profile = {
  displayName: string;
  firstName: string;
  lastName: string;
  grade: string;
  fourthSubject: string;
  subjectTargets: Record<string, number>;
  targetScore: number;
  createdAt?: string;
};
type SubjectStat = { slug: string; name: string; tests: number; accuracy: number | null };
type Attempt = { id: string; subject_slug: string; subject_name: string; score: number | null; correct_answers: number; total_questions: number; completed_at: string };
type DashboardData = {
  profile: Profile;
  stats: { completedTests: number; averageScore: number | null; streak: number };
  subjects: SubjectStat[];
  weeklyActivity: Array<{ date: string; active: boolean }>;
  recentAttempts: Attempt[];
};
type Question = { id: string; topic: string; prompt: string; question_type: string; options_json: string; images_json: string; attribution: string };
type Topic = { id: number; name: string; questionCount: number };
type TopicSection = { name: string; questionCount: number; topics: Topic[] };
type TopicPayload = { sections: TopicSection[]; bankSize: number; blueprint: { durationMinutes: number; formats: Array<{ type: string; count: number; label: string }> } };
type ActiveTest = { attemptId: string; subject: string; subjectName: string; topicName?: string | null; mode: "quick" | "full" | "topic"; durationMinutes: number | null; questions: Question[] };
type Reveal = { questionId: string; correctAnswer: string; explanation: string; points: number; maxPoints: number; isCorrect: boolean };
type TestResult = { score: number | null; correct: number; total: number; rawScore: number; rawMax: number; scaleKind: "official-2026" | "practice"; passed: boolean };
type OptionGroup = { title: string; options: Array<{ marker: string; text: string; images?: string[] }> };

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
  { id: "plan" as const, label: "План", icon: Target },
  { id: "settings" as const, label: "Профіль", icon: Settings },
];

const markerKey = (marker: string) => ({ "А": "a", "Б": "b", "В": "c", "Г": "d", "Д": "e", "Е": "f", "Ж": "g", "З": "h" }[marker] ?? marker.toLowerCase());
const markerLabel = (marker: string) => ({ a: "А", b: "Б", c: "В", d: "Г", e: "Д", f: "Е", g: "Ж", h: "З", а: "А", б: "Б", в: "В", г: "Г", д: "Д", е: "Е", ж: "Ж", з: "З" }[marker] ?? marker);

function Brand() {
  return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[.04]"><span className="size-2.5 rounded-full bg-[#c8ff38] shadow-[0_0_18px_#c8ff38]" /></span><span className="text-[15px] font-semibold tracking-[.16em]">VEKTO</span></div>;
}

function Landing({ onStart }: { onStart: () => void }) {
  return <main className="relative min-h-screen overflow-hidden bg-[#080a09] text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(200,255,56,.12),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(66,105,255,.08),transparent_28%)]" />
    <div className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />
    <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><Brand /><span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/45">Гостьовий режим</span></header>
    <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-[1440px] items-center gap-12 px-5 pb-12 sm:px-8 lg:grid-cols-[1.06fr_.94fr] lg:px-12">
      <div className="max-w-[760px]"><p className="flex items-center gap-2 text-sm font-medium text-[#c8ff38]"><span className="size-1.5 rounded-full bg-[#c8ff38]" /> Підготовка до НМТ-2026</p><h1 className="mt-7 text-[clamp(3.5rem,7vw,7.7rem)] font-semibold leading-[.86] tracking-[-.075em]">Результат<br /><span className="text-[#c8ff38]">починається</span><br />з практики.</h1><p className="mt-8 max-w-xl text-lg leading-8 text-white/52">Сім предметів, детальна програма й повні тестові варіанти. Усі запитання вже записані в базі — без генерації під час проходження.</p><Button onClick={onStart} className="mt-9 h-14 rounded-full bg-[#c8ff38] px-7 text-base font-semibold text-[#11150a] hover:bg-[#d7ff6b]">Увійти без реєстрації <ArrowRight className="size-4" /></Button><div className="mt-12 grid max-w-xl grid-cols-3 border-t border-white/10 pt-6"><div><strong className="text-2xl">2 512</strong><span className="mt-1 block text-sm text-white/32">завдань</span></div><div className="border-l border-white/10 pl-5"><strong className="text-2xl">97</strong><span className="mt-1 block text-sm text-white/32">тренувальних тем</span></div><div className="border-l border-white/10 pl-5"><strong className="text-2xl">7</strong><span className="mt-1 block text-sm text-white/32">предметів</span></div></div></div>
      <div className="relative mx-auto w-full max-w-[570px]"><div className="absolute -inset-12 bg-[#c8ff38]/[.045] blur-3xl" /><div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[#0f1210]/95 shadow-[0_40px_120px_rgba(0,0,0,.6)]"><div className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="text-xs uppercase tracking-[.14em] text-white/28">Система тестування</p><p className="mt-1 font-medium">Готова до роботи</p></div><span className="flex items-center gap-2 text-xs text-[#c8ff38]"><span className="size-2 rounded-full bg-[#c8ff38] shadow-[0_0_14px_#c8ff38]" /> ONLINE</span></div><div className="p-5 sm:p-7"><div className="grid grid-cols-3 gap-px bg-white/10">{[["30", "питань"], ["60:00", "таймер"], ["200", "шкала"]].map(([value, label]) => <div key={label} className="bg-[#111411] p-4"><strong className="text-2xl">{value}</strong><span className="mt-6 block text-xs text-white/30">{label}</span></div>)}</div><div className="mt-5 border border-[#c8ff38]/20 bg-[#c8ff38]/[.055] p-5"><p className="flex items-center gap-2 text-sm font-medium text-[#c8ff38]"><Database className="size-4" /> Автономний банк</p><p className="mt-2 text-sm leading-6 text-white/48">Сервер миттєво обирає потрібну кількість і типи завдань звичайним SQL-запитом.</p></div><div className="mt-5 grid grid-cols-10 gap-2">{Array.from({ length: 30 }, (_, index) => <span key={index} className={`aspect-square border ${index < 11 ? "border-[#c8ff38]/45 bg-[#c8ff38]/15" : "border-white/8 bg-white/[.025]"}`} />)}</div></div></div></div>
    </section>
  </main>;
}

function StatCard({ icon: Icon, label, value, note, color }: { icon: typeof Trophy; label: string; value: string; note: string; color: string }) {
  return <article className="rounded-[24px] border border-white/9 bg-[#101311] p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-sm text-white/40">{label}</p><Icon className={`size-4 ${color}`} /></div><p className="mt-7 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-1 text-sm text-white/28">{note}</p></article>;
}

function TestsView({ stats, onStart }: { stats: SubjectStat[]; onStart: (slug: string, mode?: "quick" | "full" | "topic", topicId?: number) => void }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<TopicPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedSubject = subjects.find((item) => item.slug === selectedSlug);
  const openSubject = (slug: string) => { setLoading(true); setCatalog(null); setSelectedSlug(slug); };

  useEffect(() => {
    if (!selectedSlug) return;
    const controller = new AbortController();
    fetch(`/api/topics?subject=${selectedSlug}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => setCatalog(payload as TopicPayload))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedSlug]);

  if (selectedSubject) {
    const topicCount = catalog?.sections.reduce((sum, section) => sum + section.topics.length, 0) ?? 0;
    return <section>
      <button onClick={() => { setSelectedSlug(null); setCatalog(null); }} className="flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><ArrowLeft className="size-4" /> Усі предмети</button>
      <div className="mt-6 overflow-hidden rounded-[30px] border border-white/10 bg-[#101311] shadow-[0_30px_100px_rgba(0,0,0,.28)]">
        <div className="grid border-b border-white/10 lg:grid-cols-[1fr_370px]">
          <div className="p-6 sm:p-8 lg:p-10"><div className="flex items-center gap-2 text-sm font-medium text-[#c8ff38]"><LockKeyhole className="size-4" /> Офіційна структура НМТ-2026</div><h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">{selectedSubject.name}</h1><p className="mt-4 max-w-2xl leading-7 text-white/48">Обери вузьку тему або запусти повний предметний варіант. Запитання вже записані в базі й вибираються автоматично.</p><div className="mt-7 flex flex-wrap gap-2 text-sm text-white/55"><span className="border border-white/10 bg-white/[.035] px-3 py-2">{topicCount || "—"} тем</span><span className="border border-white/10 bg-white/[.035] px-3 py-2">{selectedSubject.count} завдань</span><span className="border border-white/10 bg-white/[.035] px-3 py-2">60 хвилин</span></div></div>
          <div className="flex flex-col justify-center bg-[#c8ff38] p-6 text-[#11150a] sm:p-8"><p className="text-sm font-semibold uppercase tracking-[.12em] opacity-60">Повна симуляція</p><p className="mt-3 text-2xl font-semibold tracking-[-.035em]">Новий варіант за один клік</p><p className="mt-2 text-sm leading-6 opacity-70">Випадкова SQL-вибірка за формами завдань. Без генерації ШІ під час тесту.</p><Button onClick={() => onStart(selectedSubject.slug, "full")} className="mt-6 h-12 rounded-full bg-[#11150a] text-white hover:bg-black">Почати повний тест <ArrowRight className="size-4" /></Button></div>
        </div>
        <div className="grid gap-3 border-b border-white/10 bg-black/20 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">{(catalog?.blueprint.formats ?? []).map((format) => <div key={format.type} className="border-l-2 border-[#c8ff38] bg-white/[.025] px-4 py-3"><p className="text-sm font-medium">{format.label}</p><p className="mt-1 text-xs text-white/35">у повному тесті</p></div>)}</div>
        <div className="p-5 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-white/38">Каталог програми</p><h2 className="mt-1 text-2xl font-semibold">Розділи та теми</h2></div><Button variant="outline" onClick={() => onStart(selectedSubject.slug, "quick")} className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Швидкий тест · 10</Button></div>
          {loading ? <div className="mt-6 border border-white/8 bg-white/[.02] p-7 text-white/38">Підключаю банк тем…</div> : <Accordion type="multiple" defaultValue={catalog?.sections.slice(0, 1).map((section) => section.name)} className="mt-5 overflow-hidden rounded-[22px] border border-white/10">{(catalog?.sections ?? []).map((section, sectionIndex) => <AccordionItem key={section.name} value={section.name} className="border-white/10 px-5 sm:px-6"><AccordionTrigger className="py-5 text-left hover:no-underline"><span className="flex min-w-0 items-start gap-4"><span className="font-mono text-xs text-[#c8ff38]">{String(sectionIndex + 1).padStart(2, "0")}</span><span><strong className="block text-base font-medium leading-6 text-white">{section.name}</strong><span className="mt-1 block text-sm font-normal text-white/35">{section.topics.length} тем · {section.questionCount} завдань</span></span></span></AccordionTrigger><AccordionContent className="pb-5"><div className="grid gap-2 lg:grid-cols-2">{section.topics.map((entry) => <button key={entry.id} onClick={() => onStart(selectedSubject.slug, "topic", entry.id)} className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[.02] px-4 py-3 text-left transition hover:border-[#c8ff38]/40 hover:bg-[#c8ff38]/[.04]"><span><span className="block text-sm font-medium leading-5 text-white/78 group-hover:text-white">{entry.name}</span><span className="mt-1 block text-xs text-white/30">{entry.questionCount} завдань</span></span><ArrowRight className="size-4 shrink-0 text-white/20 group-hover:text-[#c8ff38]" /></button>)}</div></AccordionContent></AccordionItem>)}</Accordion>}
        </div>
      </div>
    </section>;
  }

  return <section>
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="flex items-center gap-2 text-sm font-medium text-[#c8ff38]"><Database className="size-4" /> Локальний банк · 2 512 завдань</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Тестова лабораторія</h1><p className="mt-4 max-w-3xl leading-7 text-white/45">Структура кожного предмета звірена з програмою УЦОЯО. Відкрий предмет, щоб тренувати конкретні теми, або одразу запусти повний варіант.</p></div><a href="/downloads/vekto-question-bank.sqlite" download className="inline-flex h-11 items-center justify-center gap-2 border border-white/12 px-4 text-sm text-white/65 transition hover:border-white/25 hover:text-white"><Download className="size-4" /> Завантажити базу</a></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{subjects.map(({ slug, name, short, icon: Icon, count, tone }, index) => { const stat = stats.find((item) => item.slug === slug); return <article key={slug} className="group relative min-h-[290px] rounded-[26px] border border-white/10 bg-[#0e110f] p-6 transition hover:bg-[#131713] sm:p-7"><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl subject-bg-${tone}`}><Icon className="size-5" /></span><span className="font-mono text-xs text-white/22">{String(index + 1).padStart(2, "0")} / 07</span></div><p className="mt-10 text-xs font-semibold tracking-[.16em] text-white/28">{short} · 60 ХВ</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">{name}</h2><p className="mt-2 text-sm text-white/35">{count} завдань у повному варіанті</p><div className="mt-7 flex items-center gap-2"><Button variant="outline" onClick={() => openSubject(slug)} className="h-11 flex-1 rounded-full border-white/12 bg-transparent text-white hover:border-white/25 hover:bg-white/[.05] hover:text-white">Програма</Button><Button onClick={() => onStart(slug, "full")} className="h-11 flex-1 rounded-full bg-white text-black hover:bg-[#c8ff38]">Почати</Button></div><div className="absolute inset-x-6 bottom-5 flex justify-between border-t border-white/8 pt-3 text-xs"><span className="text-white/28">Спроб: {stat?.tests ?? 0}</span><span className="text-[#c8ff38]">{stat?.accuracy == null ? "Ще без результату" : `${stat.accuracy}% точності`}</span></div></article>; })}</div>
    <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.02] p-4"><Database className="size-5 text-[#c8ff38]" /><p className="text-sm text-white/48"><strong className="block text-white/80">Файлова база</strong>Усі питання вже збережені</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.02] p-4"><LockKeyhole className="size-5 text-[#c8ff38]" /><p className="text-sm text-white/48"><strong className="block text-white/80">Без ШІ під час тесту</strong>Лише миттєва SQL-вибірка</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.02] p-4"><CheckCircle2 className="size-5 text-[#c8ff38]" /><p className="text-sm text-white/48"><strong className="block text-white/80">Формат НМТ-2026</strong>Кількість і типи завдань</p></div></div>
  </section>;
}

function TestPlayer({ test, onClose, onCompleted }: { test: ActiveTest; onClose: () => void; onCompleted: (result: TestResult) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reveals, setReveals] = useState<Record<string, Reveal>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [revealing, setRevealing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState((test.durationMinutes ?? 0) * 60);
  const question = test.questions[index];
  const groups = JSON.parse(question.options_json || "[]") as OptionGroup[];
  const options = groups[0]?.options ?? [];
  const images = JSON.parse(question.images_json || "[]") as string[];
  const selected = answers[question.id] ?? "";
  const reveal = reveals[question.id];
  const locked = Boolean(reveal);

  useEffect(() => {
    if (test.mode !== "full" || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [test.mode, secondsLeft]);

  const pairs = Object.fromEntries(selected.split(";").filter(Boolean).map((part) => [part.slice(0, 1), part.slice(1)]));
  const setPair = (key: string, marker: string) => {
    if (locked) return;
    const next = { ...pairs, [key]: markerKey(marker) };
    setAnswers((current) => ({ ...current, [question.id]: Object.entries(next).sort(([a], [b]) => a.localeCompare(b)).map(([left, right]) => `${left}${right}`).join(";") }));
  };
  const setGrouped = (groupIndex: number, marker: string) => {
    if (locked) return;
    const values = selected.split(";");
    values[groupIndex] = markerKey(marker);
    setAnswers((current) => ({ ...current, [question.id]: values.join(";") }));
  };
  const toggleMultiple = (marker: string) => {
    if (locked) return;
    const key = markerKey(marker);
    const values = selected.split(";").filter(Boolean);
    const next = values.includes(key) ? values.filter((value) => value !== key) : values.length < 3 ? [...values, key] : values;
    setAnswers((current) => ({ ...current, [question.id]: next.sort().join(";") }));
  };
  const expectedSelections = question.question_type === "matching" ? (groups[0]?.options.length ?? 0) : question.question_type === "ordering" ? options.length : question.question_type === "type_6" ? groups.length : question.question_type === "multiple_choice" ? 3 : 1;
  const actualSelections = question.question_type === "numeric" || question.question_type === "single_choice" ? (selected.trim() ? 1 : 0) : selected.split(";").filter(Boolean).length;
  const ready = actualSelections >= expectedSelections;

  const revealAnswer = async () => {
    setRevealing(true); setError("");
    const response = await fetch("/api/tests/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId: test.attemptId, questionId: question.id, selectedAnswer: selected }) });
    const payload = await response.json() as Reveal & { error?: string };
    setRevealing(false);
    if (response.ok) setReveals((current) => ({ ...current, [question.id]: payload })); else setError(payload.error ?? "Не вдалося перевірити відповідь");
  };
  const finish = async () => {
    setSending(true); setError("");
    const response = await fetch("/api/tests/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId: test.attemptId, answers }) });
    const payload = await response.json() as TestResult & { error?: string };
    setSending(false);
    if (response.ok) onCompleted(payload); else setError(payload.error ?? "Не вдалося завершити тест");
  };
  const toggleFlag = () => setFlagged((current) => { const next = new Set(current); if (next.has(question.id)) next.delete(question.id); else next.add(question.id); return next; });
  const prettyAnswer = reveal?.correctAnswer.split(";").map((part) => part.length > 1 && /^\d/.test(part) ? `${part[0]}–${markerLabel(part.slice(1).toLowerCase())}` : markerLabel(part.toLowerCase())).join(" · ");
  const formatLabel = ({ single_choice: "Одна відповідь", matching: "Логічні пари", ordering: "Послідовність", multiple_choice: "Три із семи", numeric: "Коротка відповідь", type_6: "Три групи" } as Record<string, string>)[question.question_type] ?? "Завдання";

  const answerControl = question.question_type === "numeric" ? <Input disabled={locked} inputMode="decimal" value={selected} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Уведи числову відповідь" className="mt-8 h-14 rounded-full border-white/14 bg-black/20 px-4 text-lg text-white" /> : question.question_type === "matching" ? <div className="mt-8 space-y-3">{groups[0]?.options.map((left) => <div key={left.marker} className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 sm:grid-cols-[1fr_250px] sm:items-center"><p className="text-white/75"><strong className="mr-2 text-[#c8ff38]">{left.marker}</strong>{left.text}</p><select disabled={locked} aria-label={`Відповідь для ${left.marker}`} value={pairs[left.marker] ?? ""} onChange={(event) => setPair(left.marker, event.target.value)} className="h-11 border border-white/12 bg-[#171a18] px-3 text-white disabled:opacity-60"><option value="">Обрати пару</option>{groups[1]?.options.map((right) => <option key={right.marker} value={markerKey(right.marker)}>{right.marker} — {right.text}</option>)}</select></div>)}</div> : question.question_type === "ordering" ? <div className="mt-8 space-y-3">{options.map((_, order) => <div key={order} className="grid grid-cols-[88px_1fr] items-center gap-3"><span className="text-sm text-white/38">{order + 1} місце</span><select disabled={locked} value={pairs[String(order + 1)] ?? ""} onChange={(event) => setPair(String(order + 1), event.target.value)} className="h-12 border border-white/12 bg-[#171a18] px-3 text-white disabled:opacity-60"><option value="">Обрати подію</option>{options.map((option) => <option key={option.marker} value={markerKey(option.marker)}>{option.marker} — {option.text}</option>)}</select></div>)}</div> : question.question_type === "type_6" ? <div className="mt-8 space-y-5">{groups.map((group, groupIndex) => <div key={group.title} className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="mb-3 font-medium text-white/70">{group.title}</p><div className="grid gap-2">{group.options.map((option) => { const chosen = selected.split(";")[groupIndex] === markerKey(option.marker); const correct = reveal?.correctAnswer.split(";")[groupIndex] === markerKey(option.marker); return <button disabled={locked} key={option.marker} onClick={() => setGrouped(groupIndex, option.marker)} className={`rounded-2xl border px-4 py-3 text-left disabled:opacity-100 ${reveal && correct ? "border-emerald-400/60 bg-emerald-400/10" : reveal && chosen ? "border-red-400/55 bg-red-400/10" : chosen ? "border-[#c8ff38]/60 bg-[#c8ff38]/10" : "border-white/9"}`}>{option.marker} — {option.text}</button>; })}</div></div>)}</div> : <div className="mt-8 grid gap-3">{options.map((option) => { const optionKey = markerKey(option.marker); const chosen = question.question_type === "multiple_choice" ? selected.split(";").includes(optionKey) : selected === optionKey; const correct = reveal?.correctAnswer.split(";").includes(optionKey); return <button disabled={locked} key={option.marker} onClick={() => question.question_type === "multiple_choice" ? toggleMultiple(option.marker) : setAnswers((current) => ({ ...current, [question.id]: optionKey }))} className={`flex min-h-16 items-center gap-4 rounded-2xl border px-4 py-3 text-left transition disabled:opacity-100 ${reveal && correct ? "border-emerald-400/60 bg-emerald-400/10" : reveal && chosen ? "border-red-400/55 bg-red-400/10" : chosen ? "border-[#c8ff38]/60 bg-[#c8ff38]/10" : "border-white/10 bg-black/15 hover:border-white/25"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${reveal && correct ? "bg-emerald-400 text-black" : reveal && chosen ? "bg-red-400 text-black" : chosen ? "bg-[#c8ff38] text-black" : "border border-white/12 bg-white/[.04] text-white/58"}`}>{chosen && question.question_type === "multiple_choice" ? <Check className="size-4" /> : option.marker}</span><span className="leading-6 text-white/78">{option.text || "Варіант із зображенням"}</span>{option.images?.map((src) => <img key={src} src={src} alt="Варіант відповіді" className="ml-auto max-h-20 max-w-32 bg-white object-contain p-1" />)}</button>; })}</div>;

  return <main className="min-h-screen bg-[#080a09] text-white">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0e0c]/95 backdrop-blur-xl"><div className="mx-auto flex h-17 max-w-[1500px] items-center justify-between px-4 sm:px-7"><div className="flex items-center gap-5"><button onClick={onClose} className="flex items-center gap-2 text-sm text-white/48 hover:text-white"><X className="size-4" /> <span className="hidden sm:inline">Вийти з тесту</span></button><span className="hidden h-6 w-px bg-white/10 sm:block" /><p className="text-sm font-medium">{test.subjectName}<span className="ml-2 font-normal text-white/30">{test.mode === "full" ? "Повний варіант" : test.mode === "topic" ? test.topicName : "Швидкий тест"}</span></p></div><div className="flex items-center gap-3"><span className="text-sm text-white/40">{index + 1} / {test.questions.length}</span>{test.mode === "full" && <span className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-sm ${secondsLeft < 300 ? "border-red-400/30 text-red-300" : "border-[#c8ff38]/25 text-[#c8ff38]"}`}><Clock3 className="size-4" />{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span>}</div></div><Progress value={((index + 1) / test.questions.length) * 100} className="h-1 rounded-full bg-white/7 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[#c8ff38]" /></header>
    <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-7 lg:grid-cols-[220px_minmax(0,1fr)_250px] lg:py-7">
      <aside className="hidden lg:block"><div className="sticky top-24 rounded-[24px] border border-white/10 bg-[#0f1210] p-4"><p className="text-xs font-semibold uppercase tracking-[.15em] text-white/30">Навігація</p><div className="mt-4 grid grid-cols-5 gap-2">{test.questions.map((item, itemIndex) => { const isCurrent = itemIndex === index; const checked = Boolean(reveals[item.id]); const marked = flagged.has(item.id); return <button key={item.id} disabled={!checked && !isCurrent} onClick={() => setIndex(itemIndex)} className={`relative grid aspect-square place-items-center rounded-lg border text-xs transition disabled:cursor-not-allowed ${isCurrent ? "border-[#c8ff38] bg-[#c8ff38] font-bold text-black" : checked ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200" : "border-white/8 bg-white/[.025] text-white/28"}`}>{itemIndex + 1}{marked && <span className="absolute right-0 top-0 size-1.5 bg-amber-300" />}</button>; })}</div><div className="mt-5 space-y-2 border-t border-white/8 pt-4 text-xs text-white/35"><p><span className="mr-2 inline-block size-2 bg-[#c8ff38]" />Поточне</p><p><span className="mr-2 inline-block size-2 bg-emerald-400/60" />Перевірено</p><p><span className="mr-2 inline-block size-2 bg-amber-300" />Позначено</p></div></div></aside>
      <section className="min-w-0"><article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111412] shadow-[0_24px_80px_rgba(0,0,0,.32)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/9 px-5 py-4 sm:px-8"><p className="text-sm text-[#c8ff38]">{question.topic}</p><div className="flex items-center gap-3"><span className="text-xs uppercase tracking-[.12em] text-white/28">{formatLabel}</span><button onClick={toggleFlag} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${flagged.has(question.id) ? "border-amber-300/40 bg-amber-300/10 text-amber-200" : "border-white/9 text-white/35 hover:text-white"}`}><Flag className="size-3.5" /> Позначити</button></div></div><div className="p-5 sm:p-8 lg:p-10"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/28">Завдання {index + 1}</p><h1 className="mt-4 whitespace-pre-line text-xl font-medium leading-8 sm:text-2xl sm:leading-9">{question.prompt.replaceAll("\\(", "").replaceAll("\\)", "")}</h1>{images.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{images.map((src) => <img key={src} src={src} alt="Ілюстрація до завдання" className="max-h-80 w-full bg-white object-contain p-2" />)}</div>}{answerControl}{reveal && <div className={`mt-7 border-l-4 p-5 ${reveal.isCorrect ? "border-emerald-400 bg-emerald-400/[.07]" : "border-amber-300 bg-amber-300/[.06]"}`}><div className="flex flex-wrap items-center justify-between gap-3"><p className={`font-medium ${reveal.isCorrect ? "text-emerald-300" : "text-amber-200"}`}>{reveal.isCorrect ? "Правильна відповідь" : "Відповідь перевірено"}</p><span className="text-sm text-white/45">{reveal.points}/{reveal.maxPoints} тестових балів</span></div><p className="mt-3 text-sm text-white/65">Правильний варіант: <strong className="text-white">{prettyAnswer}</strong></p>{reveal.explanation && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/45">{reveal.explanation}</p>}</div>}{error && <p className="mt-5 text-sm text-red-300">{error}</p>}<div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="rounded-full text-white/48 hover:bg-white/[.06] hover:text-white"><ArrowLeft className="size-4" /> Назад</Button>{!reveal ? <Button disabled={!ready || revealing} onClick={revealAnswer} className="h-12 rounded-full bg-white px-6 text-black hover:bg-white/85">{revealing ? "Перевіряю…" : "Показати правильну відповідь"}</Button> : index < test.questions.length - 1 ? <Button onClick={() => setIndex((value) => value + 1)} className="h-12 rounded-full bg-white px-6 text-black hover:bg-[#c8ff38]">Наступне завдання <ArrowRight className="size-4" /></Button> : <Button disabled={sending} onClick={finish} className="h-12 rounded-full bg-[#c8ff38] px-6 text-black hover:bg-[#d7ff6b]">{sending ? "Підраховую…" : "Завершити тест"}</Button>}</div></div></article><p className="mt-4 text-center text-xs text-white/22">{question.attribution}</p></section>
      <aside><div className="sticky top-24 rounded-[24px] border border-white/10 bg-[#0f1210] p-5"><p className="text-xs font-semibold uppercase tracking-[.15em] text-white/30">Стан завдання</p><div className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between"><span className="text-white/38">Відповідь</span><strong className={ready ? "text-[#c8ff38]" : "text-white/35"}>{ready ? "Заповнено" : "Не заповнено"}</strong></div><div className="flex items-center justify-between"><span className="text-white/38">Перевірка</span><strong className={reveal ? "text-emerald-300" : "text-white/35"}>{reveal ? "Виконано" : "Очікує"}</strong></div><div className="flex items-center justify-between"><span className="text-white/38">Позначка</span><strong className={flagged.has(question.id) ? "text-amber-200" : "text-white/35"}>{flagged.has(question.id) ? "Є" : "Немає"}</strong></div></div><div className="mt-6 border-t border-white/8 pt-5"><p className="text-sm leading-6 text-white/38">Спочатку обери відповідь. Потім окремою кнопкою відкрий правильну — лише після цього стане доступним перехід далі.</p></div><div className="mt-5 grid grid-cols-10 gap-1.5 lg:hidden">{test.questions.map((item, itemIndex) => <span key={item.id} className={`aspect-square border ${itemIndex === index ? "border-[#c8ff38] bg-[#c8ff38]" : reveals[item.id] ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/8"}`} />)}</div></div></aside>
    </div>
  </main>;
}

function ResultScreen({ result, onContinue }: { result: TestResult; onContinue: () => void }) {
  const official = result.scaleKind === "official-2026";
  return <main className="grid min-h-screen place-items-center bg-[#080a09] p-5 text-white"><div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#111412] p-8 text-center"><span className="mx-auto grid size-16 place-items-center border border-[#c8ff38]/20 bg-[#c8ff38]/10 text-[#c8ff38]"><Trophy className="size-7" /></span><p className="mt-7 text-sm text-white/38">{official ? "Результат за таблицею НМТ-2026" : "Тренувальний індекс"}</p><h1 className="mt-2 text-7xl font-semibold tracking-[-.07em] text-[#c8ff38]">{result.score ?? "—"}</h1>{official && !result.passed && <p className="mt-3 font-medium text-amber-200">Пороговий бал не подолано</p>}<p className="mt-4 text-lg text-white/55">{result.rawScore} тестових балів із {result.rawMax}</p><p className="mt-1 text-sm text-white/35">повністю виконано {result.correct} із {result.total} завдань</p><p className="mt-6 text-sm leading-6 text-white/32">{official ? "Переведення 100–200 виконано за чинною таблицею МОН для НМТ-2026. Часткові бали нараховано за офіційними схемами УЦОЯО." : "Для тренування окремої теми показано індекс 100–200; офіційна таблиця застосовується лише до повного предметного тесту."}</p><Button onClick={onContinue} className="mt-8 h-13 w-full rounded-full bg-white text-black hover:bg-[#c8ff38]">До результатів <ArrowRight className="size-4" /></Button></div></main>;
}

export function SettingsView({ profile, signOutPath, signedIn, onSaved }: { profile: Profile; signOutPath: string; signedIn: boolean; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(profile.firstName || profile.displayName.split(/\s+/)[0] || "");
  const [lastName, setLastName] = useState(profile.lastName || profile.displayName.split(/\s+/).slice(1).join(" "));
  const [grade, setGrade] = useState(profile.grade || "11");
  const [fourthSubject, setFourthSubject] = useState(profile.fourthSubject || "english");
  const [targets, setTargets] = useState<Record<string, number>>(() => Object.fromEntries(subjects.map((subject) => [subject.slug, profile.subjectTargets?.[subject.slug] ?? profile.targetScore ?? 180])));
  const [message, setMessage] = useState("");
  const updateTarget = (slug: string, value: number) => setTargets((current) => ({ ...current, [slug]: value }));
  return <section>
    <p className="text-sm font-medium text-[#c8ff38]">Профіль і навчальні цілі</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Налаштування</h1>
    <p className="mt-3 max-w-2xl text-white/42">Ці дані зберігаються у твоєму профілі й допомагають Vekto показувати персональну ціль для кожного предмета.</p>
    <form className="mt-8 max-w-4xl space-y-5" onSubmit={async (event) => {
      event.preventDefault();
      setMessage("Зберігаю…");
      const response = await fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, grade, fourthSubject, subjectTargets: targets }) });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      setMessage(response.ok ? "Збережено" : payload.error ?? "Не вдалося зберегти");
      if (response.ok) onSaved();
    }}>
      <article className="rounded-[28px] border border-white/9 bg-[#111412] p-6 shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="mb-2 block text-sm text-white/60">Ім’я</span><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Твоє ім’я" className="h-13 rounded-2xl border-white/10 bg-white/[.035] px-4 text-white" /></label>
          <label><span className="mb-2 block text-sm text-white/60">Прізвище</span><Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Твоє прізвище" className="h-13 rounded-2xl border-white/10 bg-white/[.035] px-4 text-white" /></label>
          <label><span className="mb-2 block text-sm text-white/60">Клас</span><NativeSelect value={grade} onChange={(event) => setGrade(event.target.value)} className="h-13 w-full rounded-2xl border-white/10 bg-[#181b19] px-4 text-white"><NativeSelectOption value="9">9 клас</NativeSelectOption><NativeSelectOption value="10">10 клас</NativeSelectOption><NativeSelectOption value="11">11 клас</NativeSelectOption><NativeSelectOption value="graduate">Випускник / випускниця</NativeSelectOption></NativeSelect></label>
          <label><span className="mb-2 block text-sm text-white/60">Четвертий предмет</span><NativeSelect value={fourthSubject} onChange={(event) => setFourthSubject(event.target.value)} className="h-13 w-full rounded-2xl border-white/10 bg-[#181b19] px-4 text-white">{subjects.filter((subject) => ["english", "german", "biology", "geography"].includes(subject.slug)).map((subject) => <NativeSelectOption key={subject.slug} value={subject.slug}>{subject.name}</NativeSelectOption>)}</NativeSelect></label>
        </div>
      </article>
      <article className="rounded-[28px] border border-white/9 bg-[#111412] p-6 shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:p-8">
        <div><p className="text-sm text-white/40">Бажаний результат</p><h2 className="mt-1 text-2xl font-semibold">Ціль з кожного предмета</h2></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{subjects.map((subject) => <label key={subject.slug} className="rounded-2xl border border-white/8 bg-white/[.025] p-4"><span className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-white/78">{subject.name}</span><strong className="rounded-full bg-[#c8ff38]/12 px-2.5 py-1 text-[#c8ff38]">{targets[subject.slug]}</strong></span><input type="range" min="140" max="200" step="1" value={targets[subject.slug]} onChange={(event) => updateTarget(subject.slug, Number(event.target.value))} className="mt-4 w-full accent-[#c8ff38]" /></label>)}</div>
        <div className="mt-7 flex flex-wrap items-center gap-4"><Button className="rounded-full bg-[#c8ff38] px-7 text-[#11150a] hover:bg-[#d7ff6b]">Зберегти профіль</Button>{message && <span className="text-sm text-white/45">{message}</span>}</div>
      </article>
    </form>
    {signedIn ? <a href={signOutPath} target="_top" className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-red-300/70 hover:bg-red-400/10 hover:text-red-300"><LogOut className="size-4" /> Вийти з акаунта</a> : <p className="mt-5 text-sm text-white/30">Зараз використовується тимчасовий гостьовий профіль на цьому пристрої.</p>}
  </section>;
}

function Dashboard({ data, view, setView, onStart, onRefresh, signOutPath, signedIn }: { data: DashboardData; view: View; setView: (view: View) => void; onStart: (slug: string, mode?: "quick" | "full" | "topic", topicId?: number) => void; onRefresh: () => void; signOutPath: string; signedIn: boolean }) {
  const name = data.profile.displayName;
  const greetingName = data.profile.firstName || name.split(/\s+/)[0] || "Учень";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const date = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const mergedStats = subjects.map((subject) => data.subjects.find((item) => item.slug === subject.slug) ?? { slug: subject.slug, name: subject.name, tests: 0, accuracy: null });
  const weakest = [...mergedStats].filter((item) => item.tests > 0).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];
  return <main className="min-h-screen bg-[#090b0a] pb-32 text-white"><header className="sticky top-0 z-20 border-b border-white/8 bg-[#090b0a]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1380px] items-center justify-between px-5 py-4 sm:px-8"><Brand /><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium">{name}</p><p className="text-xs text-white/28">ціль: {data.profile.targetScore}+</p></div><span className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#171b18] text-sm font-semibold text-[#c8ff38]">{initials}</span></div></div></header><div className="mx-auto max-w-[1380px] px-5 py-10 sm:px-8 lg:py-12">
    {view === "home" && <><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm capitalize text-white/30">{date}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Привіт, {greetingName}.</h1><p className="mt-3 text-white/38">Твої цифри оновлюються після кожного завершеного тесту.</p></div><Button onClick={() => onStart(weakest?.slug ?? "mathematics")} className="h-12 rounded-full bg-[#c8ff38] px-6 text-black hover:bg-[#d5ff65]">Швидкий тест <ArrowRight className="size-4" /></Button></div><div className="mt-9 grid gap-4 md:grid-cols-3"><StatCard icon={Trophy} label="Середній бал" value={data.stats.averageScore == null ? "—" : String(data.stats.averageScore)} note={data.stats.completedTests ? "за всі завершені тести" : "з’явиться після першого тесту"} color="text-[#c8ff38]" /><StatCard icon={ClipboardCheck} label="Тестів пройдено" value={String(data.stats.completedTests)} note="лише завершені спроби" color="text-blue-400" /><StatCard icon={Flame} label="Серія занять" value={`${data.stats.streak} ${data.stats.streak === 1 ? "день" : "днів"}`} note="оновлюється щодня" color="text-orange-400" /></div><div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><article className="rounded-[26px] border border-white/8 bg-[#111412] p-6"><p className="text-sm text-white/35">Наступний крок</p><h2 className="mt-2 text-2xl font-semibold">{weakest ? `Підтягнути: ${weakest.name}` : "Пройти перший тест"}</h2><p className="mt-4 leading-7 text-white/38">{weakest ? `Поточна точність — ${weakest.accuracy}%. Vekto радить почати саме з цього предмета.` : "Обери предмет — після тесту тут з’явиться персональна рекомендація."}</p><Button onClick={() => onStart(weakest?.slug ?? "ukrainian")} className="mt-8 h-11 rounded-full bg-white px-5 text-black hover:bg-[#c8ff38]">Почати</Button></article><article className="rounded-[26px] border border-white/8 bg-white/[.025] p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/35">Активність</p><h2 className="mt-2 text-xl font-semibold">Останні 7 днів</h2></div><span className="text-sm text-[#c8ff38]">{data.weeklyActivity.filter((day) => day.active).length}/7</span></div><div className="mt-8 grid grid-cols-7 gap-2">{data.weeklyActivity.map((day) => <div key={day.date} className="text-center"><div className={`mx-auto h-24 w-full max-w-8 ${day.active ? "bg-[#c8ff38]" : "bg-white/[.06]"}`} /><span className="mt-2 block text-[11px] text-white/25">{new Intl.DateTimeFormat("uk-UA", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`))}</span></div>)}</div></article></div></>}
    {view === "tests" && <TestsView stats={mergedStats} onStart={onStart} />}
    {view === "results" && <section><p className="text-sm font-medium text-[#c8ff38]">Твоя історія</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Усі результати</h1>{data.recentAttempts.length ? <div className="mt-8 space-y-3">{data.recentAttempts.map((attempt) => <article key={attempt.id} className="flex flex-col gap-4 rounded-[22px] border border-white/8 bg-white/[.025] p-5 sm:flex-row sm:items-center"><div className="grid size-11 place-items-center border border-white/8 bg-white/[.04]"><ClipboardCheck className="size-5 text-[#c8ff38]" /></div><div className="flex-1"><h2 className="font-medium">{attempt.subject_name}</h2><p className="mt-1 text-sm text-white/32">{new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(`${attempt.completed_at}Z`))}</p></div><div className="text-left sm:text-right"><strong className="text-2xl text-[#c8ff38]">{attempt.score ?? "Не складено"}</strong><p className="text-sm text-white/32">{attempt.correct_answers}/{attempt.total_questions} правильно</p></div></article>)}</div> : <div className="mt-8 rounded-[26px] border border-dashed border-white/12 p-10 text-center"><BarChart3 className="mx-auto size-7 text-white/25" /><h2 className="mt-5 text-xl font-medium">Поки немає результатів</h2><p className="mt-2 text-white/35">Заверши перший тест — він з’явиться тут.</p><Button onClick={() => setView("tests")} className="mt-6 rounded-full bg-white px-5 text-black">Обрати тест</Button></div>}</section>}
    {view === "plan" && <section><p className="text-sm font-medium text-[#c8ff38]">Персональна рекомендація</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Мій план</h1><div className="mt-8 grid gap-4 lg:grid-cols-2"><article className="rounded-[26px] border border-white/8 bg-[#111412] p-7"><Target className="size-6 text-[#c8ff38]" /><h2 className="mt-7 text-2xl font-semibold">Ціль: {data.profile.targetScore}+</h2><p className="mt-3 leading-7 text-white/40">{weakest ? `Найбільший резерв зараз у предметі «${weakest.name}». Додай один короткий тест сьогодні.` : "Щоб скласти персональний план, Vekto потрібен хоча б один завершений тест."}</p>{weakest && <Button onClick={() => onStart(weakest.slug)} className="mt-7 rounded-full bg-[#c8ff38] px-5 text-black">Тренуватися</Button>}</article><article className="rounded-[26px] border border-white/8 bg-white/[.025] p-7"><p className="text-sm text-white/35">Принцип плану</p><div className="mt-6 space-y-5">{["Спочатку — предмет із найнижчою точністю", "Потім — повторення сильних тем", "Кожен результат одразу змінює рекомендацію"].map((text, index) => <div key={text} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center border border-white/8 text-sm text-white/45">{index + 1}</span><p className="pt-1 text-white/55">{text}</p></div>)}</div></article></div></section>}
    {view === "settings" && <SettingsView profile={data.profile} signOutPath={signOutPath} signedIn={signedIn} onSaved={onRefresh} />}
  </div><nav className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-24px)] max-w-[620px] -translate-x-1/2 items-center justify-between rounded-[24px] border border-white/10 bg-[#131614]/92 p-2 shadow-2xl backdrop-blur-xl" aria-label="Швидкий доступ">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2.5 transition ${view === id ? "rounded-[18px] bg-white/[.09] text-white" : "text-white/35 hover:text-white"}`}><Icon className={`size-5 ${view === id ? "text-[#c8ff38]" : ""}`} /><span className="truncate text-[11px] sm:text-xs">{label}</span></button>)}</nav></main>;
}

export default function VektoApp({ initialIdentity, signOutPath }: { initialIdentity: { userId: string; email: string } | null; signInPath: string; signOutPath: string }) {
  const [screen, setScreen] = useState<Screen>(initialIdentity ? "app" : "landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [view, setView] = useState<View>("home");
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [startError, setStartError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    if (response.ok) { const payload = await response.json() as DashboardData; setDashboard(payload); setProfile(payload.profile); setScreen("app"); }
  }, []);

  useEffect(() => {
    if (!initialIdentity) return;
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [initialIdentity, refresh]);

  useEffect(() => {
    const modelContext = (document as unknown as { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({ name: "open_vekto_section", title: "Відкрити розділ Vekto", description: "Відкрити у видимому інтерфейсі огляд, тести, результати, план або налаштування Vekto.", inputSchema: { type: "object", properties: { section: { type: "string", enum: ["home", "tests", "results", "plan", "settings"] } }, required: ["section"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, async execute(input: unknown) { const section = (input as { section?: View })?.section; if (!section || !navItems.some((item) => item.id === section)) throw new Error("Невідомий розділ"); if (!initialIdentity) await fetch("/api/session", { method: "POST" }); setScreen("app"); setView(section); await refresh(); return { screen: "app", section }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [initialIdentity, refresh]);

  const startTest = async (slug: string, mode: "quick" | "full" | "topic" = "quick", topicId?: number) => {
    setLoadingTest(true); setStartError("");
    const response = await fetch("/api/tests/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: slug, mode, topicId, limit: 10 }) });
    const payload = await response.json() as ActiveTest & { error?: string };
    setLoadingTest(false);
    if (response.ok) setActiveTest(payload); else setStartError(payload.error ?? "Не вдалося сформувати тест");
  };
  const beginGuest = async () => { setScreen("app"); const response = await fetch("/api/session", { method: "POST" }); if (response.ok) await refresh(); };
  const completed = async (nextResult: TestResult) => { setActiveTest(null); setResult(nextResult); await refresh(); };
  const ready = useMemo(() => profile && dashboard, [profile, dashboard]);

  if (activeTest) return <TestPlayer test={activeTest} onClose={() => setActiveTest(null)} onCompleted={completed} />;
  if (result) return <ResultScreen result={result} onContinue={() => { setResult(null); setView("results"); }} />;
if (screen === "app" && ready) return <><Dashboard data={ready} view={view} setView={setView} onStart={startTest} onRefresh={refresh} signOutPath={signOutPath} signedIn={Boolean(initialIdentity)} />{loadingTest && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 text-white backdrop-blur-sm"><div className="border border-white/10 bg-[#151815] px-5 py-3 text-sm"><span className="mr-3 inline-block size-2 animate-pulse bg-[#c8ff38]" />Вибираю завдання з бази…</div></div>}{startError && <button onClick={() => setStartError("")} className="fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 border border-red-400/25 bg-[#211313] px-5 py-3 text-sm text-red-200 shadow-2xl">{startError}<X className="size-4" /></button>}</>;
  if (screen === "app") return <main className="grid min-h-screen place-items-center bg-[#080a09] text-white"><p className="text-white/40">Завантажую кабінет…</p></main>;
  return <Landing onStart={beginGuest} />;
}
