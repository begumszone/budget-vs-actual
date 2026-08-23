import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceStatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";

export default async function InvoicesPage() {
  const user = await requireUser();
  const isAccounting = user.role === "ACCOUNTING" || user.role === "ADMIN";

  // Muhasebe/yönetici hepsini görür.
  // Onaycı: kendisine ya da departmanına yönlendirilenleri görür.
  let where: Prisma.InvoiceWhereInput = {};
  if (!isAccounting) {
    where = {
      OR: [
        { targetUserId: user.id },
        user.departmentId
          ? { targetType: "DEPARTMENT", targetDepartmentId: user.departmentId }
          : {},
      ],
    };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { name: true } },
      targetDepartment: { select: { name: true } },
      targetUser: { select: { name: true } },
    },
  });

  const pendingCount = invoices.filter(
    (i) => i.status === "PENDING_APPROVAL",
  ).length;

  return (
    <div>
      <PageHeader
        title="Faturalar"
        subtitle={
          isAccounting
            ? `Onaya gönderdiğiniz faturalar · ${pendingCount} onay bekliyor`
            : `Onayınıza gelen faturalar · ${pendingCount} bekliyor`
        }
        action={
          isAccounting
            ? { href: "/invoices/new", label: "+ Yeni Fatura" }
            : undefined
        }
      />

      {invoices.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-slate-500">
            {isAccounting
              ? "Henüz fatura yüklenmemiş."
              : "Onayınıza gelen bir fatura yok."}
          </p>
          {isAccounting && (
            <Link href="/invoices/new" className="btn-primary mt-4 inline-flex">
              İlk faturayı yükle
            </Link>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {invoices.map((i) => (
            <Link
              key={i.id}
              href={`/invoices/${i.id}`}
              className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">
                    {i.code}
                  </span>
                  <InvoiceStatusBadge status={i.status} />
                </div>
                <p className="mt-1 truncate font-medium text-slate-800">
                  {i.vendorName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {i.description}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Onay:{" "}
                  {i.targetType === "USER"
                    ? i.targetUser?.name
                    : i.targetDepartment?.name}{" "}
                  · {formatDate(i.invoiceDate)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-slate-900">
                  {formatMoney(i.amount, i.currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
