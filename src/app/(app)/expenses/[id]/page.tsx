import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { ExpenseStatusBadge } from "@/components/StatusBadge";
import { FilePreview, DetailRow } from "@/components/FilePreview";
import { Timeline } from "@/components/Timeline";
import { ReviewActions } from "./ReviewActions";
import {
  EXPENSE_CATEGORY_LABELS,
  formatDate,
  formatMoney,
} from "@/lib/format";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const expense = await prisma.expenseForm.findUnique({
    where: { id },
    include: {
      submitter: { select: { name: true, email: true } },
      department: { select: { name: true } },
      reviewer: { select: { name: true } },
      receipt: true,
      auditEvents: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (!expense) notFound();

  const isAccounting = user.role === "ACCOUNTING" || user.role === "ADMIN";
  const isOwner = expense.submitterId === user.id;
  if (!isAccounting && !isOwner) notFound();

  return (
    <div>
      <PageHeader
        title={expense.purpose}
        subtitle={`${expense.code} · ${expense.submitter.name}`}
        back={{ href: "/expenses", label: "Harcama Formları" }}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Harcama Bilgileri
              </h3>
              <ExpenseStatusBadge status={expense.status} />
            </div>
            <dl className="divide-y divide-slate-100">
              <DetailRow label="Tutar">
                {formatMoney(expense.amount, expense.currency)}
              </DetailRow>
              <DetailRow label="Harcama Türü">
                {EXPENSE_CATEGORY_LABELS[expense.category]}
              </DetailRow>
              <DetailRow label="Harcama Tarihi">
                {formatDate(expense.expenseDate)}
              </DetailRow>
              <DetailRow label="Departman">
                {expense.department.name}
              </DetailRow>
              <DetailRow label="Gönderen">
                {expense.submitter.name}
              </DetailRow>
              {expense.merchant && (
                <DetailRow label="Satıcı">{expense.merchant}</DetailRow>
              )}
              {expense.reviewer && (
                <DetailRow label="İşlemi Yapan">
                  {expense.reviewer.name}
                </DetailRow>
              )}
              {expense.reviewNote && (
                <DetailRow label="Muhasebe Notu">
                  {expense.reviewNote}
                </DetailRow>
              )}
            </dl>
          </div>

          {expense.receipt && (
            <div className="card p-5">
              <FilePreview
                fileId={expense.receipt.id}
                mimeType={expense.receipt.mimeType}
                filename={expense.receipt.filename}
                label="Fiş / Belge"
              />
            </div>
          )}
        </div>

        <div className="space-y-5">
          {isAccounting && (
            <ReviewActions id={expense.id} status={expense.status} />
          )}

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              İşlem Geçmişi
            </h3>
            <Timeline
              items={expense.auditEvents.map((e) => ({
                id: e.id,
                action: e.action,
                note: e.note,
                actorName: e.actor?.name ?? null,
                createdAt: e.createdAt,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
