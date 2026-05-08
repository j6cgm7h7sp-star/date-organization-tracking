import Icon from "@/components/ui/icon";
import { DailyRecord, deviation, isAlert } from "./types";

export function StatusBadge({ plan, fact }: { plan: number; fact: number }) {
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

export function AlertBanner({ records }: { records: DailyRecord[] }) {
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
          <p className="text-xs text-amber-700 mt-0.5">Отклонение план/факт ≥20%</p>
        </div>
      </div>
    </div>
  );
}

export default StatusBadge;
