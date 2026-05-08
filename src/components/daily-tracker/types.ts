export interface Contractor {
  id: string;
  name: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  contractorId: string;
  machineryPlan: number;
  machineryFact: number;
  peoplePlan: number;
  peopleFact: number;
  createdAt: string;
  note?: string;
  dayShift: string[];
  nightShift: string[];
}

export type Tab = "entry" | "reports" | "contractors" | "history";

export const INITIAL_CONTRACTORS: Contractor[] = [
  { id: "1", name: 'ООО "СтройТехМонтаж"' },
  { id: "2", name: 'АО "ПромМеханика"' },
  { id: "3", name: 'ИП Кузнецов А.В.' },
  { id: "4", name: 'ООО "ТехСервис Урал"' },
];

export const INITIAL_RECORDS: DailyRecord[] = [
  {
    id: "r1",
    date: "2026-05-07",
    contractorId: "1",
    machineryPlan: 10,
    machineryFact: 8,
    peoplePlan: 40,
    peopleFact: 43,
    createdAt: "2026-05-07T08:00:00",
    note: "",
    dayShift: ["Иванов А.П.", "Петров С.В.", "Сидоров Н.К."],
    nightShift: ["Козлов Д.Р."],
  },
  {
    id: "r2",
    date: "2026-05-07",
    contractorId: "2",
    machineryPlan: 8,
    machineryFact: 8,
    peoplePlan: 30,
    peopleFact: 28,
    createdAt: "2026-05-07T08:15:00",
    dayShift: ["Новиков В.А."],
    nightShift: [],
  },
  {
    id: "r3",
    date: "2026-05-06",
    contractorId: "1",
    machineryPlan: 12,
    machineryFact: 12,
    peoplePlan: 45,
    peopleFact: 44,
    createdAt: "2026-05-06T09:00:00",
    dayShift: [],
    nightShift: [],
  },
  {
    id: "r4",
    date: "2026-05-06",
    contractorId: "3",
    machineryPlan: 4,
    machineryFact: 3,
    peoplePlan: 20,
    peopleFact: 18,
    createdAt: "2026-05-06T09:30:00",
    dayShift: [],
    nightShift: [],
  },
];

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function nextDay(iso: string) {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatNightShiftDate(iso: string) {
  const [, m1, d1] = iso.split("-");
  const next = nextDay(iso);
  const [, m2, d2] = next.split("-");
  return `${d1}.${m1} / ${d2}.${m2}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function deviation(plan: number, fact: number) {
  return fact - plan;
}

export function deviationClass(plan: number, fact: number) {
  const d = deviation(plan, fact);
  if (d === 0) return "deviation-neutral font-mono-data";
  if (d > 0) return "deviation-positive font-mono-data";
  return "deviation-negative font-mono-data";
}

export function deviationStr(plan: number, fact: number) {
  const d = deviation(plan, fact);
  if (d === 0) return "0";
  return d > 0 ? `+${d}` : `${d}`;
}

export function isAlert(record: DailyRecord) {
  const machineryDev = Math.abs(deviation(record.machineryPlan, record.machineryFact));
  const peopleDev = Math.abs(deviation(record.peoplePlan, record.peopleFact));
  const machineryPct = record.machineryPlan > 0 ? machineryDev / record.machineryPlan : 0;
  const peoplePct = record.peoplePlan > 0 ? peopleDev / record.peoplePlan : 0;
  return machineryPct >= 0.2 || peoplePct >= 0.2;
}
