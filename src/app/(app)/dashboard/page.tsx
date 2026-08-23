import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InvoiceStatusBadge, ExpenseStatusBadge } from "@/components/StatusBadge";
import { ROLE_LABELS, formatMoney } from "@/lib/format";

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="card flex flex-col gap-1 p-4 transition hover:shadow-md"
    >
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isAccounting = user.role === "ACCOUNTING" || user.role === "ADMIN";

  // Onaycıya gelen bekleyen faturalar filtresi
  const approverInvoiceFilter: Prisma.InvoiceWhereInput = {
    status: "PENDING_APPROVAL",
    OR: [
      { targetUserId: user.id },
      user.departmentId
        ? { targetType: "DEPARTMENT", targetDepartmentId: user.departmentId }
        : {},
    ],
  };

  const [
    myExpensesPending,
    expensesToReview,
    invoicesPendingForMe,
    myInvoicesPending,
    recentExpenses,
    recentInvoices,
  ] = await Promise.all([
    prisma.expenseForm.count({
      where: { submitterId: user.id, status: "SUBMITTED" },
    }),
    isAccounting
      ? prisma.expenseForm.count({ where: { status: "SUBMITTED" } })
      : Promise.resolve(0),
    user.role === "APPROVER" || user.role === "ADMIN"
      ? prisma.invoice.count({ where: approverInvoiceFilter })
      : Promise.resolve(0),
    isAccounting
      ? prisma.invoice.count({ where: { status: "PENDING_APPROVAL" } })
      : Promise.resolve(0),
    prisma.expenseForm.findMany({
      where: isAccounting ? {} : { submitterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { department: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where:
        user.role === "APPROVER"
          ? {
              OR: [
                { targetUserId: user.id },
                user.departmentId
                  ? {
                      targetType: "DEPARTMENT",
                      targetDepartmentId: user.departmentId,
                    }
                  : {},
              ],
            }
          : {},
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Merhaba, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {ROLE_LABELS[user.role]}
          {user.department ? ` · ${user.department.name}` : ""}
        </p>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bekleyen harcamalarım"
          value={myExpensesPending}
          href="/expenses"
          accent="text-amber-600"
        />
        {isAccounting && (
          <StatCard
            label="İnceleyeceğim harcamalar"
            value={expensesToReview}
            href="/expenses"
            accent="text-brand-600"
          />
        )}
        {(user.role === "APPROVER" || user.role === "ADMIN") && (
          <StatCard
            label="Onayımdaki faturalar"
            value={invoicesPendingForMe}
            href="/invoices"
            accent="text-violet-600"
          />
        )}
        {isAccounting && (
          <StatCard
            label="Onay bekleyen faturalar"
            value={myInvoicesPending}
            href="/invoices"
            accent="text-brand-600"
          />
        )}
      </div>

      {/* Hızlı işlemler */}
      <div className="flex flex-wrap gap-3">
        <Link href="/expenses/new" className="btn-primary">
          + Harcama Formu Oluştur
        </Link>
        {isAccounting && (
          <Link href="/invoices/new" className="btn-secondary">
            + Fatura Yükle
          </Link>
        )}
      </div>

      {/* Son kayıtlar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Son Harcamalar
            </h2>
            <Link href="/expenses" className="text-xs text-brand-700">
              Tümü →
            </Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {recentExpenses.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Kayıt yok.</p>
            ) : (
              recentExpenses.map((e) => (
                <Link
                  key={e.id}
                  href={`/expenses/${e.id}`}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {e.purpose}
                    </p>
                    <p className="text-xs text-slate-500">
                      {e.department.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatMoney(e.amount, e.currency)}
                    </span>
                    <ExpenseStatusBadge status={e.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Son Faturalar
            </h2>
            <Link href="/invoices" className="text-xs text-brand-700">
              Tümü →
            </Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {recentInvoices.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Kayıt yok.</p>
            ) : (
              recentInvoices.map((i) => (
                <Link
                  key={i.id}
                  href={`/invoices/${i.id}`}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {i.vendorName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {i.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatMoney(i.amount, i.currency)}
                    </span>
                    <InvoiceStatusBadge status={i.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
