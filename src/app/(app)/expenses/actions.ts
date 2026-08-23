"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nextExpenseCode } from "@/lib/code";
import { saveUploadedFile, isFileError } from "@/lib/files";
import type { ExpenseCategory } from "@prisma/client";

export type ExpenseFormState = { error?: string };

const createSchema = z.object({
  departmentId: z.string().min(1, "Departman seçiniz."),
  category: z.enum([
    "TAXI",
    "MEALS",
    "ACCOMMODATION",
    "FLIGHT",
    "FUEL",
    "OFFICE_SUPPLIES",
    "ENTERTAINMENT",
    "OTHER",
  ]),
  expenseDate: z.string().min(1, "Harcama tarihi giriniz."),
  amount: z.coerce.number().positive("Tutar 0'dan büyük olmalıdır."),
  currency: z.string().min(1),
  purpose: z.string().min(3, "Harcamanın amacını yazınız."),
  merchant: z.string().optional(),
});

export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const user = await requireUser();

  const parsed = createSchema.safeParse({
    departmentId: formData.get("departmentId"),
    category: formData.get("category"),
    expenseDate: formData.get("expenseDate"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    purpose: formData.get("purpose"),
    merchant: formData.get("merchant"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  // Fiş / belge fotoğrafı zorunlu
  const receipt = await saveUploadedFile(formData.get("receipt"), user.id, {
    required: true,
  });
  if (isFileError(receipt)) {
    return { error: receipt.error };
  }

  const data = parsed.data;
  const code = await nextExpenseCode();

  const expense = await prisma.expenseForm.create({
    data: {
      code,
      submitterId: user.id,
      departmentId: data.departmentId,
      category: data.category as ExpenseCategory,
      expenseDate: new Date(data.expenseDate),
      amount: data.amount,
      currency: data.currency,
      purpose: data.purpose,
      merchant: data.merchant || null,
      receiptId: receipt?.id ?? null,
      auditEvents: {
        create: {
          action: "CREATED",
          actorId: user.id,
          note: "Harcama formu oluşturuldu ve muhasebe onayına gönderildi.",
        },
      },
    },
  });

  revalidatePath("/expenses");
  redirect(`/expenses/${expense.id}`);
}

const reviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "REIMBURSED"]),
  note: z.string().optional(),
});

export async function reviewExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const user = await requireUser();
  if (user.role !== "ACCOUNTING" && user.role !== "ADMIN") {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const parsed = reviewSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: "Geçersiz istek." };
  }
  const { id, decision, note } = parsed.data;

  const expense = await prisma.expenseForm.findUnique({ where: { id } });
  if (!expense) return { error: "Kayıt bulunamadı." };

  if (decision === "REIMBURSED" && expense.status !== "APPROVED") {
    return { error: "Yalnızca onaylı harcamalar ödendi olarak işaretlenebilir." };
  }
  if (
    (decision === "APPROVED" || decision === "REJECTED") &&
    expense.status !== "SUBMITTED"
  ) {
    return { error: "Bu harcama zaten sonuçlandırılmış." };
  }
  if (decision === "REJECTED" && !note?.trim()) {
    return { error: "Reddetme gerekçesi yazınız." };
  }

  await prisma.expenseForm.update({
    where: { id },
    data: {
      status: decision,
      reviewerId: user.id,
      reviewNote: note?.trim() || expense.reviewNote,
      reviewedAt: new Date(),
      auditEvents: {
        create: {
          action: decision,
          actorId: user.id,
          note: note?.trim() || null,
        },
      },
    },
  });

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
  return {};
}
