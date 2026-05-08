import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Contractor,
  DailyRecord,
  deviationClass,
  deviationStr,
  formatNightShiftDate,
  isAlert,
  today,
} from "./types";
import { AlertBanner } from "./shared";

export default function EntryTab({
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

  const todayAlerts = records.filter((r) => r.date === today() && isAlert(r));

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
      shiftType: personShift,
      filledBy: (personShift === "night" ? nightShift[0] : dayShift[0]) || "",
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
      {todayAlerts.length > 0 && <AlertBanner records={todayAlerts} />}

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
                Заполнил
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
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addPerson())
                }
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
                  <div
                    key={`d${i}`}
                    className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-sm pl-2 pr-1 py-0.5"
                  >
                    <span className="text-xs text-amber-700 font-medium">
                      ☀
                    </span>
                    <span className="text-sm">{name}</span>
                    <button
                      type="button"
                      onClick={() => removePerson("day", i)}
                      className="text-amber-400 hover:text-red-500 transition-colors ml-0.5"
                    >
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                ))}
                {nightShift.map((name, i) => (
                  <div
                    key={`n${i}`}
                    className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-sm pl-2 pr-1 py-0.5"
                  >
                    <span className="text-xs text-indigo-400 font-medium">
                      🌙
                    </span>
                    <span className="text-sm">{name}</span>
                    <button
                      type="button"
                      onClick={() => removePerson("night", i)}
                      className="text-indigo-300 hover:text-red-500 transition-colors ml-0.5"
                    >
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
                  Number(form.machineryFact),
                )}`}
              >
                Отклонение:{" "}
                {deviationStr(
                  Number(form.machineryPlan),
                  Number(form.machineryFact),
                )}{" "}
                ед.
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
                  Number(form.peopleFact),
                )}`}
              >
                Отклонение:{" "}
                {deviationStr(Number(form.peoplePlan), Number(form.peopleFact))}{" "}
                чел.
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