import assert from "node:assert/strict";
import { pointsFor, officialTables } from "../lib/nmt-scoring";
import data from "../data/nmt-questions.json";
import { classifyQuestion } from "../lib/question-bank";
assert.equal(
  classifyQuestion(
    "mathematics",
    "Числа і вирази",
    "Знайдіть 15% від числа 400.",
  ).topicName,
  "Відсотки, пропорції та масштаб",
);
assert.equal(
  classifyQuestion(
    "mathematics",
    "Геометрія. Стереометрія",
    "У системі координат у просторі задано точки",
  ).topicName,
  "Координати й вектори у просторі",
);
assert.equal(
  classifyQuestion(
    "mathematics",
    "Алгебра. Ймовірність випадкової події",
    "Електронна система вибирає місце",
  ).topicName,
  "Ймовірність випадкової події",
);
for (const q of data.questions) {
  const full = pointsFor(q.question_type, q.correct_answer, q.correct_answer);
  assert.equal(full.earned, full.max, q.id);
  assert.equal(
    pointsFor(q.question_type, "", q.correct_answer).earned,
    0,
    q.id,
  );
}
assert.equal(pointsFor("numeric", "-2,50", "-2.5").earned, 2);
assert.equal(pointsFor("type_6", "3;1;1", "1;3;1").earned, 1);
assert.equal(pointsFor("type_6", ";3;", "1;3;1").earned, 1);
assert.equal(pointsFor("matching", "1а;2б", "1a;2b;3c;4d").earned, 2);
assert.equal(pointsFor("multiple_choice", "1;2;3;4;5;6;7", "1;4;7").earned, 0);
assert.equal(pointsFor("ordering", "a;;;d", "a;b;c;d").earned, 2);
assert.equal(pointsFor("ordering", "a;d", "a;b;c;d").earned, 1);
for (const table of Object.values(officialTables)) {
  assert.equal([...table.values()][0], 100);
  assert.equal([...table.values()].at(-1), 200);
  assert.equal(table.get(0), undefined);
}
console.log(
  "PASS: 412 official answer keys, empty answers, partial credits, numeric formatting, invalid selections, scale boundaries.",
);
