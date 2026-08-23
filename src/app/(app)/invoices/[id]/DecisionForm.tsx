"use client";

import { useActionState, useState } from "react";
import {
  decideInvoiceAction,
  type InvoiceFormState,
} from "../actions";

type Defaults = {
  costCenter: string | null;
  glAccount: string | null;
  budgetLine: string | null;
  projectCode: string | null;
  isBudgeted: boolean | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  approverNote: string | null;
};

export function DecisionForm({
  id,
  defaults,
}: {
  id: string;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState<
    InvoiceFormState,
    FormData
  >(decideInvoiceAction, {});
  const [decision, setDecision] = useState<
    "APPROVED" | "REJECTED" | "INFO_REQUESTED"
  >("APPROVED");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800 ring-1 ring-brand-100">
        Bu fatura hakkında aşağıdaki muhasebe/kayıt verilerini doldurun. Onay
        için Masraf Merkezi ve GL Hesabı zorunludur.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="costCenter" className="label">
            Masraf Merkezi *
          </label>
          <input
            id="costCenter"
            name="costCenter"
            defaultValue={defaults.costCenter ?? ""}
            placeholder="Örn: ISG-100"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="glAccount" className="label">
            Muhasebe (GL) Hesabı *
          </label>
          <input
            id="glAccount"
            name="glAccount"
            defaultValue={defaults.glAccount ?? ""}
            placeholder="Örn: 760.01"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="budgetLine" className="label">
            Bütçe Kalemi
          </label>
          <input
            id="budgetLine"
            name="budgetLine"
            defaultValue={defaults.budgetLine ?? ""}
            placeholder="Örn: Pazarlama Giderleri"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="projectCode" className="label">
            Proje / Kampanya Kodu
          </label>
          <input
            id="projectCode"
            name="projectCode"
            defaultValue={defaults.projectCode ?? ""}
            placeholder="Örn: Q3-LANSMAN"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="serviceStartDate" className="label">
            Hizmet Başlangıcı
          </label>
          <input
            id="serviceStartDate"
            name="serviceStartDate"
            type="date"
            defaultValue={defaults.serviceStartDate ?? ""}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="serviceEndDate" className="label">
            Hizmet Bitişi
          </label>
          <input
            id="serviceEndDate"
            name="serviceEndDate"
            type="date"
            defaultValue={defaults.serviceEndDate ?? ""}
            className="input"
          />
        </div>
      </div>

      <div>
        <span className="label">Bütçede var mıydı?</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="isBudgeted"
              value="yes"
              defaultChecked={defaults.isBudgeted === true}
            />
            Evet
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="isBudgeted"
              value="no"
              defaultChecked={defaults.isBudgeted === false}
            />
            Hayır
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="approverNote" className="label">
          Not{" "}
          <span className="font-normal text-slate-400">
            (ret / bilgi talebinde zorunlu)
          </span>
        </label>
        <textarea
          id="approverNote"
          name="approverNote"
          rows={2}
          defaultValue={defaults.approverNote ?? ""}
          placeholder="Karar veya talebinizle ilgili açıklama..."
          className="input resize-none"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      )}

      <input type="hidden" name="decision" value={decision} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="submit"
          disabled={pending}
          onClick={() => setDecision("APPROVED")}
          className="btn-success"
        >
          Onayla
        </button>
        <button
          type="submit"
          disabled={pending}
          onClick={() => setDecision("INFO_REQUESTED")}
          className="btn-secondary"
        >
          Bilgi İste
        </button>
        <button
          type="submit"
          disabled={pending}
          onClick={() => setDecision("REJECTED")}
          className="btn-danger"
        >
          Reddet
        </button>
      </div>
    </form>
  );
}
