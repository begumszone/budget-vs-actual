import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABELS } from "@/lib/format";

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { department: { select: { name: true } } },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Yönetim"
        subtitle="Kullanıcılar ve departmanlar"
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Kullanıcılar ({users.length})
        </h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ad Soyad</th>
                <th className="px-4 py-2.5 font-medium">E-posta</th>
                <th className="px-4 py-2.5 font-medium">Rol</th>
                <th className="px-4 py-2.5 font-medium">Departman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {u.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {ROLE_LABELS[u.role]}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {u.department?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Departmanlar ({departments.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.id} className="card p-4">
              <p className="font-medium text-slate-800">{d.name}</p>
              <p className="text-xs text-slate-500">
                Kod: {d.code} · {d._count.users} kullanıcı
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
        Not: Kullanıcı ve departman ekleme/düzenleme, ilk sürümde{" "}
        <code>prisma/seed.ts</code> üzerinden yapılır. İsterseniz bir sonraki
        adımda buraya form tabanlı yönetim ekleyebiliriz.
      </p>
    </div>
  );
}
