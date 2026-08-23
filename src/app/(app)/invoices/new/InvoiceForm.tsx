"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createInvoiceAction,
  type InvoiceFormState,
} from "../actions";

type Dept = { id: string; name: string };
type Approver = { id: string; name: string; departmentName: string | null };

export function InvoiceForm({
  departments,
  approvers,
  today,
}: {
  departments: Dept[];
  approvers: Approver[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState<
    InvoiceFormState,
    FormData
  >(createInvoiceAction, {});
  const [targetType, setTargetType] = useState<"DEPARTMENT" | "USER">(
    "DEPARTMENT",
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Fatura Künyesi</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="vendorName" className="label">
              Tedarikçi / Firma *
            </label>
            <input
              id="vendorName"
              name="vendorName"
              required
              placeholder="Örn: XYZ Limited Şirketi"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="invoiceNumber" className="label">
              Fatura No
            </label>
            <input
              id="invoiceNumber"
              name="invoiceNumber"
              placeholder="Örn: GIB2026000001234"
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="invoiceDate" className="label">
              Fatura Tarihi *
            </label>
            <input
              id="invoiceDate"
              name="invoiceDate"
              type="date"
              required
              max={today}
              defaultValue={today}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="amount" className="label">
              Tutar (KDV dahil) *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="taxAmount" className="label">
              KDV Tutarı
            </label>
            <input
              id="taxAmount"
              name="taxAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
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
          <label htmlFor="description" className="label">
            Açıklama *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={2}
            placeholder="Örn: İş geliştirme departmanı için alınan marketing hizmeti."
            className="input resize-none"
          />
        </div>

        <div>
          <label htmlFor="document" className="label">
            Fatura Görüntüsü (PDF) *
          </label>
          <input
            id="document"
            name="document"
            type="file"
            required
            accept="application/pdf,image/*"
            className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF veya görsel (maks. 10 MB).
          </p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Onaya Yönlendir
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTargetType("DEPARTMENT")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              targetType === "DEPARTMENT"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Departmana
          </button>
          <button
            type="button"
            onClick={() => setTargetType("USER")}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              targetType === "USER"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Kişiye
          </button>
        </div>
        <input type="hidden" name="targetType" value={targetType} />

        {targetType === "DEPARTMENT" ? (
          <div>
            <label htmlFor="targetDepartmentId" className="label">
              Departman *
            </label>
            <select
              id="targetDepartmentId"
              name="targetDepartmentId"
              className="input"
              defaultValue=""
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
            <p className="mt-1 text-xs text-slate-500">
              Departmandaki tüm onaycılar bu faturayı görebilir ve
              onaylayabilir.
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="targetUserId" className="label">
              Kişi *
            </label>
            <select
              id="targetUserId"
              name="targetUserId"
              className="input"
              defaultValue=""
            >
              <option value="" disabled>
                Seçiniz
              </option>
              {approvers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.departmentName ? ` — ${a.departmentName}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Yalnızca seçtiğiniz kişi bu faturayı onaylayabilir.
            </p>
          </div>
        )}
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Gönderiliyor..." : "Onaya Gönder"}
        </button>
        <Link href="/invoices" className="btn-secondary">
          İptal
        </Link>
      </div>
    </form>
  );
}
