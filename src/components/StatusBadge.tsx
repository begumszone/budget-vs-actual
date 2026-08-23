import type { ExpenseStatus, InvoiceStatus } from "@prisma/client";
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_STYLES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_STYLES,
} from "@/lib/format";

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <span className={`badge ${EXPENSE_STATUS_STYLES[status]}`}>
      {EXPENSE_STATUS_LABELS[status]}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`badge ${INVOICE_STATUS_STYLES[status]}`}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
