import { Contractor, DailyRecord } from "./types";

const CONTRACTORS_URL = "https://functions.poehali.dev/50366a5c-a0af-4eca-b72b-356c6e0e6216";
const RECORDS_URL = "https://functions.poehali.dev/7f7f6c65-de52-43fc-9de3-edf3941b9223";

export async function fetchContractors(): Promise<Contractor[]> {
  const res = await fetch(CONTRACTORS_URL);
  const data = await res.json();
  return (data.items || []) as Contractor[];
}

export async function saveContractor(c: Contractor): Promise<void> {
  await fetch(CONTRACTORS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  });
}

export async function deleteContractor(id: string): Promise<void> {
  await fetch(`${CONTRACTORS_URL}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchRecords(): Promise<DailyRecord[]> {
  const res = await fetch(RECORDS_URL);
  const data = await res.json();
  return (data.items || []).map((r: DailyRecord) => ({
    ...r,
    dayShift: Array.isArray(r.dayShift) ? r.dayShift : [],
    nightShift: Array.isArray(r.nightShift) ? r.nightShift : [],
  })) as DailyRecord[];
}

export async function saveRecord(r: DailyRecord): Promise<void> {
  await fetch(RECORDS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(r),
  });
}

export async function deleteRecord(id: string): Promise<void> {
  await fetch(`${RECORDS_URL}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
