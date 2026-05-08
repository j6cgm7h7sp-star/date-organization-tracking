import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Contractor,
  DailyRecord,
  INITIAL_CONTRACTORS,
  INITIAL_RECORDS,
  Tab,
  formatDate,
  isAlert,
  today,
} from "@/components/daily-tracker/types";
import EntryTab from "@/components/daily-tracker/EntryTab";
import ReportsTab from "@/components/daily-tracker/ReportsTab";
import {
  ContractorsTab,
  HistoryTab,
} from "@/components/daily-tracker/ContractorsAndHistoryTabs";

const CONTRACTORS_STORAGE_KEY = "dt_contractors_v1";
const RECORDS_STORAGE_KEY = "dt_records_v1";

function loadContractors(): Contractor[] {
  try {
    const raw = localStorage.getItem(CONTRACTORS_STORAGE_KEY);
    if (!raw) return INITIAL_CONTRACTORS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((c) => c && typeof c.id === "string" && typeof c.name === "string")) {
      return parsed;
    }
    return INITIAL_CONTRACTORS;
  } catch {
    return INITIAL_CONTRACTORS;
  }
}

function loadRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return INITIAL_RECORDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((r) => ({
        ...r,
        dayShift: Array.isArray(r.dayShift) ? r.dayShift : [],
        nightShift: Array.isArray(r.nightShift) ? r.nightShift : [],
      }));
    }
    return INITIAL_RECORDS;
  } catch {
    return INITIAL_RECORDS;
  }
}

export default function Index() {
  const [contractors, setContractors] = useState<Contractor[]>(() => loadContractors());
  const [records, setRecords] = useState<DailyRecord[]>(() => loadRecords());
  const [tab, setTab] = useState<Tab>("entry");

  useEffect(() => {
    try {
      localStorage.setItem(CONTRACTORS_STORAGE_KEY, JSON.stringify(contractors));
    } catch {
      // ignore quota errors
    }
  }, [contractors]);

  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore quota errors
    }
  }, [records]);

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