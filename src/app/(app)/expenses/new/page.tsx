import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { ExpenseForm } from "./ExpenseForm";

export default async function NewExpensePage() {
  const user = await requireUser();
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Yeni Harcama Formu"
        subtitle="Yaptığınız harcamayı fişiyle birlikte muhasebeye gönderin."
        back={{ href: "/expenses", label: "Harcama Formları" }}
      />
      <ExpenseForm
        departments={departments}
        defaultDepartmentId={user.departmentId ?? undefined}
        today={today}
      />
    </div>
  );
}
