"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/format";

type NavLink = { href: string; label: string; roles?: Role[] };

const LINKS: NavLink[] = [
  { href: "/dashboard", label: "Panel" },
  { href: "/expenses", label: "Harcama Formları" },
  { href: "/invoices", label: "Faturalar" },
  { href: "/admin", label: "Yönetim", roles: ["ADMIN"] },
];

export function NavBar({
  user,
}: {
  user: { name: string; role: Role; departmentName: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleLinks = LINKS.filter(
    (l) => !l.roles || l.roles.includes(user.role) || user.role === "ADMIN",
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              ₺
            </span>
            <span className="hidden text-sm font-semibold text-slate-800 sm:block">
              Fatura Onay Sistemi
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(l.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-800">
              {user.name}
            </p>
            <p className="text-xs leading-tight text-slate-500">
              {ROLE_LABELS[user.role]}
              {user.departmentName ? ` · ${user.departmentName}` : ""}
            </p>
          </div>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="btn-secondary px-3 py-1.5 text-xs"
              title="Çıkış yap"
            >
              Çıkış
            </button>
          </form>
          <button
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          {visibleLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(l.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
