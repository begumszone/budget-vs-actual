import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { ExpenseStatusBadge } from "@/components/StatusBadge";
import {
  EXPENSE_CATEGORY_LABELS,
  formatDate,
  formatMoney,
} from "@/lib/format";

export default async function ExpensesPage() {
  const user = await requireUser();
  const isAccounting = user.role === "ACCOUNTING" || user.role === "ADMIN";

  // Muhasebe / yönetici tüm formları görür; çalışan yalnızca kendininkini.
  const expenses = await prisma.expenseForm.findMany({
    where: isAccounting ? {} : { submitterId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      submitter: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  const pendingCount = expenses.filter((e) => e.status === "SUBMITTED").length;

  return (
    <div>
      <PageHeader
        title="Harcama Formları"
        subtitle={
          isAccounting
            ? `Tüm departmanlardan gelen harcamalar · ${pendingCount} onay bekliyor`
            : "Oluşturduğunuz harcama formları"
        }
        action={{ href: "/expenses/new", label: "+ Yeni Harcama" }}
      />

      {expenses.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-500">Henüz harcama formu yok.</p>
          <Link href="/expenses/new" className="btn-primary mt-4 inline-flex">
            İlk harcamayı oluştur
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {expenses.map((e) => (
            <Link
              key={e.id}
              href={`/expenses/${e.id}`}
              className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">
                    {e.code}
                  </span>
                  <ExpenseStatusBadge status={e.status} />
                </div>
                <p className="mt-1 truncate font-medium text-slate-800">
                  {e.purpose}
                </p>
                <p className="text-xs text-slate-500">
                  {EXPENSE_CATEGORY_LABELS[e.category]} ·{" "}
                  {isAccounting ? `${e.submitter.name} · ` : ""}
                  {e.department.name} · {formatDate(e.expenseDate)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-slate-900">
                  {formatMoney(e.amount, e.currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
