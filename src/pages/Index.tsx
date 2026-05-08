import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contractor {
  id: string;
  name: string;
}

interface DailyRecord {
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

type Tab = "entry" | "reports" | "contractors" | "history";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_CONTRACTORS: Contractor[] = [
  { id: "1", name: 'ООО "СтройТехМонтаж"' },
  { id: "2", name: 'АО "ПромМеханика"' },
  { id: "3", name: 'ИП Кузнецов А.В.' },
  { id: "4", name: 'ООО "ТехСервис Урал"' },
];

const INITIAL_RECORDS: DailyRecord[] = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function nextDay(iso: string) {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatNightShiftDate(iso: string) {
  const [, m1, d1] = iso.split("-");
  const next = nextDay(iso);
  const [, m2, d2] = next.split("-");
  return `${d1}.${m1} / ${d2}.${m2}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function deviation(plan: number, fact: number) {
  return fact - plan;
}

function deviationClass(plan: number, fact: number) {
  const d = deviation(plan, fact);
  if (d === 0) return "deviation-neutral font-mono-data";
  if (d > 0) return "deviation-positive font-mono-data";
  return "deviation-negative font-mono-data";
}

function deviationStr(plan: number, fact: number) {
  const d = deviation(plan, fact);
  if (d === 0) return "0";
  return d > 0 ? `+${d}` : `${d}`;
}

function isAlert(record: DailyRecord) {
  const machineryDev = Math.abs(deviation(record.machineryPlan, record.machineryFact));
  const peopleDev = Math.abs(deviation(record.peoplePlan, record.peopleFact));
  const machineryPct = record.machineryPlan > 0 ? machineryDev / record.machineryPlan : 0;
  const peoplePct = record.peoplePlan > 0 ? peopleDev / record.peoplePlan : 0;
  return machineryPct >= 0.2 || peoplePct >= 0.2;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ plan, fact }: { plan: number; fact: number }) {
  const d = deviation(plan, fact);
  if (d === 0)
    return (
      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500 font-mono-data">
        норма
      </span>
    );
  if (d > 0)
    return (
      <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 font-mono-data">
        +{d}
      </span>
    );
  return (
    <span className="inline-block px-2 py-0.5 text-xs rounded bg-red-50 text-red-600 font-mono-data">
      {d}
    </span>
  );
}

function AlertBanner({
  records,
}: {
  records: DailyRecord[];
}) {
  const alerts = records.filter((r) => isAlert(r));
  if (alerts.length === 0) return null;
  return (
    <div className="alert-banner rounded px-4 py-3 mb-4 animate-fade-in">
      <div className="flex items-start gap-2">
        <Icon name="AlertTriangle" size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Обнаружены расхождения ({alerts.length})
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Отклонение план/факт ≥20%
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Tab ────────────────────────────────────────────────────────────────

function EntryTab({
  contractors,
  records,
  onSave,
}: {
  contractors: Contractor[];
  records: DailyRecord[];
  onSave: (r: DailyRecord) => void;
}) {
  const [form, setForm] = useState({
    date: today(),
    time: new Date().toTimeString().slice(0, 5),
    contractorId: contractors[0]?.id ?? "",
    machineryPlan: "",
    machineryFact: "",
    peoplePlan: "",
    peopleFact: "",
    note: "",
  });
  const [dayShift, setDayShift] = useState<string[]>([]);
  const [nightShift, setNightShift] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState("");
  const [personShift, setPersonShift] = useState<"day" | "night">("day");
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function addPerson() {
    const val = personInput.trim();
    if (!val) return;
    if (personShift === "day") setDayShift((p) => [...p, val]);
    else setNightShift((p) => [...p, val]);
    setPersonInput("");
  }

  function removePerson(shift: "day" | "night", idx: number) {
    if (shift === "day") setDayShift((p) => p.filter((_, i) => i !== idx));
    else setNightShift((p) => p.filter((_, i) => i !== idx));
  }

  const todayAlerts = records.filter(
    (r) => r.date === today() && isAlert(r)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const record: DailyRecord = {
      id: `r${Date.now()}`,
      date: form.date,
      contractorId: form.contractorId,
      machineryPlan: Number(form.machineryPlan),
      machineryFact: Number(form.machineryFact),
      peoplePlan: Number(form.peoplePlan),
      peopleFact: Number(form.peopleFact),
      createdAt: `${form.date}T${form.time}:00`,
      note: form.note,
      dayShift: [...dayShift],
      nightShift: [...nightShift],
    };
    onSave(record);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setForm((f) => ({
      ...f,
      machineryPlan: "",
      machineryFact: "",
      peoplePlan: "",
      peopleFact: "",
      note: "",
    }));
    setDayShift([]);
    setNightShift([]);
  }

  return (
    <div className="animate-slide-up">
      {todayAlerts.length > 0 && (
        <AlertBanner records={todayAlerts} />
      )}

      <div className="bg-white border border-border rounded-sm shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-primary">
          <h2 className="text-base font-semibold text-primary-foreground tracking-wide uppercase">
            Ввод суточных данных
          </h2>
          <p className="text-xs text-primary-foreground/70 mt-0.5">
            Заполните план и факт по технике и людям
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Дата
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
                className="w-full border border-border rounded-sm px-3 py-2 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              {personShift === "night" && form.date && (
                <p className="text-xs mt-1 font-semibold text-indigo-500 flex items-center gap-1">
                  🌙 {formatNightShiftDate(form.date)}
                </p>
              )}
          </div>

          {/* Shifts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-1">
                <Icon name="UserCheck" size={12} />
                Состав смены
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex gap-2 mb-3">
              <div className="flex border border-border rounded-sm overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setPersonShift("day")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${
                    personShift === "day"
                      ? "bg-amber-500 text-white"
                      : "bg-white text-muted-foreground hover:bg-amber-50"
                  }`}
                >
                  ☀ День
                </button>
                <button
                  type="button"
                  onClick={() => setPersonShift("night")}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 border-l border-border ${
                    personShift === "night"
                      ? "bg-indigo-500 text-white"
                      : "bg-white text-muted-foreground hover:bg-indigo-50"
                  }`}
                >
                  🌙 Ночь
                </button>
              </div>
              <input
                type="text"
                value={personInput}
                onChange={(e) => setPersonInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPerson())}
                placeholder="Фамилия И.О."
                className="flex-1 border border-border rounded-sm px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button
                type="button"
                onClick={addPerson}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Icon name="Plus" size={13} />
              </button>
            </div>

            {(dayShift.length > 0 || nightShift.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {dayShift.map((name, i) => (
                  <div key={`d${i}`} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-sm pl-2 pr-1 py-0.5">
                    <span className="text-xs text-amber-700 font-medium">☀</span>
                    <span className="text-sm">{name}</span>
                    <button type="button" onClick={() => removePerson("day", i)} className="text-amber-400 hover:text-red-500 transition-colors ml-0.5">
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                ))}
                {nightShift.map((name, i) => (
                  <div key={`n${i}`} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-sm pl-2 pr-1 py-0.5">
                    <span className="text-xs text-indigo-400 font-medium">🌙</span>
                    <span className="text-sm">{name}</span>
                    <button type="button" onClick={() => removePerson("night", i)} className="text-indigo-300 hover:text-red-500 transition-colors ml-0.5">
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Подрядная организация
            </label>
            <select
              value={form.contractorId}
              onChange={(e) => set("contractorId", e.target.value)}
              required
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {contractors.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Machinery */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-1">
                <Icon name="Truck" size={12} />
                Техника
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  План, ед.
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.machineryPlan}
                  onChange={(e) => set("machineryPlan", e.target.value)}
                  required
                  placeholder="0"
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Факт, ед.
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.machineryFact}
                  onChange={(e) => set("machineryFact", e.target.value)}
                  required
                  placeholder="0"
                  className={`w-full border rounded-sm px-3 py-2 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    form.machineryFact &&
                    form.machineryPlan &&
                    Number(form.machineryFact) < Number(form.machineryPlan)
                      ? "border-red-300 focus:border-red-400"
                      : "border-border focus:border-primary"
                  }`}
                />
              </div>
            </div>
            {form.machineryPlan && form.machineryFact && (
              <p
                className={`text-xs mt-2 ${deviationClass(
                  Number(form.machineryPlan),
                  Number(form.machineryFact)
                )}`}
              >
                Отклонение:{" "}
                {deviationStr(Number(form.machineryPlan), Number(form.machineryFact))} ед.
              </p>
            )}
          </div>

          {/* People */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-1">
                <Icon name="Users" size={12} />
                Люди
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  План, чел.
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.peoplePlan}
                  onChange={(e) => set("peoplePlan", e.target.value)}
                  required
                  placeholder="0"
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Факт, чел.
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.peopleFact}
                  onChange={(e) => set("peopleFact", e.target.value)}
                  required
                  placeholder="0"
                  className={`w-full border rounded-sm px-3 py-2 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    form.peopleFact &&
                    form.peoplePlan &&
                    Number(form.peopleFact) < Number(form.peoplePlan)
                      ? "border-red-300 focus:border-red-400"
                      : "border-border focus:border-primary"
                  }`}
                />
              </div>
            </div>
            {form.peoplePlan && form.peopleFact && (
              <p
                className={`text-xs mt-2 ${deviationClass(
                  Number(form.peoplePlan),
                  Number(form.peopleFact)
                )}`}
              >
                Отклонение:{" "}
                {deviationStr(Number(form.peoplePlan), Number(form.peopleFact))} чел.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Примечание (необязательно)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              rows={2}
              placeholder="Причины отклонений, особые обстоятельства..."
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon name="Save" size={15} />
              Сохранить запись
            </button>
            {saved && (
              <span className="text-xs text-green-700 flex items-center gap-1 animate-fade-in font-medium">
                <Icon name="CheckCircle2" size={14} />
                Запись сохранена
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({
  contractors,
  records,
}: {
  contractors: Contractor[];
  records: DailyRecord[];
}) {
  const dates = [...new Set(records.map((r) => r.date))].sort((a, b) =>
    b.localeCompare(a)
  );
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? today());

  const dayRecords = records.filter((r) => r.date === selectedDate);
  const totalMacPlan = dayRecords.reduce((s, r) => s + r.machineryPlan, 0);
  const totalMacFact = dayRecords.reduce((s, r) => s + r.machineryFact, 0);
  const totalPeoplePlan = dayRecords.reduce((s, r) => s + r.peoplePlan, 0);
  const totalPeopleFact = dayRecords.reduce((s, r) => s + r.peopleFact, 0);

  const summaryCards = [
    { label: "Техника план", value: totalMacPlan, unit: "ед.", icon: "Truck", dev: undefined, devClass: undefined },
    {
      label: "Техника факт",
      value: totalMacFact,
      unit: "ед.",
      icon: "Truck",
      dev: deviationStr(totalMacPlan, totalMacFact),
      devClass: deviationClass(totalMacPlan, totalMacFact),
    },
    { label: "Люди план", value: totalPeoplePlan, unit: "чел.", icon: "Users", dev: undefined, devClass: undefined },
    {
      label: "Люди факт",
      value: totalPeopleFact,
      unit: "чел.",
      icon: "Users",
      dev: deviationStr(totalPeoplePlan, totalPeopleFact),
      devClass: deviationClass(totalPeoplePlan, totalPeopleFact),
    },
  ];

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Дата отчёта:
        </label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-border rounded-sm px-3 py-1.5 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-border rounded-sm p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon name={card.icon} size={13} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {card.label}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold font-mono-data text-foreground">
                {card.value}
              </span>
              <span className="text-xs text-muted-foreground mb-0.5">{card.unit}</span>
              {card.dev !== undefined && (
                <span className={`text-sm mb-0.5 ${card.devClass}`}>{card.dev}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40">
          <h3 className="text-sm font-semibold text-foreground">
            Детализация за {formatDate(selectedDate)}
          </h3>
        </div>
        {dayRecords.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground text-sm">
            Нет данных за выбранную дату
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {[
                    "Подрядчик",
                    "Тех. план",
                    "Тех. факт",
                    "Откл.",
                    "Статус техники",
                    "Люди план",
                    "Люди факт",
                    "Откл.",
                    "Статус людей",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left first:text-left text-center"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayRecords.map((r, i) => {
                  const ct = contractors.find((x) => x.id === r.contractorId);
                  const macAlert = r.machineryFact < r.machineryPlan;
                  const peopleAlert = r.peopleFact < r.peoplePlan;
                  const anyAlert = macAlert || peopleAlert;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${
                        anyAlert ? "bg-amber-50/40" : i % 2 !== 0 ? "bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          {anyAlert && (
                            <Icon name="AlertTriangle" size={12} className="text-amber-500 shrink-0" />
                          )}
                          {ct?.name ?? "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono-data">{r.machineryPlan}</td>
                      <td className="px-3 py-3 text-center font-mono-data">{r.machineryFact}</td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge plan={r.machineryPlan} fact={r.machineryFact} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        {macAlert ? (
                          <span className="text-xs font-semibold text-amber-600">⚠ Отклонение</span>
                        ) : (
                          <span className="text-xs text-green-700 font-semibold">✓ Норма</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-mono-data">{r.peoplePlan}</td>
                      <td className="px-3 py-3 text-center font-mono-data">{r.peopleFact}</td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge plan={r.peoplePlan} fact={r.peopleFact} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        {peopleAlert ? (
                          <span className="text-xs font-semibold text-amber-600">⚠ Отклонение</span>
                        ) : (
                          <span className="text-xs text-green-700 font-semibold">✓ Норма</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                  <td className="px-4 py-3 text-sm">ИТОГО</td>
                  <td className="px-3 py-3 text-center font-mono-data">{totalMacPlan}</td>
                  <td className="px-3 py-3 text-center font-mono-data">{totalMacFact}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={deviationClass(totalMacPlan, totalMacFact)}>
                      {deviationStr(totalMacPlan, totalMacFact)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {totalMacFact < totalMacPlan ? (
                      <span className="text-xs font-semibold text-amber-600">⚠ Отклонение</span>
                    ) : (
                      <span className="text-xs text-green-700 font-semibold">✓ Норма</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-mono-data">{totalPeoplePlan}</td>
                  <td className="px-3 py-3 text-center font-mono-data">{totalPeopleFact}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={deviationClass(totalPeoplePlan, totalPeopleFact)}>
                      {deviationStr(totalPeoplePlan, totalPeopleFact)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {totalPeopleFact < totalPeoplePlan ? (
                      <span className="text-xs font-semibold text-amber-600">⚠ Отклонение</span>
                    ) : (
                      <span className="text-xs text-green-700 font-semibold">✓ Норма</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-foreground">
          <Icon name="FileSpreadsheet" size={14} />
          Экспорт в Excel
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-foreground">
          <Icon name="FileText" size={14} />
          Экспорт в PDF
        </button>
      </div>
    </div>
  );
}

// ─── Contractors Tab ──────────────────────────────────────────────────────────

function ContractorsTab({
  contractors,
  onAdd,
  onDelete,
}: {
  contractors: Contractor[];
  onAdd: (c: Contractor) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({ name: "" });
  const [adding, setAdding] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      id: `c${Date.now()}`,
      name: form.name,
    });
    setForm({ name: "" });
    setAdding(false);
  }

  return (
    <div className="animate-slide-up space-y-4">
      <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-primary flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">
              Подрядные организации
            </h3>
            <p className="text-xs text-primary-foreground/70 mt-0.5">
              {contractors.length} организаций в списке
            </p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/15 text-primary-foreground rounded-sm hover:bg-white/25 transition-colors border border-white/20"
          >
            <Icon name={adding ? "X" : "Plus"} size={13} />
            {adding ? "Отмена" : "Добавить"}
          </button>
        </div>

        {adding && (
          <form
            onSubmit={handleAdd}
            className="px-5 py-4 border-b border-border bg-muted/20 animate-fade-in"
          >
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Название организации
            </label>
            <div className="flex gap-2">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder='ООО "Название"'
                className="flex-1 border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold rounded-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Добавить
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Организация
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((ct, i) => (
                <tr
                  key={ct.id}
                  className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${
                    i % 2 !== 0 ? "bg-muted/10" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-medium">{ct.name}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(ct.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  contractors,
  records,
  onDelete,
}: {
  contractors: Contractor[];
  records: DailyRecord[];
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = sorted.filter((r) => {
    const ct = contractors.find((x) => x.id === r.contractorId);
    return (
      !filter ||
      ct?.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.date.includes(filter)
    );
  });

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Icon
            name="Search"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Поиск по дате или подрядчику..."
            className="pl-8 pr-3 py-1.5 border border-border rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 w-72"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} записей</span>
      </div>

      <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["", "Дата", "Подрядчик", "Тех. П/Ф", "Люди П/Ф", "Статус", "Примечание", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Нет записей
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const ct = contractors.find((x) => x.id === r.contractorId);
                  const alert = isAlert(r);
                  const isOpen = expanded === r.id;
                  const hasShift = (r.dayShift?.length ?? 0) > 0 || (r.nightShift?.length ?? 0) > 0;
                  return (
                    <>
                      <tr
                        key={r.id}
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                        className={`border-b border-border/50 transition-colors cursor-pointer ${
                          alert ? "bg-amber-50/30" : i % 2 !== 0 ? "bg-muted/10" : ""
                        } hover:bg-muted/20`}
                      >
                        <td className="px-3 py-2.5 text-center w-6">
                          {hasShift && (
                            <Icon
                              name={isOpen ? "ChevronDown" : "ChevronRight"}
                              size={13}
                              className="text-muted-foreground"
                            />
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono-data text-xs whitespace-nowrap">
                          {formatDate(r.date)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-xs">
                          <div className="flex items-center gap-1">
                            {alert && (
                              <Icon name="AlertTriangle" size={11} className="text-amber-500" />
                            )}
                            {ct?.name ?? "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs font-mono-data">
                          {r.machineryPlan}/{r.machineryFact}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs font-mono-data">
                          {r.peoplePlan}/{r.peopleFact}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {alert ? (
                            <span className="text-xs font-semibold text-amber-600">⚠</span>
                          ) : (
                            <span className="text-xs text-green-700 font-semibold">✓</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">
                          {r.note || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onDelete(r.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Icon name="Trash2" size={13} />
                          </button>
                        </td>
                      </tr>
                      {isOpen && hasShift && (
                        <tr key={`${r.id}-shift`} className="border-b border-border/40 bg-muted/5">
                          <td />
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                                  ☀ День
                                </p>
                                {(r.dayShift?.length ?? 0) > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {r.dayShift.map((name, idx) => (
                                      <span key={idx} className="bg-amber-50 border border-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-sm">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Нет сотрудников</span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-indigo-500 mb-1.5 flex items-center gap-1">
                                  🌙 Ночь
                                </p>
                                {(r.nightShift?.length ?? 0) > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {r.nightShift.map((name, idx) => (
                                      <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-sm">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Нет сотрудников</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-foreground">
          <Icon name="FileSpreadsheet" size={14} />
          Экспорт в Excel
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-foreground">
          <Icon name="FileText" size={14} />
          Экспорт в PDF
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [contractors, setContractors] = useState<Contractor[]>(INITIAL_CONTRACTORS);
  const [records, setRecords] = useState<DailyRecord[]>(INITIAL_RECORDS);
  const [tab, setTab] = useState<Tab>("entry");

  const alertCount = records.filter(
    (r) => r.date === today() && isAlert(r)
  ).length;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "entry", label: "Ввод данных", icon: "ClipboardList" },
    { id: "reports", label: "Отчёты", icon: "BarChart3" },
    { id: "contractors", label: "Подрядчики", icon: "Building2" },
    { id: "history", label: "История", icon: "History" },
  ];

  return (
    <div className="min-h-screen bg-background font-golos">
      {/* Header */}
      <header className="bg-primary border-b border-primary/20 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-white/15 flex items-center justify-center">
                <Icon name="Briefcase" size={17} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide uppercase leading-tight">
                  Суточный учёт
                </h1>
                <p className="text-xs text-white/55 leading-none">
                  Техника и люди · Подрядчики
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {alertCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded-sm px-2.5 py-1">
                  <Icon name="Bell" size={12} className="text-amber-300" />
                  <span className="text-xs font-semibold text-amber-200">
                    {alertCount} откл. сегодня
                  </span>
                </div>
              )}
              <span className="text-xs text-white/45 font-mono-data hidden sm:block">
                {formatDate(today())}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-border sticky top-14 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon name={t.icon} size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "entry" && (
          <EntryTab
            contractors={contractors}
            records={records}
            onSave={(r) => setRecords((prev) => [r, ...prev])}
          />
        )}
        {tab === "reports" && (
          <ReportsTab contractors={contractors} records={records} />
        )}
        {tab === "contractors" && (
          <ContractorsTab
            contractors={contractors}
            onAdd={(ct) => setContractors((prev) => [...prev, ct])}
            onDelete={(id) => setContractors((prev) => prev.filter((ct) => ct.id !== id))}
          />
        )}
        {tab === "history" && (
          <HistoryTab
            contractors={contractors}
            records={records}
            onDelete={(id) => setRecords((prev) => prev.filter((r) => r.id !== id))}
          />
        )}
      </main>

      <footer className="border-t border-border mt-8 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Суточный учёт подрядных организаций
          </span>
          <span className="text-xs text-muted-foreground font-mono-data">v1.0</span>
        </div>
      </footer>
    </div>
  );
}