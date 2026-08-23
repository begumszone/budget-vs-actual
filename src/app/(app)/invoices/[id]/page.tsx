import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceStatusBadge } from "@/components/StatusBadge";
import { FilePreview, DetailRow } from "@/components/FilePreview";
import { Timeline } from "@/components/Timeline";
import { DecisionForm } from "./DecisionForm";
import { formatDate, formatMoney } from "@/lib/format";

function toDateInput(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      uploader: { select: { name: true } },
      targetDepartment: { select: { name: true, id: true } },
      targetUser: { select: { name: true, id: true } },
      decider: { select: { name: true } },
      document: true,
      auditEvents: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (!invoice) notFound();

  const isAccounting = user.role === "ACCOUNTING" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";
  const isTargetUser =
    invoice.targetType === "USER" && invoice.targetUserId === user.id;
  const isTargetDept =
    invoice.targetType === "DEPARTMENT" &&
    invoice.targetDepartmentId === user.departmentId &&
    user.role === "APPROVER";

  const canView = isAccounting || isTargetUser || isTargetDept;
  if (!canView) notFound();

  const canDecide =
    (isAdmin || isTargetUser || isTargetDept) &&
    (invoice.status === "PENDING_APPROVAL" ||
      invoice.status === "INFO_REQUESTED");

  const hasBackendData =
    invoice.costCenter ||
    invoice.glAccount ||
    invoice.budgetLine ||
    invoice.projectCode ||
    invoice.isBudgeted !== null;

  return (
    <div>
      <PageHeader
        title={invoice.vendorName}
        subtitle={`${invoice.code} · ${invoice.description}`}
        back={{ href: "/invoices", label: "Faturalar" }}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Fatura Bilgileri
              </h3>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <dl className="divide-y divide-slate-100">
              <DetailRow label="Tutar">
                {formatMoney(invoice.amount, invoice.currency)}
              </DetailRow>
              {invoice.taxAmount != null && (
                <DetailRow label="KDV">
                  {formatMoney(invoice.taxAmount, invoice.currency)}
                </DetailRow>
              )}
              {invoice.invoiceNumber && (
                <DetailRow label="Fatura No">
                  {invoice.invoiceNumber}
                </DetailRow>
              )}
              <DetailRow label="Fatura Tarihi">
                {formatDate(invoice.invoiceDate)}
              </DetailRow>
              <DetailRow label="Yükleyen (Muhasebe)">
                {invoice.uploader.name}
              </DetailRow>
              <DetailRow label="Onay Hedefi">
                {invoice.targetType === "USER"
                  ? `${invoice.targetUser?.name} (kişi)`
                  : `${invoice.targetDepartment?.name} (departman)`}
              </DetailRow>
              {invoice.decider && (
                <DetailRow label="Karar Veren">
                  {invoice.decider.name}
                </DetailRow>
              )}
            </dl>
          </div>

          {invoice.document && (
            <div className="card p-5">
              <FilePreview
                fileId={invoice.document.id}
                mimeType={invoice.document.mimeType}
                filename={invoice.document.filename}
                label="Fatura Görüntüsü"
              />
            </div>
          )}

          {/* Onaycının doldurduğu arka taraf verileri */}
          {hasBackendData && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Departman Kayıt Bilgileri
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 divide-slate-100">
                {invoice.costCenter && (
                  <DetailRow label="Masraf Merkezi">
                    {invoice.costCenter}
                  </DetailRow>
                )}
                {invoice.glAccount && (
                  <DetailRow label="GL Hesabı">{invoice.glAccount}</DetailRow>
                )}
                {invoice.budgetLine && (
                  <DetailRow label="Bütçe Kalemi">
                    {invoice.budgetLine}
                  </DetailRow>
                )}
                {invoice.projectCode && (
                  <DetailRow label="Proje Kodu">
                    {invoice.projectCode}
                  </DetailRow>
                )}
                {invoice.isBudgeted !== null && (
                  <DetailRow label="Bütçede">
                    {invoice.isBudgeted ? "Evet" : "Hayır"}
                  </DetailRow>
                )}
                {invoice.serviceStartDate && (
                  <DetailRow label="Hizmet Başl.">
                    {formatDate(invoice.serviceStartDate)}
                  </DetailRow>
                )}
                {invoice.serviceEndDate && (
                  <DetailRow label="Hizmet Bitiş">
                    {formatDate(invoice.serviceEndDate)}
                  </DetailRow>
                )}
              </dl>
              {invoice.approverNote && (
                <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium">Not:</span>{" "}
                  {invoice.approverNote}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {canDecide ? (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Onay Kararı
              </h3>
              <DecisionForm
                id={invoice.id}
                defaults={{
                  costCenter: invoice.costCenter,
                  glAccount: invoice.glAccount,
                  budgetLine: invoice.budgetLine,
                  projectCode: invoice.projectCode,
                  isBudgeted: invoice.isBudgeted,
                  serviceStartDate: toDateInput(invoice.serviceStartDate),
                  serviceEndDate: toDateInput(invoice.serviceEndDate),
                  approverNote: invoice.approverNote,
                }}
              />
            </div>
          ) : (
            invoice.status === "INFO_REQUESTED" &&
            isAccounting && (
              <div className="card border-violet-200 bg-violet-50 p-5">
                <h3 className="mb-1 text-sm font-semibold text-violet-800">
                  Bilgi talebi
                </h3>
                <p className="text-sm text-violet-700">
                  Onaycı ek bilgi istedi:{" "}
                  {invoice.approverNote ?? "(not yok)"}
                </p>
              </div>
            )
          )}

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              İşlem Geçmişi
            </h3>
            <Timeline
              items={invoice.auditEvents.map((e) => ({
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
