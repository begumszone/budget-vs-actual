import type {
  ExpenseCategory,
  ExpenseStatus,
  InvoiceStatus,
  Role,
} from "@prisma/client";

export function formatMoney(amount: number, currency = "TRY") {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: "Çalışan",
  ACCOUNTING: "Muhasebe",
  APPROVER: "Onaycı",
  ADMIN: "Yönetici",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TAXI: "Taksi / Ulaşım",
  MEALS: "Yemek",
  ACCOMMODATION: "Konaklama",
  FLIGHT: "Uçak Bileti",
  FUEL: "Yakıt",
  OFFICE_SUPPLIES: "Ofis Malzemesi",
  ENTERTAINMENT: "Ağırlama / Temsil",
  OTHER: "Diğer",
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  SUBMITTED: "Onay Bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  REIMBURSED: "Ödendi",
};

export const EXPENSE_STATUS_STYLES: Record<ExpenseStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800 ring-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 ring-rose-200",
  REIMBURSED: "bg-sky-100 text-sky-800 ring-sky-200",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING_APPROVAL: "Onay Bekliyor",
  INFO_REQUESTED: "Bilgi İstendi",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 ring-amber-200",
  INFO_REQUESTED: "bg-violet-100 text-violet-800 ring-violet-200",
  APPROVED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 ring-rose-200",
};
