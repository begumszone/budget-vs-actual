import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="text-lg font-semibold text-slate-800">
        Sayfa bulunamadı
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Aradığınız kayıt bulunamadı ya da bu içeriği görüntüleme yetkiniz yok.
      </p>
      <Link href="/dashboard" className="btn-primary">
        Panele dön
      </Link>
    </div>
  );
}
