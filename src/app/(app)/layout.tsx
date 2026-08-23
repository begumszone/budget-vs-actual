import { requireUser } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <NavBar
        user={{
          name: user.name,
          role: user.role,
          departmentName: user.department?.name ?? null,
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
