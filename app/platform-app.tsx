"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ChartNoAxesCombined,
  BookOpen,
  Timer,
  Settings,
  LayoutDashboard,
  Check,
  Flag,
  Play,
  Target,
  Flame,
  ChevronRight,
  Download,
  ShieldCheck,
  Clock,
  CheckCircle2,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { normalizeAnswer } from "@/lib/nmt-scoring";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./platform.css";

type Row = Record<string, any>;
const icons = [LayoutDashboard, BookOpen, Timer, ChartNoAxesCombined, Settings];
const views = ["overview", "practice", "simulation", "history", "settings"];
const names = ["Огляд", "Практика", "Симуляція", "Результати", "Профіль"];
const tones = [
  "#b5c9ff",
  "#c8ff78",
  "#ffd6a0",
  "#cfbaff",
  "#efb5cc",
  "#96d8c7",
  "#a1d9ed",
];
const requiredSubjectSlugs = ["ukrainian", "mathematics", "history"];
const fourthSubjectSlugs = ["english", "german", "biology", "geography"];
const formats: Record<string, string> = {
  single_choice: "Одна правильна відповідь",
  matching: "Установлення відповідності",
  ordering: "Хронологічна послідовність",
  multiple_choice: "Три правильні відповіді",
  numeric: "Коротка числова відповідь",
  type_6: "Вибір із трьох груп",
  language_matching: "Установлення відповідності",
  gap_fill: "Заповнення пропусків",
};
async function api(path = "/api/platform", body?: Row): Promise<Row> {
  const res = await fetch(
    path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  const data = (await res.json()) as Row;
  if (!res.ok)
    throw Error(data.error || "Не вдалося з’єднатися. Спробуй ще раз.");
  return data;
}
function Rich({ text }: { text: string }) {
  const parts = (text || "").split(
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g,
  );
  return (
    <span className="rich">
      {parts.map((p, i) => {
        if (/^\$|^\\[([]/.test(p)) {
          const block = p.startsWith("$$") || p.startsWith("\\[");
          const source = p.startsWith("$")
            ? p.slice(block ? 2 : 1, block ? -2 : -1)
            : p.slice(2, -2);
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(source, {
                  throwOnError: false,
                  trust: false,
                  displayMode: block,
                }),
              }}
            />
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
function Pictures({ images }: { images?: string[] }) {
  return (
    <>
      {images?.map((src, i) => (
        <img
          className="question-image"
          src={src}
          alt={`Ілюстрація до завдання ${i + 1}`}
          key={src}
        />
      ))}
    </>
  );
}
function displayAnswer(item: Row, value: string) {
  if (!value) return "Не надано";
  if (item.type === "numeric") return value;
  const marker = (v: string) =>
    item.options
      .flatMap((g: Row) => g.options)
      .find((o: Row) => normalizeAnswer(o.marker) === normalizeAnswer(v))
      ?.marker ?? v;
  return value
    .split(";")
    .map((v, i) =>
      item.type === "matching"
        ? `${v[0]} → ${marker(v.slice(1))}`
        : item.type === "type_6"
          ? `${i + 1}: ${v || "—"}`
          : marker(v) || "—",
    )
    .join(" · ");
}
function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function PlatformApp({
  signOutPath,
  initialIdentity,
}: {
  signOutPath: string;
  initialIdentity: Row | null;
  signInPath: string;
}) {
  const [data, setData] = useState<Row | null>(null),
    [view, setView] = useState("overview"),
    [run, setRun] = useState<Row | null>(null),
    [subject, setSubject] = useState("mathematics"),
    [section, setSection] = useState(""),
    [topic, setTopic] = useState(""),
    [count, setCount] = useState(10),
    [fourth, setFourth] = useState("english"),
    [agreed, setAgreed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const d = await api();
    setData(d);
    setFourth(d.profile.fourth_subject);
  }, []);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        await api("/api/session", {});
        await Promise.all(
          [
            "mathematics",
            "ukrainian",
            "history",
            "english",
            "german",
            "biology",
            "geography",
          ].map((subject) => api("/api/platform/bootstrap", { subject })),
        );
        const d = await api();
        if (!live) return;
        setData(d);
        setFourth(d.profile.fourth_subject);
        const saved = new URL(location.href).searchParams.get("session");
        if (saved)
          setRun(
            await api(`/api/platform?session=${encodeURIComponent(saved)}`),
          );
      } catch (e) {
        if (live) setError((e as Error).message);
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  const action = async (p: Row) => {
    setError("");
    setBusy(true);
    try {
      const result = await api("/api/platform", p);
      setRun(result);
      history.replaceState(null, "", `?session=${result.id}`);
      return result;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  const open = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      setRun(await api(`/api/platform?session=${encodeURIComponent(id)}`));
      history.replaceState(null, "", `?session=${id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const leave = () => {
    setView(run?.status === "completed" ? "history" : "overview");
    setRun(null);
    history.replaceState(null, "", "/");
    refresh().catch((e) => setError(e.message));
  };
  if (!data)
    return (
      <main className="platform boot">
        <span className="brand">
          v<span>↗</span> vekto
        </span>
        <h1>
          {error
            ? "Не вдалося завантажити платформу"
            : "Твій простір підготовки"}
        </h1>
        <p>{error || "Завантажуємо предмети та твій прогрес…"}</p>
        {error && (
          <Button onClick={() => location.reload()}>Спробувати ще раз</Button>
        )}
      </main>
    );
  const selected =
    data.subjects.find((s: Row) => s.slug === subject) ?? data.subjects[0];
  const sections = [
    ...new Set<string>(selected.topics.map((t: Row) => t.section_name)),
  ];
  const topics = selected.topics.filter(
    (t: Row) => !section || t.section_name === section,
  );
  const available = topics
    .filter((t: Row) => !topic || String(t.id) === topic)
    .reduce((n: number, t: Row) => n + t.question_count, 0);
  const profile = {
    displayName: data.profile.display_name,
    firstName: data.profile.first_name,
    lastName: data.profile.last_name,
    grade: data.profile.grade,
    fourthSubject: data.profile.fourth_subject,
    subjectTargets: JSON.parse(data.profile.subject_targets_json || "{}"),
    targetScore: data.profile.target_score,
    onboardingCompleted: Boolean(data.profile.onboarding_completed),
  };
  const practice = (slug: string) => {
    setSubject(slug);
    setSection("");
    setTopic("");
    setView("practice");
  };
  const stats = data.stats;
  if (!run && !profile.onboardingCompleted)
    return (
      <div className="platform onboarding-shell">
        <ProfileSetup
          profile={profile}
          subjects={data.subjects}
          onboarding
          onSaved={() => refresh().catch((e) => setError(e.message))}
        />
      </div>
    );
  return (
    <div className="platform">
      {!run && (
        <>
          <aside className="sidebar">
            <a href="/" className="brand">
              <span className="brand-mark">v↗</span> vekto
              <span className="brand-dot">.</span>
            </a>
            <span className="sidebar-label">ТВІЙ ПРОСТІР</span>
            <nav>
              {views.map((v, i) => {
                const Icon = icons[i];
                return (
                  <button
                    className={view === v ? "active" : ""}
                    key={v}
                    onClick={() => setView(v)}
                  >
                    <Icon size={20} />
                    {names[i]}
                    {v === "simulation" && (
                      <span className="tiny-tag">НМТ</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="sidebar-note">
              <ShieldCheck size={22} />
              <strong>Знання, а не вгадування</strong>
              <p>
                Практикуйся у своєму темпі. Кожна відповідь наближає до цілі.
              </p>
              <a href="/downloads/vekto-question-bank.sqlite" download>
                <Download size={15} /> База запитань
              </a>
            </div>
            <button
              className="profile-link"
              onClick={() => setView("settings")}
            >
              <span className="avatar">
                {profile.firstName.slice(0, 1) || "В"}
              </span>
              <span>
                <strong>{profile.firstName || "Твій профіль"}</strong>
                <small>
                  {profile.grade === "graduate"
                    ? "Випускник"
                    : `${profile.grade} клас`}{" "}
                  · Моя підготовка
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          </aside>
          <nav className="mobile-nav">
            {views.map((v, i) => {
              const Icon = icons[i];
              return (
                <button
                  key={v}
                  className={view === v ? "active" : ""}
                  onClick={() => setView(v)}
                >
                  <Icon size={20} />
                  <span>{names[i]}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}
      <main className={run ? "platform-main player-main" : "platform-main"}>
        {!run && (
          <header className="topbar">
            <span>
              Vekto · Підготовка до НМТ <span className="year">2026</span>
            </span>
            <span className="save-state">
              <span />
              Прогрес зберігається
            </span>
          </header>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <TriangleAlert size={20} />
            {error}
            <button
              aria-label="Закрити повідомлення"
              onClick={() => setError("")}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {run ? (
          <Player
            run={run}
            setRun={setRun}
            busy={busy}
            action={action}
            leave={leave}
            setError={setError}
          />
        ) : (
          <>
            {view === "overview" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">КРОК ЗА КРОКОМ ДО СВОЄЇ ЦІЛІ</p>
                    <h1>
                      Привіт, {profile.firstName || "друже"}{" "}
                      <span className="lime">↗</span>
                    </h1>
                    <p>
                      Твій наступний результат починається з практики сьогодні.
                    </p>
                  </div>
                  <span className="date-label">
                    {new Date().toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                <div className="overview-grid">
                  <section className="hero-card">
                    <div className="hero-content">
                      <span className="pill">ТВОЯ ВЕЛИКА РЕПЕТИЦІЯ</span>
                      <h2>
                        Відчуй НМТ.
                        <br />
                        До справжнього НМТ.
                      </h2>
                      <p>
                        Чотири предмети. Два етапи. Реальний таймер.
                        <br />
                        Зосередься на завданнях — решту ми підготували.
                      </p>
                      <Button
                        className="primary"
                        onClick={() => setView("simulation")}
                      >
                        Спробувати симуляцію <ArrowUpRight size={18} />
                      </Button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <span>↗</span>
                      <div className="art-caption">ТВІЙ ВЕКТОР РОСТУ</div>
                    </div>
                  </section>
                  <section className="daily-card">
                    <div className="icon-bubble">
                      <Target />
                    </div>
                    <span className="eyebrow">МАЛЕНЬКИЙ КРОК СЬОГОДНІ</span>
                    <h3>
                      10 запитань.
                      <br />
                      Більше впевненості.
                    </h3>
                    <p>
                      Почни з математики або обери тему, яку хочеш підтягнути.
                    </p>
                    <button
                      className="text-link"
                      onClick={() => practice("mathematics")}
                    >
                      Почати практику <ArrowRight size={18} />
                    </button>
                  </section>
                </div>
                <div className="stat-grid">
                  {[
                    [BookOpen, stats.tests, "Завершених тестів"],
                    [CheckCircle2, stats.questions, "Опрацьованих завдань"],
                    [
                      Target,
                      stats.maximum
                        ? `${Math.round((stats.earned / stats.maximum) * 100)}%`
                        : "—",
                      "Набрано тестових балів",
                    ],
                    [Flame, stats.streak, "Днів поспіль із тестами"],
                  ].map(([Icon, value, label], i) => {
                    const I = Icon as typeof BookOpen;
                    return (
                      <article className="stat-card" key={i}>
                        <I size={20} />
                        <strong>{String(value ?? 0)}</strong>
                        <span>{String(label)}</span>
                      </article>
                    );
                  })}
                </div>
                {data.active.length > 0 && (
                  <section className="resume">
                    <div>
                      <span className="eyebrow">ТИ ВЖЕ ПОЧАВ</span>
                      <h3>{data.active[0].title}</h3>
                      <p>
                        Відповіді збережені. Таймер симуляції продовжує йти.
                      </p>
                    </div>
                    <Button
                      disabled={busy}
                      onClick={() => open(data.active[0].id)}
                    >
                      Продовжити <ArrowRight size={17} />
                    </Button>
                  </section>
                )}
                <div className="section-heading">
                  <div>
                    <h2>Твої предмети</h2>
                    <p>Від конкретної теми до впевненого результату.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setView("practice")}
                  >
                    Усі теми <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="subject-grid">
                  {data.subjects.map((s: Row, i: number) => (
                    <button
                      className="subject-card"
                      key={s.slug}
                      onClick={() => practice(s.slug)}
                    >
                      <span
                        className="subject-symbol"
                        style={{ color: tones[i], background: `${tones[i]}12` }}
                      >
                        {["∑", "Ї", "Aa", "⌛", "Ä", "❋", "◎"][i]}
                      </span>
                      <ChevronRight className="subject-arrow" size={18} />
                      <h3>{s.name}</h3>
                      <p>
                        {s.question_count} завдань · {s.topics.length} підтем
                      </p>
                      <div className="subject-footer">
                        <span>{s.required ? "Обов’язковий" : "На вибір"}</span>
                        <span>
                          {s.required || s.slug === profile.fourthSubject
                            ? `Ціль ${profile.subjectTargets[s.slug] ?? 180}`
                            : "Для практики"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {view === "practice" && (
              <>
                <Heading
                  label="ТВОЯ ПРАКТИКА"
                  title="Тренуй саме те, що потрібно."
                  text="Обери предмет і тему. Завдання беруться з готової бази; спочатку — ті, яких ти ще не бачив."
                />
                <div className="practice-layout">
                  <section className="panel setup">
                    <label>
                      Предмет
                      <select
                        value={selected.slug}
                        onChange={(e) => {
                          setSubject(e.target.value);
                          setSection("");
                          setTopic("");
                        }}
                      >
                        {data.subjects.map((s: Row) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Тема
                      <select
                        value={section}
                        onChange={(e) => {
                          setSection(e.target.value);
                          setTopic("");
                        }}
                      >
                        <option value="">Усі теми</option>
                        {sections.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Підтема
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option value="">Усі підтеми</option>
                        {topics.map((t: Row) => (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={!t.question_count}
                          >
                            {t.name} · {t.question_count}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Кількість запитань
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                      />
                    </label>
                    <div className="count-options">
                      {[5, 10, 20, 30].map((n) => (
                        <button
                          key={n}
                          className={count === n ? "selected" : ""}
                          onClick={() => setCount(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="info-note">
                      <ShieldCheck size={18} />
                      <span>
                        {available} доступних завдань.{" "}
                        {count > available
                          ? "Тест міститиме лише доступну кількість, без штучних повторів."
                          : "Відповіді та пояснення можна відкрити після збереження відповіді."}
                      </span>
                    </div>
                    <Button
                      className="primary full"
                      disabled={busy || !available || count < 1 || count > 100}
                      onClick={() =>
                        action({
                          action: "start",
                          mode: "practice",
                          subject: selected.slug,
                          section,
                          topicId: topic,
                          count,
                        })
                      }
                    >
                      {busy
                        ? "Завантажуємо завдання з бази…"
                        : "Почати тренування"}
                      <Play size={17} />
                    </Button>
                  </section>
                  <section className="panel syllabus">
                    <div className="section-heading">
                      <div>
                        <h2>Програма предмета</h2>
                        <p>Тема → підтема → завдання</p>
                      </div>
                      <span className="pill">
                        {selected.question_count} завдань
                      </span>
                    </div>
                    {sections.map((s) => {
                      const ts = selected.topics.filter(
                        (t: Row) => t.section_name === s,
                      );
                      return (
                        <details key={s} open={section === s || undefined}>
                          <summary>
                            {s}
                            <span>
                              {ts.reduce(
                                (n: number, t: Row) => n + t.question_count,
                                0,
                              )}
                            </span>
                          </summary>
                          <div className="topic-list">
                            {ts.map((t: Row) => (
                              <button
                                key={t.id}
                                disabled={!t.question_count}
                                onClick={() => {
                                  setSection(s);
                                  setTopic(String(t.id));
                                }}
                                className={
                                  topic === String(t.id) ? "selected" : ""
                                }
                              >
                                <span>{t.name}</span>
                                <small>
                                  {t.question_count
                                    ? `${t.question_count} завдань`
                                    : "Ще наповнюємо"}
                                </small>
                              </button>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                    <p className="fine-print">
                      Кількість показує доступні записи після вилучення
                      технічних дублів. Повнота наповнення тем різна; авторські
                      вправи позначені окремо від завдань НМТ.
                    </p>
                  </section>
                </div>
              </>
            )}
            {view === "simulation" && (
              <>
                <Heading
                  label="ГЕНЕРАЛЬНА РЕПЕТИЦІЯ · НМТ–2026"
                  title="Один іспит. Твій справжній темп."
                  text="Пройди всі чотири предмети з правилами, часом і типами завдань офіційного НМТ."
                />
                <div className="simulation-layout">
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Маршрут іспиту</h2>
                      <Timer className="lime" />
                    </div>
                    <div className="stage-card">
                      <span className="stage-number">01</span>
                      <div>
                        <span className="eyebrow">ПЕРШИЙ ЕТАП · 120 ХВ</span>
                        <h3>Українська мова + математика</h3>
                        <p>
                          30 + 22 завдання · вільне перемикання між предметами
                        </p>
                      </div>
                    </div>
                    <div className="break-line">
                      <Clock size={16} /> Перерва 20 хвилин
                    </div>
                    <div className="stage-card">
                      <span className="stage-number">02</span>
                      <div>
                        <span className="eyebrow">ДРУГИЙ ЕТАП · 120 ХВ</span>
                        <h3>Історія України + предмет на вибір</h3>
                        <p>
                          30 +{" "}
                          {
                            data.subjects.find((s: Row) => s.slug === fourth)
                              ?.config.count
                          }{" "}
                          завдань · повернутися до першого етапу не можна
                        </p>
                      </div>
                    </div>
                    <div className="exam-rules">
                      <h3>Як усе працює</h3>
                      <p>
                        <Check size={17} /> Відповідь зараховується після
                        натискання «Зберегти відповідь».
                      </p>
                      <p>
                        <Check size={17} /> Можна пропускати завдання, ставити
                        позначки й повертатися до них у межах етапу.
                      </p>
                      <p>
                        <Check size={17} /> Час не зупиняється після закриття
                        вкладки. Коли він спливає, етап завершується.
                      </p>
                      <p>
                        <Check size={17} /> Правильні відповіді та бали — після
                        завершення всього тесту.
                      </p>
                    </div>
                  </section>
                  <section className="panel setup">
                    <span className="icon-bubble">
                      <Timer />
                    </span>
                    <h2>Готовий перевірити себе?</h2>
                    <div className="chosen-fourth">
                      <span>Твій четвертий предмет</span>
                      <strong>
                        {
                          data.subjects.find((s: Row) => s.slug === fourth)
                            ?.name
                        }
                      </strong>
                      <button
                        className="text-link"
                        onClick={() => setView("settings")}
                      >
                        Змінити у профілі <ArrowRight size={15} />
                      </button>
                    </div>
                    <p>
                      Симуляція складається з оприлюднених варіантів НМТ 2025
                      року, що відповідають структурі 2026 року. Варіанти
                      обираються випадково з перевагою раніше не пройдених.
                      Спільні тексти не розриваються.
                    </p>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />{" "}
                      Я ознайомився з правилами й маю час на два етапи та
                      перерву.
                    </label>
                    <Button
                      className="primary full"
                      disabled={!agreed || busy}
                      onClick={() =>
                        action({
                          action: "start",
                          mode: "simulation",
                          fourthSubject: fourth,
                        })
                      }
                    >
                      {busy
                        ? "Завантажуємо варіант із бази…"
                        : "Розпочати симуляцію"}
                      <ArrowRight size={18} />
                    </Button>
                    <a
                      className="text-link"
                      href="https://lv.testportal.gov.ua/?p=2888"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Офіційна інструкція УЦОЯО <ArrowUpRight size={15} />
                    </a>
                  </section>
                </div>
              </>
            )}
            {view === "history" && (
              <>
                <Heading
                  label="ТВОЯ ДИНАМІКА"
                  title="Результати, що мають значення."
                  text="Лише завершені тести та фактично збережені відповіді. Для практики — відсоток балів, для симуляції — шкала НМТ."
                />
                {data.history.length ? (
                  <div className="history-layout">
                    <section className="panel">
                      <h2>Історія тестів</h2>
                      {data.history.map((h: Row) => (
                        <button
                          className="history-row"
                          onClick={() => open(h.id)}
                          key={h.id}
                        >
                          <span className="icon-bubble">
                            {h.mode === "simulation" ? <Timer /> : <BookOpen />}
                          </span>
                          <span>
                            <strong>{h.title}</strong>
                            <small>
                              {new Date(h.completed_at).toLocaleString("uk-UA")}{" "}
                              · {h.result.count} завдань
                            </small>
                          </span>
                          <span className="history-score">
                            {Math.round(
                              (h.result.earned / h.result.maximum) * 100,
                            )}
                            %
                            <small>
                              {h.result.earned}/{h.result.maximum} балів
                            </small>
                          </span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </section>
                    <section className="panel">
                      <h2>На що звернути увагу</h2>
                      <p>Підтеми з найнижчою часткою набраних балів.</p>
                      {data.topicStats.map((t: Row) => (
                        <button
                          className="weak-topic"
                          key={`${t.subject_slug}${t.name}`}
                          onClick={() => {
                            practice(t.subject_slug);
                            const found = data.subjects
                              .find((s: Row) => s.slug === t.subject_slug)
                              ?.topics.find((v: Row) => v.name === t.name);
                            if (found) {
                              setTopic(String(found.id));
                              setSection(found.section_name);
                            }
                          }}
                        >
                          <span>{t.name}</span>
                          <strong>
                            {Math.round((t.earned / t.maximum) * 100)}%
                          </strong>
                          <div className="meter">
                            <i
                              style={{
                                width: `${(t.earned / t.maximum) * 100}%`,
                              }}
                            />
                          </div>
                        </button>
                      ))}
                    </section>
                  </div>
                ) : (
                  <Empty title="Твоя історія ще попереду">
                    Заверши перше тренування — тут з’являться бали, відповіді та
                    теми для повторення.
                  </Empty>
                )}
                {stats.legacy > 0 && (
                  <p className="fine-print">
                    З попередньої версії збережено {stats.legacy} завершених
                    тестів. Їхні старі оцінки не змішуються з новою перевіреною
                    статистикою.
                  </p>
                )}
              </>
            )}
            {view === "settings" && (
              <>
                <ProfileSetup
                  profile={profile}
                  subjects={data.subjects}
                  signOutPath={signOutPath}
                  signedIn={!!initialIdentity}
                  onSaved={() => refresh().catch((e) => setError(e.message))}
                />
                <p className="fine-print">
                  Реєстрація тимчасово вимкнена. Прогрес зберігається в базі за
                  профілем цього браузера. Видалення cookies призведе до втрати
                  доступу до гостьового профілю; синхронізація між пристроями
                  наразі недоступна.
                </p>
              </>
            )}
            <footer className="platform-footer">
              <span>vekto. Знання задають напрям.</span>
              <span>
                Самостійна платформа підготовки · не офіційний сервіс УЦОЯО
              </span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function ProfileSetup({
  profile,
  subjects,
  onboarding = false,
  signOutPath,
  signedIn = false,
  onSaved,
}: {
  profile: Row;
  subjects: Row[];
  onboarding?: boolean;
  signOutPath?: string;
  signedIn?: boolean;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(
      profile.firstName === "Учень" ? "" : profile.firstName || "",
    ),
    [lastName, setLastName] = useState(profile.lastName || ""),
    [grade, setGrade] = useState(profile.grade || "11"),
    [fourthSubject, setFourthSubject] = useState(
      profile.fourthSubject || "english",
    ),
    [targets, setTargets] = useState<Row>(() => ({
      ...profile.subjectTargets,
    })),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const chosenSlugs = [...requiredSubjectSlugs, fourthSubject];
  const chosenSubjects = chosenSlugs
    .map((slug) => subjects.find((subject) => subject.slug === slug))
    .filter(Boolean) as Row[];
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const selectedTargets = Object.fromEntries(
      chosenSlugs.map((slug) => [slug, Number(targets[slug] ?? 180)]),
    );
    try {
      const response = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          grade,
          fourthSubject,
          subjectTargets: selectedTargets,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as Row;
      if (!response.ok)
        throw Error(payload.error || "Не вдалося зберегти профіль");
      setMessage("Збережено");
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className={onboarding ? "onboarding" : "profile-settings"}>
      <header className="profile-setup-heading">
        {onboarding && (
          <a href="/" className="brand">
            <span className="brand-mark">v↗</span> vekto
            <span className="brand-dot">.</span>
          </a>
        )}
        <div>
          <p className="eyebrow">
            {onboarding ? "ПЕРШЕ НАЛАШТУВАННЯ" : "ПРОФІЛЬ І ЦІЛІ"}
          </p>
          <h1>
            {onboarding ? "Налаштуй свій НМТ." : "Твій навчальний маршрут."}
          </h1>
          <p>
            Обери четвертий предмет і задай цілі лише для чотирьох тестів, які
            складатимеш.
          </p>
        </div>
        {onboarding && <span className="setup-step">01 / 02</span>}
      </header>
      <form className="profile-setup-grid" onSubmit={save}>
        <section className="panel identity-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ПРО ТЕБЕ</span>
              <h2>Як до тебе звертатися?</h2>
            </div>
            <span className="step-chip">1</span>
          </div>
          <div className="form-grid">
            <label>
              Ім’я
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                placeholder="Наприклад, Марія"
                required
                minLength={2}
                maxLength={40}
              />
            </label>
            <label>
              Прізвище
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
                placeholder="Наприклад, Коваль"
                required
                minLength={2}
                maxLength={40}
              />
            </label>
            <label className="wide-field">
              Клас
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              >
                <option value="9">9 клас</option>
                <option value="10">10 клас</option>
                <option value="11">11 клас</option>
                <option value="graduate">Випускник / випускниця</option>
              </select>
            </label>
          </div>
        </section>
        <section className="panel subject-choice-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ТВІЙ ВИБІР</span>
              <h2>Четвертий предмет</h2>
              <p>Три обов’язкові вже додані. Обери ще один.</p>
            </div>
            <span className="step-chip">2</span>
          </div>
          <div className="fourth-choice-grid">
            {fourthSubjectSlugs.map((slug, index) => {
              const item = subjects.find((subject) => subject.slug === slug);
              if (!item) return null;
              const active = fourthSubject === slug;
              return (
                <button
                  type="button"
                  key={slug}
                  aria-pressed={active}
                  className={active ? "selected" : ""}
                  onClick={() => {
                    setFourthSubject(slug);
                    setTargets((current) => ({
                      ...current,
                      [slug]: current[slug] ?? 180,
                    }));
                  }}
                >
                  <span>{["Aa", "Ä", "❋", "◎"][index]}</span>
                  <strong>{item.name}</strong>
                  <i>{active ? <Check size={16} /> : null}</i>
                </button>
              );
            })}
          </div>
        </section>
        <section className="panel goals-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">БАЖАНИЙ РЕЗУЛЬТАТ</span>
              <h2>Чотири цілі за шкалою 100–200</h2>
            </div>
            <span className="goal-average">
              Ø{" "}
              {Math.round(
                chosenSlugs.reduce(
                  (sum, slug) => sum + Number(targets[slug] ?? 180),
                  0,
                ) / chosenSlugs.length,
              )}
            </span>
          </div>
          <div className="goal-grid">
            {chosenSubjects.map((subject) => (
              <label key={subject.slug}>
                <span>
                  <strong>{subject.name}</strong>
                  <b>{targets[subject.slug] ?? 180}</b>
                </span>
                <input
                  type="range"
                  min="140"
                  max="200"
                  step="1"
                  value={targets[subject.slug] ?? 180}
                  onChange={(event) =>
                    setTargets((current) => ({
                      ...current,
                      [subject.slug]: Number(event.target.value),
                    }))
                  }
                />
                <small>
                  <span>140</span>
                  <span>200</span>
                </small>
              </label>
            ))}
          </div>
          <div className="profile-save-row">
            <p>
              Четвертий предмет: <strong>{chosenSubjects[3]?.name}</strong>
            </p>
            <Button className="primary" disabled={saving} type="submit">
              {saving
                ? "Зберігаємо…"
                : onboarding
                  ? "Увійти до Vekto"
                  : "Зберегти зміни"}
              <ArrowRight size={17} />
            </Button>
            {message && <span role="status">{message}</span>}
          </div>
        </section>
      </form>
      {!onboarding &&
        (signedIn ? (
          <a className="signout-link" href={signOutPath} target="_top">
            Вийти з акаунта
          </a>
        ) : (
          <p className="fine-print">
            Профіль і прогрес зберігаються для цього браузера. Реєстрація поки
            вимкнена.
          </p>
        ))}
    </main>
  );
}

function Heading({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Player({
  run,
  setRun,
  busy,
  action,
  leave,
  setError,
}: {
  run: Row;
  setRun: (r: Row) => void;
  busy: boolean;
  action: (p: Row) => Promise<Row | null>;
  leave: () => void;
  setError: (e: string) => void;
}) {
  const [index, setIndex] = useState(() =>
      Math.max(
        0,
        run.items.findIndex((i: Row) => i.position === run.current_index),
      ),
    ),
    [draft, setDraft] = useState(""),
    [confirm, setConfirm] = useState(false),
    [clock, setClock] = useState(Date.now()),
    [onlyErrors, setOnlyErrors] = useState(false);
  const [offset, setOffset] = useState(run.serverNow * 1000 - Date.now());
  const completed = run.status === "completed";
  const list = run.items.filter(
    (i: Row) => !onlyErrors || i.points < i.max_points,
  );
  const item = list[index] ?? list[0];
  const subjectNumber = (question: Row) =>
    run.items
      .filter(
        (candidate: Row) => candidate.subject_slug === question.subject_slug,
      )
      .findIndex(
        (candidate: Row) => candidate.question_id === question.question_id,
      ) + 1;
  const visibleSubjects = run.config.subjects.filter((subject: Row) =>
    list.some((question: Row) => question.subject_slug === subject.slug),
  );
  useEffect(() => {
    setDraft(item?.answer ?? "");
  }, [item?.question_id, item?.answer]);
  useEffect(() => {
    setOffset(run.serverNow * 1000 - Date.now());
  }, [run.serverNow]);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(
    0,
    (run.status === "break" ? run.break_until : run.deadline) * 1000 -
      clock -
      offset,
  );
  useEffect(() => {
    if (!run.deadline || completed || remaining > 0) return;
    api(`/api/platform?session=${run.id}`)
      .then(setRun)
      .catch((e) => setError(e.message));
  }, [remaining === 0, run.id, run.deadline, completed]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draft !== (item?.answer ?? "")) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft, item?.answer]);
  const send = (p: Row) =>
    action({
      ...p,
      id: run.id,
      revision: run.revision,
      questionId: p.questionId ?? item?.question_id,
    });
  const navigate = async (n: number) => {
    if (busy) return;
    if (
      draft !== (item?.answer ?? "") &&
      !window.confirm(
        "Ця відповідь ще не збережена. Перейти без її збереження?",
      )
    )
      return;
    setIndex(n);
    if (!completed)
      await send({ action: "navigate", questionId: list[n].question_id });
  };
  const returnHome = () => {
    if (
      draft !== (item?.answer ?? "") &&
      !window.confirm("Залишити незбережену відповідь?")
    )
      return;
    leave();
  };
  const clockText = () => {
    const seconds = Math.ceil(remaining / 1000);
    return `${Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0")}:${Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };
  const [reference, setReference] = useState(false);
  if (run.status === "break")
    return (
      <>
        <button className="text-link" onClick={returnHome}>
          <ArrowLeft size={18} /> До огляду
        </button>
        <section className="break-screen panel">
          <span className="icon-bubble">
            <Clock />
          </span>
          <p className="eyebrow">ПЕРШИЙ ЕТАП ЗАВЕРШЕНО</p>
          <h1>Час перепочити.</h1>
          <p>
            Відповіді першого етапу зафіксовані. Попереду — історія України й
            предмет на вибір.
          </p>
          <strong className="break-clock">{clockText()}</strong>
          <Button
            className="primary"
            disabled={remaining > 0 || busy}
            onClick={async () => {
              const next = await send({ action: "continue" });
              if (next) setIndex(0);
            }}
          >
            Перейти до другого етапу <ArrowRight size={18} />
          </Button>
          <p className="fine-print">
            Таймер другого етапу почнеться після натискання кнопки.
          </p>
        </section>
      </>
    );
  const answered = run.items.filter((i: Row) => i.answer).length;
  return (
    <>
      <header className="exam-header">
        <button className="text-link" onClick={returnHome}>
          <ArrowLeft size={18} /> {completed ? "До результатів" : "До огляду"}
        </button>
        <span>
          <strong>{run.title}</strong>
          <small>
            {completed
              ? "Розбір результату"
              : run.mode === "simulation"
                ? `Етап ${run.stage} з 2`
                : "Тренування без обмеження часу"}
          </small>
        </span>
        {run.deadline && !completed && (
          <span className={`exam-clock ${remaining < 300000 ? "urgent" : ""}`}>
            <Timer size={18} />
            {clockText()}
          </span>
        )}
      </header>
      {run.mode === "simulation" && (
        <section className="exam-stage-switch" aria-label="Етапи симуляції НМТ">
          {[
            {
              stage: 1,
              title: "Блок 1",
              subjects: "Українська мова · Математика",
            },
            {
              stage: 2,
              title: "Блок 2",
              subjects: `Історія України · ${run.config.subjects.find((subject: Row) => subject.stage === 2 && subject.slug !== "history")?.name ?? "Предмет на вибір"}`,
            },
          ].map((block) => {
            const active = !completed && run.stage === block.stage;
            const done = completed || run.stage > block.stage;
            return (
              <div
                key={block.stage}
                className={`${active ? "active" : ""} ${done ? "done" : ""}`}
                aria-current={active ? "step" : undefined}
              >
                <span>{done ? <Check size={16} /> : `0${block.stage}`}</span>
                <strong>{block.title}</strong>
                <small>{block.subjects}</small>
                <em>
                  {done ? "Завершено" : active ? "Зараз" : "Після перерви"}
                </em>
              </div>
            );
          })}
        </section>
      )}
      {completed && (
        <section className="result-banner">
          <div>
            <p className="eyebrow">ТЕСТ ЗАВЕРШЕНО</p>
            <h1>
              {Math.round((run.result.earned / run.result.maximum) * 100)}
              <span>%</span>
            </h1>
            <p>
              {run.result.earned} із {run.result.maximum} тестових балів
            </p>
          </div>
          <div className="result-subjects">
            {run.result.subjects.map((s: Row) => (
              <div key={s.slug}>
                <span>{s.name}</span>
                <strong>
                  {run.mode === "simulation"
                    ? (s.score ?? "Поріг не подолано")
                    : `${s.earned}/${s.maximum}`}
                </strong>
                <small>
                  {run.mode === "simulation"
                    ? `${s.earned}/${s.maximum} тестових балів · шкала 100–200`
                    : "тестових балів"}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      <nav className="exam-subject-tabs" aria-label="Предмети поточного блоку">
        {visibleSubjects.map((subject: Row) => {
          const subjectItems = run.items.filter(
            (question: Row) => question.subject_slug === subject.slug,
          );
          const firstIndex = list.findIndex(
            (question: Row) => question.subject_slug === subject.slug,
          );
          const active = item?.subject_slug === subject.slug;
          return (
            <button
              key={subject.slug}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(firstIndex)}
            >
              <span>{subject.name}</span>
              <small>
                {subjectItems.filter((question: Row) => question.answer).length}
                /{subjectItems.length} збережено
              </small>
            </button>
          );
        })}
      </nav>
      <div className="exam-layout">
        <aside className="question-nav panel">
          <div className="section-heading">
            <h3>{completed ? "Розбір завдань" : "Навігація"}</h3>
            <span>
              {answered}/{run.items.length}
            </span>
          </div>
          {completed && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={onlyErrors}
                onChange={(e) => {
                  setOnlyErrors(e.target.checked);
                  setIndex(0);
                }}
              />{" "}
              Лише помилки
            </label>
          )}
          {run.config.subjects
            .filter((s: Row) =>
              list.some((i: Row) => i.subject_slug === s.slug),
            )
            .map((s: Row) => (
              <div className="nav-subject" key={s.slug}>
                <h4>{s.name}</h4>
                <div className="question-grid">
                  {list.map(
                    (q: Row, i: number) =>
                      q.subject_slug === s.slug && (
                        <button
                          key={q.question_id}
                          title={`Завдання ${subjectNumber(q)}${q.flagged ? " · Позначене" : ""}`}
                          aria-label={`Завдання ${subjectNumber(q)}`}
                          aria-current={
                            item?.question_id === q.question_id
                              ? "step"
                              : undefined
                          }
                          className={`${item?.question_id === q.question_id ? "current" : ""} ${completed ? (q.points === q.max_points ? "correct" : "incorrect") : q.answer ? "answered" : ""} ${q.flagged ? "flagged" : ""}`}
                          onClick={() => navigate(i)}
                        >
                          {subjectNumber(q)}
                          {q.flagged ? <i /> : null}
                        </button>
                      ),
                  )}
                </div>
              </div>
            ))}
          <div className="nav-legend">
            <span>
              <i className="answered" /> Збережено
            </span>
            <span>
              <i className="flagged" /> Позначено
            </span>
          </div>
          {!completed && (
            <Button
              className="full"
              variant="outline"
              onClick={() => setConfirm(true)}
            >
              {run.mode === "simulation" && run.stage === 1
                ? "Завершити етап"
                : "Завершити тест"}
            </Button>
          )}
        </aside>
        {item ? (
          <article className="panel question-panel">
            <div className="question-meta">
              <span>{formats[item.format] || formats[item.type]}</span>
              <span>
                {item.max_points} {item.max_points === 1 ? "бал" : "бали"}
              </span>
            </div>
            <div className="question-title">
              <h2>Завдання {subjectNumber(item)}</h2>
              {!completed && (
                <button
                  aria-label="Позначити завдання"
                  className={`flag-button ${item.flagged ? "lime" : ""}`}
                  disabled={busy}
                  onClick={() => send({ action: "flag" })}
                >
                  <Flag size={19} />
                  {item.flagged ? "Позначено" : "На потім"}
                </button>
              )}
            </div>
            <p className="question-topic">{item.topic}</p>
            <div className="question-prompt">
              <Rich text={item.question} />
            </div>
            <Pictures images={item.images} />
            <Answer
              item={item}
              value={draft}
              onChange={setDraft}
              disabled={busy || completed || !!item.revealed}
            />
            {(completed || Boolean(item.revealed)) && (
              <section
                className={`answer-review ${item.points === item.max_points ? "good" : ""}`}
              >
                <h3>
                  {item.points === item.max_points
                    ? "Правильно"
                    : item.points > 0
                      ? "Частково правильно"
                      : "Варто повторити"}{" "}
                  · {item.points}/{item.max_points} балів
                </h3>
                <p>
                  <strong>Правильна відповідь:</strong>{" "}
                  {displayAnswer(item, item.correctAnswer)}
                </p>
                <p>
                  <strong>Твоя відповідь:</strong>{" "}
                  {displayAnswer(item, item.answer)}
                </p>
                <Rich
                  text={
                    item.explanation ||
                    "Детальне пояснення до цього завдання ще не додано."
                  }
                />
              </section>
            )}
            <div className="question-actions">
              {!completed && !item.revealed && (
                <Button
                  className="primary"
                  disabled={busy}
                  onClick={() => send({ action: "save", answer: draft })}
                >
                  {busy
                    ? "Зберігаємо…"
                    : draft === item.answer && item.answer
                      ? "Збережено ✓"
                      : "Зберегти відповідь"}
                </Button>
              )}
              {!completed && run.mode === "practice" && !item.revealed && (
                <Button
                  variant="outline"
                  disabled={busy || !item.answer || draft !== item.answer}
                  onClick={() => send({ action: "reveal" })}
                >
                  Показати відповідь
                </Button>
              )}
              <span className="spacer" />
              <Button
                variant="outline"
                disabled={index === 0}
                onClick={() => navigate(index - 1)}
                aria-label="Попереднє запитання"
              >
                <ArrowLeft size={18} />
              </Button>
              {index < list.length - 1 ? (
                <Button onClick={() => navigate(index + 1)}>
                  Далі <ArrowRight size={18} />
                </Button>
              ) : (
                !completed && (
                  <Button onClick={() => setConfirm(true)}>
                    Завершити{" "}
                    {run.mode === "simulation" && run.stage === 1
                      ? "етап"
                      : "тест"}
                  </Button>
                )
              )}
            </div>
            {!completed && draft !== item.answer && (
              <p className="draft-note" role="status">
                Відповідь ще не збережена. Натисни «Зберегти відповідь», щоб її
                було враховано.
              </p>
            )}
            <div className="question-source">
              <span>
                {item.sourceKind === "official"
                  ? "Оприлюднене завдання НМТ"
                  : "Авторська тренувальна вправа Vekto"}
              </span>
              {item.source && (
                <a href={item.source} target="_blank" rel="noreferrer">
                  Джерело <ArrowUpRight size={13} />
                </a>
              )}
            </div>
            {item.subject_slug === "mathematics" && (
              <details
                open={reference}
                onToggle={(e) => setReference(e.currentTarget.open)}
                className="reference"
              >
                <summary>Довідкові матеріали з математики</summary>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://testportal.gov.ua/wp-content/uploads/2022/04/ZNO_Math_dovidkovy-materialy.pdf"
                >
                  Відкрити офіційні довідкові матеріали УЦОЯО ↗
                </a>
              </details>
            )}
          </article>
        ) : (
          <Empty title="У цьому тесті немає помилок">
            Усі завдання виконано правильно. Зніми фільтр, щоб переглянути
            відповіді.
          </Empty>
        )}
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          className="platform panel confirm-dialog"
          style={{ minHeight: 0 }}
        >
          <span className="icon-bubble">
            <ShieldCheck />
          </span>
          <DialogTitle>Зафіксувати результат?</DialogTitle>
          <DialogDescription>
            Збережено відповідей: {answered} із {run.items.length}.{" "}
            {draft !== item?.answer
              ? "Поточна чернетка не збережена й не буде врахована. "
              : ""}
            {run.mode === "simulation" && run.stage === 1
              ? "Після завершення повернутися до цього етапу не можна. Почнеться перерва на 20 хвилин."
              : "Ненадані відповіді отримають 0 балів. Змінити результат після завершення не можна."}
          </DialogDescription>
          <div className="question-actions">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Повернутися до тесту
            </Button>
            <Button
              className="primary"
              disabled={busy}
              onClick={async () => {
                const r = await send({ action: "finish" });
                if (r) {
                  setConfirm(false);
                  setIndex(0);
                }
              }}
            >
              Так, завершити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Answer({
  item,
  value,
  onChange,
  disabled,
}: {
  item: Row;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const groups = item.options as Row[];
  const options = groups.flatMap((g) => g.options);
  const parts = value.split(";");
  const setPosition = (i: number, v: string, n: number) => {
    const arr = Array.from({ length: n }, (_, index) => parts[index] ?? "");
    arr[i] = v;
    onChange(arr.join(";"));
  };
  if (item.type === "numeric")
    return (
      <label className="numeric-answer">
        Числова відповідь
        <input
          disabled={disabled}
          inputMode="decimal"
          value={value}
          placeholder="Наприклад: −2,5"
          onChange={(e) => onChange(e.target.value)}
        />
        <small>
          Використовуй цифри, мінус і кому або крапку. Без одиниць вимірювання.
        </small>
      </label>
    );
  if (item.type === "matching")
    return (
      <div className="matching-answer">
        <div className="match-columns">
          {groups.map((g, j) => (
            <div key={j}>
              {g.title && (
                <h4>
                  <Rich text={g.title} />
                </h4>
              )}
              {g.options.map((o: Row) => (
                <div className="match-option" key={o.marker}>
                  <b>{o.marker}</b>
                  <div>
                    <Rich text={o.text} />
                    <Pictures images={o.images} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="match-selects">
          {groups[0]?.options.map((o: Row) => {
            const left = normalizeAnswer(o.marker);
            const val =
              parts.find((v) => v.startsWith(left))?.slice(left.length) ?? "";
            return (
              <label key={o.marker}>
                {o.marker}
                <select
                  disabled={disabled}
                  value={val}
                  onChange={(e) => {
                    const next = parts.filter((v) => v && !v.startsWith(left));
                    if (e.target.value) next.push(left + e.target.value);
                    onChange(next.join(";"));
                  }}
                >
                  <option value="">—</option>
                  {groups[1]?.options.map((r: Row) => (
                    <option key={r.marker} value={normalizeAnswer(r.marker)}>
                      {r.marker}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </div>
    );
  if (item.type === "ordering")
    return (
      <div>
        <div className="order-options">
          {options.map((o: Row) => (
            <div className="match-option" key={o.marker}>
              <b>{o.marker}</b>
              <div>
                <Rich text={o.text} />
                <Pictures images={o.images} />
              </div>
            </div>
          ))}
        </div>
        <div className="match-selects">
          {options.map((_: Row, i: number) => (
            <label key={i}>
              {i + 1} місце
              <select
                disabled={disabled}
                value={parts[i] ?? ""}
                onChange={(e) => setPosition(i, e.target.value, options.length)}
              >
                <option value="">—</option>
                {options.map((o: Row) => (
                  <option key={o.marker} value={normalizeAnswer(o.marker)}>
                    {o.marker}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    );
  if (item.type === "type_6")
    return (
      <div className="grouped-answer">
        {groups.map((g, i) => (
          <fieldset key={i}>
            <legend>
              <Rich text={g.title} />
            </legend>
            {g.options.map((o: Row) => (
              <label
                className={`answer-option ${parts[i] === normalizeAnswer(o.marker) ? "chosen" : ""}`}
                key={o.marker}
              >
                <input
                  type="radio"
                  name={`group-${item.question_id}-${i}`}
                  disabled={disabled}
                  checked={parts[i] === normalizeAnswer(o.marker)}
                  onChange={() =>
                    setPosition(i, normalizeAnswer(o.marker), groups.length)
                  }
                />
                <b>{o.marker}</b>
                <Rich text={o.text} />
                <Pictures images={o.images} />
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    );
  return (
    <div className="answer-options">
      {options.map((o: Row) => {
        const key = normalizeAnswer(o.marker);
        const multiple = item.type === "multiple_choice";
        const checked = multiple ? parts.includes(key) : value === key;
        return (
          <label
            className={`answer-option ${checked ? "chosen" : ""}`}
            key={o.marker}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`answer-${item.question_id}`}
              disabled={
                disabled ||
                (multiple && !checked && parts.filter(Boolean).length >= 3)
              }
              checked={checked}
              onChange={() =>
                onChange(
                  multiple
                    ? (checked
                        ? parts.filter((v) => v !== key)
                        : [...parts.filter(Boolean), key]
                      ).join(";")
                    : key,
                )
              }
            />
            <b>{o.marker}</b>
            <Rich text={o.text} />
            <Pictures images={o.images} />
          </label>
        );
      })}
    </div>
  );
}
