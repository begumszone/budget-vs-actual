/* eslint-disable @next/next/no-img-element */

export function FilePreview({
  fileId,
  mimeType,
  filename,
  label = "Belge",
}: {
  fileId: string;
  mimeType: string;
  filename: string;
  label?: string;
}) {
  const url = `/api/files/${fileId}`;
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <div>
      <p className="label">{label}</p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {isImage ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt={filename}
              className="max-h-96 w-full object-contain"
            />
          </a>
        ) : isPdf ? (
          <object data={url} type="application/pdf" className="h-96 w-full">
            <div className="p-4 text-sm text-slate-600">
              PDF önizlemesi görüntülenemedi.{" "}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 underline"
              >
                Yeni sekmede aç
              </a>
            </div>
          </object>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block p-4 text-sm text-brand-700 underline"
          >
            {filename} indir
          </a>
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-xs text-slate-500 hover:text-brand-700"
      >
        {filename} · yeni sekmede aç ↗
      </a>
    </div>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-800">
        {children}
      </dd>
    </div>
  );
}
