import { subjectCatalog } from "@/lib/question-bank";

const markerMap: Record<string, string> = { "а": "a", "б": "b", "в": "c", "г": "d", "д": "e", "е": "f", "ж": "g", "з": "h" };

export function normalizeAnswer(value: string) {
  const clean = value.trim().toLowerCase();
  return markerMap[clean] ?? clean;
}

export function normalizedParts(value: string) {
  return value.split(";").map(normalizeAnswer).filter(Boolean);
}

export function pointsFor(type: string, selected: string, answer: string) {
  if (type === "numeric") return { earned: normalizeAnswer(selected).replace(",", ".") === normalizeAnswer(answer).replace(",", ".") ? 2 : 0, max: 2 };
  if (type === "matching" || type === "type_6") {
    const actual = new Set(normalizedParts(selected));
    const expected = normalizedParts(answer);
    return { earned: expected.filter((part) => actual.has(part)).length, max: expected.length };
  }
  if (type === "ordering") {
    const actual = normalizedParts(selected);
    const expected = normalizedParts(answer);
    if (actual.length === expected.length && expected.every((part, index) => actual[index] === part)) return { earned: 3, max: 3 };
    const earned = Number(actual[0] === expected[0]) + Number(actual.at(-1) === expected.at(-1));
    return { earned, max: 3 };
  }
  if (type === "multiple_choice") {
    const actual = new Set(normalizedParts(selected));
    const expected = new Set(normalizedParts(answer));
    return { earned: [...expected].filter((part) => actual.has(part)).length, max: expected.size };
  }
  return { earned: normalizeAnswer(selected) === normalizeAnswer(answer) ? 1 : 0, max: 1 };
}

function table(entries: Array<[number, number]>) {
  return new Map(entries);
}

const ukrainian = table([
  [8,100],[9,105],[10,110],[11,120],[12,125],[13,130],[14,134],[15,136],[16,138],[17,140],[18,142],[19,143],[20,144],[21,145],[22,146],[23,148],[24,149],[25,150],[26,152],[27,154],[28,156],[29,157],[30,159],[31,160],[32,162],[33,163],[34,165],[35,167],[36,170],[37,172],[38,175],[39,177],[40,180],[41,183],[42,186],[43,191],[44,195],[45,200],
]);
const mathematics = table([
  [5,100],[6,108],[7,115],[8,123],[9,131],[10,134],[11,137],[12,140],[13,143],[14,145],[15,147],[16,148],[17,149],[18,150],[19,151],[20,152],[21,155],[22,159],[23,163],[24,167],[25,170],[26,173],[27,176],[28,180],[29,184],[30,189],[31,194],[32,200],
]);
const history = table([
  [9,100],[10,105],[11,110],[12,115],[13,120],[14,125],[15,130],[16,132],[17,134],[18,136],[19,138],[20,140],[21,141],[22,142],[23,143],[24,144],[25,145],[26,146],[27,147],[28,148],[29,149],[30,150],[31,151],[32,152],[33,154],[34,156],[35,158],[36,160],[37,163],[38,166],[39,168],[40,169],[41,170],[42,172],[43,173],[44,175],[45,177],[46,179],[47,181],[48,183],[49,185],[50,188],[51,191],[52,194],[53,197],[54,200],
]);
const foreignLanguage = table([
  [5,100],[6,109],[7,118],[8,125],[9,131],[10,134],[11,137],[12,140],[13,143],[14,145],[15,147],[16,148],[17,149],[18,150],[19,151],[20,152],[21,153],[22,155],[23,157],[24,159],[25,162],[26,166],[27,169],[28,173],[29,179],[30,185],[31,191],[32,200],
]);
const biologyAndGeography = table([
  [7,100],[8,107],[9,114],[10,119],[11,124],[12,128],[13,131],[14,134],[15,136],[16,138],[17,140],[18,142],[19,144],[20,145],[21,146],[22,147],[23,148],[24,149],[25,150],[26,151],[27,152],[28,154],[29,156],[30,158],[31,160],[32,162],[33,164],[34,166],[35,168],[36,170],[37,172],[38,175],[39,177],[40,179],[41,182],[42,185],[43,188],[44,192],[45,196],[46,200],
]);

const officialTables: Record<string, Map<number, number>> = {
  ukrainian,
  mathematics,
  history,
  english: foreignLanguage,
  german: foreignLanguage,
  biology: biologyAndGeography,
  geography: biologyAndGeography,
};

export function officialNmtScore(subject: string, rawScore: number) {
  return officialTables[subject]?.get(rawScore) ?? null;
}

export function isFullNmtAttempt(subject: string, totalQuestions: number) {
  return subjectCatalog.get(subject)?.examQuestionCount === totalQuestions;
}

