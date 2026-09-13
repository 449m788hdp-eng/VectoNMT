import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
const base = "http://127.0.0.1:8787";
const db = new DatabaseSync(
  ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite",
);
const client = () => {
  let cookie = "";
  return async (path = "/api/platform", body, expect = 200) => {
    const r = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { cookie, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.headers.get("set-cookie"))
      cookie = r.headers.get("set-cookie").split(";")[0];
    const d = await r.json();
    assert.equal(r.status, expect, JSON.stringify(d));
    return d;
  };
};
const a = client(),
  b = client();
await a("/api/session", {});
await b("/api/session", {});
await a("/api/me", {
  firstName: "Тест",
  lastName: "Учень",
  grade: "11",
  fourthSubject: "biology",
  subjectTargets: {
    ukrainian: 181,
    mathematics: 182,
    history: 183,
    biology: 184,
  },
});
for (const subject of [
  "mathematics",
  "ukrainian",
  "history",
  "english",
  "german",
  "biology",
  "geography",
])
  await a("/api/platform/bootstrap", { subject });
const dashboard = await a();
assert.equal(dashboard.subjects.length, 7);
assert.equal(dashboard.stats.tests, 0);
assert.equal(dashboard.profile.onboarding_completed, 1);
assert.deepEqual(
  Object.keys(JSON.parse(dashboard.profile.subject_targets_json)).sort(),
  ["biology", "history", "mathematics", "ukrainian"],
);
let run = await a("/api/platform", {
  action: "start",
  mode: "practice",
  subject: "mathematics",
  count: 5,
});
assert.equal(run.items.length, 5);
assert.equal(new Set(run.items.map((q) => q.question_id)).size, 5);
assert(!JSON.stringify(run).includes("correct_answer"));
assert(!run.items[0].correctAnswer);
await b(`/api/platform?session=${run.id}`, undefined, 404);
const question = run.items[0];
const answer = db
  .prepare("SELECT correct_answer FROM questions WHERE id=?")
  .get(question.question_id).correct_answer;
const previousRevision = run.revision;
run = await a("/api/platform", {
  action: "save",
  id: run.id,
  revision: run.revision,
  questionId: question.question_id,
  answer,
});
assert.equal(run.items[0].answer, answer);
await a(
  "/api/platform",
  {
    action: "save",
    id: run.id,
    revision: previousRevision,
    questionId: question.question_id,
    answer,
  },
  409,
);
const resumed = await a(`/api/platform?session=${run.id}`);
assert.equal(resumed.items[0].answer, answer);
run = await a("/api/platform", {
  action: "navigate",
  id: run.id,
  revision: run.revision,
  questionId: run.items[2].question_id,
});
assert.equal((await a(`/api/platform?session=${run.id}`)).current_index, 2);
run = await a("/api/platform", {
  action: "reveal",
  id: run.id,
  revision: run.revision,
  questionId: question.question_id,
});
assert.equal(run.items[0].points, run.items[0].max_points);
await a(
  "/api/platform",
  {
    action: "save",
    id: run.id,
    revision: run.revision,
    questionId: question.question_id,
    answer: "",
  },
  400,
);
run = await a("/api/platform", {
  action: "finish",
  id: run.id,
  revision: run.revision,
});
assert.equal(run.status, "completed");
assert.equal(run.result.subjects[0].score, null);
const again = await a("/api/platform", {
  action: "finish",
  id: run.id,
  revision: run.revision,
});
assert.deepEqual(again.result, run.result);
const firstIds = run.items.map((q) => q.question_id);
run = await a("/api/platform", {
  action: "start",
  mode: "practice",
  subject: "mathematics",
  count: 5,
});
assert(!run.items.some((q) => firstIds.includes(q.question_id)));
await a("/api/platform", {
  action: "finish",
  id: run.id,
  revision: run.revision,
});
for (const fourthSubject of ["english", "german", "biology", "geography"]) {
  run = await a("/api/platform", {
    action: "start",
    mode: "simulation",
    fourthSubject,
  });
  assert.equal(run.items.length, 52);
  assert(run.deadline - run.serverNow <= 7200);
  assert.equal(run.config.subjects.length, 4);
  assert.deepEqual(
    [...new Set(run.items.map((question) => question.subject_slug))].sort(),
    ["mathematics", "ukrainian"],
  );
  const firstMathematics = run.items.find(
    (question) => question.subject_slug === "mathematics",
  );
  run = await a("/api/platform", {
    action: "navigate",
    id: run.id,
    revision: run.revision,
    questionId: firstMathematics.question_id,
  });
  assert.equal(run.current_index, firstMathematics.position);
  await a(
    "/api/platform",
    {
      action: "reveal",
      id: run.id,
      revision: run.revision,
      questionId: run.items[0].question_id,
    },
    400,
  );
  await a(
    "/api/platform",
    {
      action: "save",
      id: run.id,
      revision: run.revision,
      questionId: "not-in-stage",
      answer: "a",
    },
    400,
  );
  const fixture = db
    .prepare(
      "SELECT question_id,snapshot_json FROM session_items WHERE session_id=?",
    )
    .all(run.id);
  // Local-only timer/answer fixture: never exposed through production APIs.
  for (const q of fixture)
    db.prepare(
      "UPDATE session_items SET answer=? WHERE session_id=? AND question_id=?",
    ).run(JSON.parse(q.snapshot_json).correct_answer, run.id, q.question_id);
  db.prepare("UPDATE learning_sessions SET deadline=? WHERE id=?").run(
    Math.floor(Date.now() / 1000) - 1,
    run.id,
  );
  run = await a(`/api/platform?session=${run.id}`);
  assert.equal(run.status, "break");
  await a(
    "/api/platform",
    { action: "continue", id: run.id, revision: run.revision },
    400,
  );
  db.prepare("UPDATE learning_sessions SET break_until=? WHERE id=?").run(
    Math.floor(Date.now() / 1000) - 1,
    run.id,
  );
  run = await a("/api/platform", {
    action: "continue",
    id: run.id,
    revision: run.revision,
  });
  assert.equal(run.stage, 2);
  assert.deepEqual(
    [...new Set(run.items.map((question) => question.subject_slug))].sort(),
    [fourthSubject, "history"].sort(),
  );
  assert.equal(
    run.items.length,
    30 + (fourthSubject === "english" || fourthSubject === "german" ? 32 : 30),
  );
  db.prepare("UPDATE learning_sessions SET deadline=? WHERE id=?").run(
    Math.floor(Date.now() / 1000) - 1,
    run.id,
  );
  run = await a(`/api/platform?session=${run.id}`);
  assert.equal(run.status, "completed");
  assert(run.result.subjects.every((s) => s.score === 200));
  console.log(
    "Simulation verified:",
    fourthSubject,
    run.result.subjects.map((s) => `${s.slug} ${s.earned}/${s.maximum}`),
  );
}
const after = await a();
assert.equal(after.stats.tests, 6);
assert.equal(after.stats.streak, 1);
assert.equal(after.history.length, 6);
console.log(
  "PASS: onboarding, four-profile targets, isolation, resume, subject switching, persistence, revisions, reveal lock, no repeats, idempotent finish, four exam blueprints, two timers, break, scoring and statistics.",
);
