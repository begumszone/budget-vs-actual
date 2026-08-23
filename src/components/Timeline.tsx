import { formatDateTime } from "@/lib/format";

export type TimelineItem = {
  id: string;
  action: string;
  note: string | null;
  actorName: string | null;
  createdAt: Date;
};

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Oluşturuldu",
  SUBMITTED: "Onaya gönderildi",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  INFO_REQUESTED: "Ek bilgi istendi",
  REIMBURSED: "Ödendi olarak işaretlendi",
  UPDATED: "Güncellendi",
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: "bg-slate-400",
  SUBMITTED: "bg-brand-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
  INFO_REQUESTED: "bg-violet-500",
  REIMBURSED: "bg-sky-500",
  UPDATED: "bg-slate-400",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Henüz işlem yok.</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
              ACTION_COLORS[item.action] ?? "bg-slate-400"
            }`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-sm font-medium text-slate-800">
              {ACTION_LABELS[item.action] ?? item.action}
            </p>
            <p className="text-xs text-slate-400">
              {formatDateTime(item.createdAt)}
            </p>
          </div>
          {item.actorName && (
            <p className="text-xs text-slate-500">{item.actorName}</p>
          )}
          {item.note && (
            <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-600">
              {item.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
