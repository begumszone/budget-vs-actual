import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceForm } from "./InvoiceForm";

export default async function NewInvoicePage() {
  const user = await requireUser();
  if (user.role !== "ACCOUNTING" && user.role !== "ADMIN") {
    redirect("/invoices");
  }

  const [departments, approvers] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["APPROVER", "ADMIN"] }, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        department: { select: { name: true } },
      },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Yeni Fatura"
        subtitle="Faturayı yükleyin ve ilgili departman ya da kişiye onaya gönderin."
        back={{ href: "/invoices", label: "Faturalar" }}
      />
      <InvoiceForm
        departments={departments}
        approvers={approvers.map((a) => ({
          id: a.id,
          name: a.name,
          departmentName: a.department?.name ?? null,
        }))}
        today={today}
      />
    </div>
  );
}
