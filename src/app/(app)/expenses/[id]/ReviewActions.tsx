"use client";

import { useActionState, useState } from "react";
import {
  reviewExpenseAction,
  type ExpenseFormState,
} from "../actions";
import type { ExpenseStatus } from "@prisma/client";

export function ReviewActions({
  id,
  status,
}: {
  id: string;
  status: ExpenseStatus;
}) {
  const [state, formAction, pending] = useActionState<
    ExpenseFormState,
    FormData
  >(reviewExpenseAction, {});
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");

  if (status === "REJECTED") return null;

  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">
        Muhasebe İşlemi
      </h3>

      {status === "SUBMITTED" && (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <div>
            <label htmlFor="note" className="label">
              Not (reddederken zorunlu)
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="Onay/ret ile ilgili açıklama..."
              className="input resize-none"
            />
          </div>
          {state.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {state.error}
            </p>
          )}
          <input type="hidden" name="decision" value={decision} />
          <div className="flex gap-3">
            <button
              type="submit"
              onClick={() => setDecision("APPROVED")}
              disabled={pending}
              className="btn-success flex-1"
            >
              Onayla
            </button>
            <button
              type="submit"
              onClick={() => setDecision("REJECTED")}
              disabled={pending}
              className="btn-danger flex-1"
            >
              Reddet
            </button>
          </div>
        </form>
      )}

      {status === "APPROVED" && (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="REIMBURSED" />
          <p className="text-sm text-slate-600">
            Harcama onaylandı. Ödeme yapıldığında aşağıdaki butonla
            işaretleyebilirsiniz.
          </p>
          {state.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            Ödendi olarak işaretle
          </button>
        </form>
      )}

      {status === "REIMBURSED" && (
        <p className="text-sm text-emerald-700">
          Bu harcama ödendi olarak işaretlendi.
        </p>
      )}
    </div>
  );
}
