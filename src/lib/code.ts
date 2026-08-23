import { prisma } from "@/lib/db";

/**
 * Okunabilir referans kodları üretir: HRC-2026-0001 / FTR-2026-0001
 * Yıl içindeki sıra numarasını sayaç olarak kullanır.
 */
export async function nextExpenseCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.expenseForm.count({
    where: { code: { startsWith: `HRC-${year}-` } },
  });
  return `HRC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextInvoiceCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { code: { startsWith: `FTR-${year}-` } },
  });
  return `FTR-${year}-${String(count + 1).padStart(4, "0")}`;
}
