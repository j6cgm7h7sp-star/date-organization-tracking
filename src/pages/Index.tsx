import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Contractor,
  DailyRecord,
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
import {
  fetchContractors,
  fetchRecords,
  saveContractor,
  saveRecord,
  deleteContractor as apiDeleteContractor,
  deleteRecord as apiDeleteRecord,
} from "@/components/daily-tracker/api";

export default function Index() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [tab, setTab] = useState<Tab>("entry");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [c, r] = await Promise.all([fetchContractors(), fetchRecords()]);
        if (mounted) {
          setContractors(c);
          setRecords(r);
        }
      } catch (e) {
        console.error("Ошибка загрузки данных", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleAddContractor(c: Contractor) {
    setContractors((prev) => [...prev, c]);
    try {
      await saveContractor(c);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteContractor(id: string) {
    setContractors((prev) => prev.filter((ct) => ct.id !== id));
    try {
      await apiDeleteContractor(id);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveRecord(r: DailyRecord) {
    setRecords((prev) => [r, ...prev]);
    try {
      await saveRecord(r);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteRecord(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiDeleteRecord(id);
    } catch (e) {
      console.error(e);
    }
  }

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
      {/* Brand stripe */}
      <div className="h-1 rzd-stripe sticky top-0 z-40" />

      {/* Header */}
      <header className="bg-primary border-b border-primary/20 shadow-sm sticky top-1 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-rzd-red flex items-center justify-center shadow-sm">
                <Icon name="TrainFront" size={20} className="text-white" />
              </div>
              <div className="border-l-2 border-rzd-red pl-3">
                <h1 className="text-sm font-bold text-white tracking-wide uppercase leading-tight">
                  Суточный отчёт
                </h1>
                <p className="text-[11px] text-white/70 leading-tight font-medium tracking-wider uppercase">
                  СТРОИТЕЛЬСТВО ВСМ · Техника и люди
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-vsm-blue/15 border border-vsm-blue/50 rounded-sm pl-2 pr-2.5 py-1 shadow-sm">
                <Icon name="TramFront" size={14} className="text-white" />
                <span className="text-[11px] font-bold tracking-[0.18em] text-white uppercase">
                  ВСМ
                </span>
                <span className="w-1 h-1 rounded-full bg-rzd-red animate-pulse" />
              </div>
              {alertCount > 0 && (
                <div className="flex items-center gap-1.5 bg-rzd-red/20 border border-rzd-red/40 rounded-sm px-2.5 py-1">
                  <Icon name="Bell" size={12} className="text-white" />
                  <span className="text-xs font-semibold text-white">
                    {alertCount} откл. сегодня
                  </span>
                </div>
              )}
              <span className="text-xs text-white/55 font-mono-data hidden sm:block">
                {formatDate(today())}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-border sticky top-[68px] z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-rzd-red text-rzd-red"
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
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Icon name="Loader2" size={16} className="animate-spin" />
            Загрузка данных...
          </div>
        ) : (
          <>
            {tab === "entry" && (
              <EntryTab
                contractors={contractors}
                records={records}
                onSave={handleSaveRecord}
              />
            )}
            {tab === "reports" && (
              <ReportsTab contractors={contractors} records={records} />
            )}
            {tab === "contractors" && (
              <ContractorsTab
                contractors={contractors}
                onAdd={handleAddContractor}
                onDelete={handleDeleteContractor}
              />
            )}
            {tab === "history" && (
              <HistoryTab
                contractors={contractors}
                records={records}
                onDelete={handleDeleteRecord}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border mt-8 bg-white">
        <div className="h-0.5 rzd-accent-bar" />
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="TrainFront" size={14} className="text-rzd-red" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Суточный отчёт · СТРОИТЕЛЬСТВО ВСМ
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono-data">v1.0</span>
        </div>
      </footer>
    </div>
  );
}