"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const DEMO_ACCOUNTS = [
  { role: "Muhasebe", email: "muhasebe@sirket.com" },
  { role: "Çalışan (Begüm)", email: "begum@sirket.com" },
  { role: "Onaycı (İş Gel.)", email: "selin@sirket.com" },
  { role: "Yönetici", email: "admin@sirket.com" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/30">
            ₺
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Fatura Onay Sistemi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Harcama formları ve fatura onayları için giriş yapın
          </p>
        </div>

        <div className="card p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="ad@sirket.com"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Parola
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full"
            >
              {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white/70 p-4 text-sm">
          <p className="mb-2 font-medium text-slate-600">
            Demo hesapları (parola: <code className="text-brand-700">parola123</code>)
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((a) => (
              <li
                key={a.email}
                className="flex flex-col rounded-md bg-slate-50 px-2.5 py-1.5"
              >
                <span className="text-xs font-medium text-slate-500">
                  {a.role}
                </span>
                <span className="text-xs text-slate-700">{a.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
