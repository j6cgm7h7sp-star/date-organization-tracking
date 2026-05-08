import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Contractor, DailyRecord, formatDate, isAlert } from "./types";

const CONTRACTORS_PASSWORD = "9456";

export function ContractorsTab({
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
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("dt_contractors_unlocked") === "1";
    } catch {
      return false;
    }
  });
  const [pwdInput, setPwdInput] = useState("");
  const [pwdError, setPwdError] = useState(false);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (pwdInput === CONTRACTORS_PASSWORD) {
      setUnlocked(true);
      setPwdError(false);
      setPwdInput("");
      try {
        sessionStorage.setItem("dt_contractors_unlocked", "1");
      } catch {
        // ignore
      }
    } else {
      setPwdError(true);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      id: `c${Date.now()}`,
      name: form.name,
    });
    setForm({ name: "" });
    setAdding(false);
  }

  if (!unlocked) {
    return (
      <div className="animate-slide-up flex items-center justify-center py-16">
        <div className="bg-white border border-border rounded-sm shadow-sm w-full max-w-md overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-primary">
            <div className="flex items-center gap-2">
              <Icon name="Lock" size={16} className="text-primary-foreground" />
              <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">
                Доступ ограничен
              </h3>
            </div>
            <p className="text-xs text-primary-foreground/70 mt-1">
              Введите пароль для управления подрядчиками
            </p>
          </div>
          <form onSubmit={handleUnlock} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={pwdInput}
                onChange={(e) => {
                  setPwdInput(e.target.value);
                  setPwdError(false);
                }}
                autoFocus
                placeholder="••••"
                className={`w-full border rounded-sm px-3 py-2 text-sm font-mono-data bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  pwdError
                    ? "border-red-400 focus:border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              {pwdError && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                  <Icon name="AlertOctagon" size={12} />
                  Неверный пароль
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold rounded-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="Unlock" size={14} />
              Разблокировать
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Доступ сохраняется до закрытия вкладки
            </p>
          </form>
        </div>
      </div>
    );
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
                  <td className="px-5 py-3 font-medium bg-[#ffffff]">{ct.name}</td>
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

export function HistoryTab({
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
                  const hasShift =
                    (r.dayShift?.length ?? 0) > 0 || (r.nightShift?.length ?? 0) > 0;
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
                        <td
                          className="px-3 py-2.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                                      <span
                                        key={idx}
                                        className="bg-amber-50 border border-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-sm"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Нет сотрудников
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-indigo-500 mb-1.5 flex items-center gap-1">
                                  🌙 Ночь
                                </p>
                                {(r.nightShift?.length ?? 0) > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {r.nightShift.map((name, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-sm"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Нет сотрудников
                                  </span>
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