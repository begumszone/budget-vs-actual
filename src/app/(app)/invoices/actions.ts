"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nextInvoiceCode } from "@/lib/code";
import { saveUploadedFile, isFileError } from "@/lib/files";

export type InvoiceFormState = { error?: string };

const createSchema = z
  .object({
    vendorName: z.string().min(2, "Tedarikçi adını giriniz."),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().min(1, "Fatura tarihini giriniz."),
    amount: z.coerce.number().positive("Tutar 0'dan büyük olmalıdır."),
    currency: z.string().min(1),
    taxAmount: z.coerce.number().min(0).optional(),
    description: z.string().min(3, "Fatura açıklamasını giriniz."),
    targetType: z.enum(["DEPARTMENT", "USER"]),
    targetDepartmentId: z.string().optional(),
    targetUserId: z.string().optional(),
  })
  .refine(
    (d) =>
      d.targetType === "DEPARTMENT"
        ? !!d.targetDepartmentId
        : !!d.targetUserId,
    { message: "Onaya gönderilecek departman veya kişiyi seçiniz." },
  );

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const user = await requireUser();
  if (user.role !== "ACCOUNTING" && user.role !== "ADMIN") {
    return { error: "Yalnızca muhasebe fatura yükleyebilir." };
  }

  const parsed = createSchema.safeParse({
    vendorName: formData.get("vendorName"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    taxAmount: formData.get("taxAmount") || undefined,
    description: formData.get("description"),
    targetType: formData.get("targetType"),
    targetDepartmentId: formData.get("targetDepartmentId") || undefined,
    targetUserId: formData.get("targetUserId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }
  const data = parsed.data;

  // Fatura PDF/görüntüsü zorunlu
  const doc = await saveUploadedFile(formData.get("document"), user.id, {
    required: true,
  });
  if (isFileError(doc)) {
    return { error: doc.error };
  }

  // Kişiye yönlendirme durumunda hedef kullanıcının departmanını da not al
  let targetDepartmentId = data.targetDepartmentId || null;
  if (data.targetType === "USER" && data.targetUserId) {
    const target = await prisma.user.findUnique({
      where: { id: data.targetUserId },
      select: { departmentId: true },
    });
    targetDepartmentId = target?.departmentId ?? null;
  }

  const code = await nextInvoiceCode();

  const invoice = await prisma.invoice.create({
    data: {
      code,
      uploaderId: user.id,
      vendorName: data.vendorName,
      invoiceNumber: data.invoiceNumber || null,
      invoiceDate: new Date(data.invoiceDate),
      amount: data.amount,
      currency: data.currency,
      taxAmount: data.taxAmount ?? null,
      description: data.description,
      documentId: doc?.id ?? null,
      targetType: data.targetType,
      targetDepartmentId,
      targetUserId: data.targetType === "USER" ? data.targetUserId : null,
      auditEvents: {
        create: {
          action: "CREATED",
          actorId: user.id,
          note: "Fatura yüklendi ve onaya gönderildi.",
        },
      },
    },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

// ----- Onaycının kararı + arka taraf verilerini doldurması -----

const decideSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "INFO_REQUESTED"]),
  costCenter: z.string().optional(),
  glAccount: z.string().optional(),
  budgetLine: z.string().optional(),
  projectCode: z.string().optional(),
  isBudgeted: z.string().optional(), // "yes" | "no" | ""
  serviceStartDate: z.string().optional(),
  serviceEndDate: z.string().optional(),
  approverNote: z.string().optional(),
});

async function canDecide(
  invoiceId: string,
  user: { id: string; role: string; departmentId: string | null },
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { ok: false as const, error: "Fatura bulunamadı." };
  if (user.role === "ADMIN") return { ok: true as const, invoice };
  if (user.role !== "APPROVER")
    return { ok: false as const, error: "Onay yetkiniz yok." };

  // Kişiye yönlendirildiyse yalnızca o kişi; departmana yönlendirildiyse
  // o departmandaki onaycılar karar verebilir.
  if (invoice.targetType === "USER") {
    if (invoice.targetUserId !== user.id)
      return { ok: false as const, error: "Bu fatura size atanmamış." };
  } else {
    if (invoice.targetDepartmentId !== user.departmentId)
      return {
        ok: false as const,
        error: "Bu fatura departmanınıza atanmamış.",
      };
  }
  return { ok: true as const, invoice };
}

export async function decideInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const user = await requireUser();

  const parsed = decideSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    costCenter: formData.get("costCenter"),
    glAccount: formData.get("glAccount"),
    budgetLine: formData.get("budgetLine"),
    projectCode: formData.get("projectCode"),
    isBudgeted: formData.get("isBudgeted"),
    serviceStartDate: formData.get("serviceStartDate"),
    serviceEndDate: formData.get("serviceEndDate"),
    approverNote: formData.get("approverNote"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }
  const data = parsed.data;

  const check = await canDecide(data.id, {
    id: user.id,
    role: user.role,
    departmentId: user.departmentId,
  });
  if (!check.ok) return { error: check.error };
  if (check.invoice.status === "APPROVED" || check.invoice.status === "REJECTED") {
    return { error: "Bu fatura zaten sonuçlandırılmış." };
  }

  if (data.decision === "REJECTED" && !data.approverNote?.trim()) {
    return { error: "Reddetme gerekçesi yazınız." };
  }
  if (data.decision === "INFO_REQUESTED" && !data.approverNote?.trim()) {
    return { error: "Muhasebeden ne istediğinizi yazınız." };
  }
  // Onay için arka taraf verilerinden en azından masraf merkezi ve GL hesabı
  if (data.decision === "APPROVED") {
    if (!data.costCenter?.trim() || !data.glAccount?.trim()) {
      return {
        error:
          "Onay için en az Masraf Merkezi ve Muhasebe (GL) Hesabı alanlarını doldurun.",
      };
    }
  }

  const isBudgeted =
    data.isBudgeted === "yes" ? true : data.isBudgeted === "no" ? false : null;

  await prisma.invoice.update({
    where: { id: data.id },
    data: {
      status: data.decision,
      // Arka taraf verilerini her durumda kaydet (bilgi istense de girilmiş olabilir)
      costCenter: data.costCenter?.trim() || null,
      glAccount: data.glAccount?.trim() || null,
      budgetLine: data.budgetLine?.trim() || null,
      projectCode: data.projectCode?.trim() || null,
      isBudgeted,
      serviceStartDate: data.serviceStartDate
        ? new Date(data.serviceStartDate)
        : null,
      serviceEndDate: data.serviceEndDate
        ? new Date(data.serviceEndDate)
        : null,
      approverNote: data.approverNote?.trim() || null,
      deciderId: data.decision === "INFO_REQUESTED" ? null : user.id,
      decidedAt: data.decision === "INFO_REQUESTED" ? null : new Date(),
      auditEvents: {
        create: {
          action: data.decision,
          actorId: user.id,
          note: data.approverNote?.trim() || null,
        },
      },
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${data.id}`);
  return {};
}
