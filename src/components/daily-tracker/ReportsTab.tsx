import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Contractor,
  DailyRecord,
  deviationClass,
  deviationStr,
  formatDate,
  today,
} from "./types";
import { StatusBadge } from "./shared";

export default function ReportsTab({
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
  const [selectedContractor, setSelectedContractor] = useState<string>("all");

  const dayRecords = records
    .filter((r) => r.date === selectedDate)
    .filter((r) => selectedContractor === "all" || r.contractorId === selectedContractor);

  const selectedContractorName =
    selectedContractor === "all"
      ? "все подрядчики"
      : contractors.find((c) => c.id === selectedContractor)?.name ?? "";

  function downloadReport(format: "excel" | "pdf") {
    const lines: string[] = [];
    lines.push(`Отчёт за ${formatDate(selectedDate)}`);
    lines.push(`Подрядчик: ${selectedContractorName}`);
    lines.push("");
    lines.push(
      "Подрядчик;Тех. план;Тех. факт;Откл. тех.;Статус тех.;Люди план;Люди факт;Откл. люди;Статус людей"
    );
    dayRecords.forEach((r) => {
      const ct = contractors.find((x) => x.id === r.contractorId);
      const macAlert = r.machineryFact < r.machineryPlan ? "Отклонение" : "Норма";
      const peopleAlert = r.peopleFact < r.peoplePlan ? "Отклонение" : "Норма";
      lines.push(
        [
          ct?.name ?? "—",
          r.machineryPlan,
          r.machineryFact,
          deviationStr(r.machineryPlan, r.machineryFact),
          macAlert,
          r.peoplePlan,
          r.peopleFact,
          deviationStr(r.peoplePlan, r.peopleFact),
          peopleAlert,
        ].join(";")
      );
    });
    lines.push(
      [
        "ИТОГО",
        totalMacPlan,
        totalMacFact,
        deviationStr(totalMacPlan, totalMacFact),
        totalMacFact < totalMacPlan ? "Отклонение" : "Норма",
        totalPeoplePlan,
        totalPeopleFact,
        deviationStr(totalPeoplePlan, totalPeopleFact),
        totalPeopleFact < totalPeoplePlan ? "Отклонение" : "Норма",
      ].join(";")
    );
    const ext = format === "excel" ? "csv" : "txt";
    const safeName = selectedContractorName.replace(/[^а-яА-Яa-zA-Z0-9]/g, "_");
    const filename = `Отчёт_${selectedDate}_${safeName}.${ext}`;
    const blob = new Blob(["\ufeff" + lines.join("\n")], {
      type: format === "excel" ? "text/csv;charset=utf-8" : "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  const totalMacPlan = dayRecords.reduce((s, r) => s + r.machineryPlan, 0);
  const totalMacFact = dayRecords.reduce((s, r) => s + r.machineryFact, 0);
  const totalPeoplePlan = dayRecords.reduce((s, r) => s + r.peoplePlan, 0);
  const totalPeopleFact = dayRecords.reduce((s, r) => s + r.peopleFact, 0);

  const summaryCards = [
    {
      label: "Техника план",
      value: totalMacPlan,
      unit: "ед.",
      icon: "Truck",
      dev: undefined,
      devClass: undefined,
    },
    {
      label: "Техника факт",
      value: totalMacFact,
      unit: "ед.",
      icon: "Truck",
      dev: deviationStr(totalMacPlan, totalMacFact),
      devClass: deviationClass(totalMacPlan, totalMacFact),
    },
    {
      label: "Люди план",
      value: totalPeoplePlan,
      unit: "чел.",
      icon: "Users",
      dev: undefined,
      devClass: undefined,
    },
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
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Подрядчик:
          </label>
          <select
            value={selectedContractor}
            onChange={(e) => setSelectedContractor(e.target.value)}
            className="border border-border rounded-sm px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[220px]"
          >
            <option value="all">Все подрядчики</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
            {selectedContractor !== "all" && (
              <span className="text-muted-foreground font-normal">
                {" "}
                · {selectedContractorName}
              </span>
            )}
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
                            <Icon
                              name="AlertTriangle"
                              size={12}
                              className="text-amber-500 shrink-0"
                            />
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
                          <span className="text-xs font-semibold text-amber-600">
                            ⚠ Отклонение
                          </span>
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
                          <span className="text-xs font-semibold text-amber-600">
                            ⚠ Отклонение
                          </span>
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => downloadReport("excel")}
          disabled={dayRecords.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="FileSpreadsheet" size={14} />
          Скачать Excel
        </button>
        <button
          onClick={() => downloadReport("pdf")}
          disabled={dayRecords.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="FileText" size={14} />
          Скачать PDF
        </button>
        {selectedContractor !== "all" && (
          <span className="text-xs text-muted-foreground ml-2">
            Будет выгружен отчёт по: <b className="text-foreground">{selectedContractorName}</b>
          </span>
        )}
      </div>
    </div>
  );
}
