"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createExpenseAction,
  type ExpenseFormState,
} from "../actions";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/format";

type Dept = { id: string; name: string };

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [
  keyof typeof EXPENSE_CATEGORY_LABELS,
  string,
][];

export function ExpenseForm({
  departments,
  defaultDepartmentId,
  today,
}: {
  departments: Dept[];
  defaultDepartmentId?: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState<
    ExpenseFormState,
    FormData
  >(createExpenseAction, {});

  return (
    <form action={formAction} className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="departmentId" className="label">
              Departman *
            </label>
            <select
              id="departmentId"
              name="departmentId"
              required
              defaultValue={defaultDepartmentId ?? ""}
              className="input"
            >
              <option value="" disabled>
                Seçiniz
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="label">
              Harcama Türü *
            </label>
            <select id="category" name="category" required className="input" defaultValue="TAXI">
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="expenseDate" className="label">
              Harcama Tarihi *
            </label>
            <input
              id="expenseDate"
              name="expenseDate"
              type="date"
              required
              max={today}
              defaultValue={today}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="amount" className="label">
              Tutar *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="700.00"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="currency" className="label">
              Para Birimi
            </label>
            <select id="currency" name="currency" className="input" defaultValue="TRY">
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="purpose" className="label">
            Harcama Ne İçin Yapıldı? *
          </label>
          <textarea
            id="purpose"
            name="purpose"
            required
            rows={3}
            placeholder="Örn: ABC Ltd. müşteri ziyaretine giderken taksi kullandım."
            className="input resize-none"
          />
        </div>

        <div>
          <label htmlFor="merchant" className="label">
            Satıcı / Firma (opsiyonel)
          </label>
          <input
            id="merchant"
            name="merchant"
            type="text"
            placeholder="Örn: BiTaksi"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="receipt" className="label">
            Fiş / Belge Fotoğrafı *
          </label>
          <input
            id="receipt"
            name="receipt"
            type="file"
            required
            accept="image/*,application/pdf"
            capture="environment"
            className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
          />
          <p className="mt-1 text-xs text-slate-500">
            Telefondan fotoğraf çekebilir veya PDF yükleyebilirsiniz (maks. 10 MB).
          </p>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Gönderiliyor..." : "Muhasebeye Gönder"}
        </button>
        <Link href="/expenses" className="btn-secondary">
          İptal
        </Link>
      </div>
    </form>
  );
}
