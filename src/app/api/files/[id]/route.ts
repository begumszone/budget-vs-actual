import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Yüklenen dosyaları (fiş fotoğrafı / fatura PDF'i) yalnızca oturum açmış
// kullanıcılara sunar.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.fileAsset.findUnique({ where: { id } });
  if (!file) {
    return new NextResponse("Dosya bulunamadı", { status: 404 });
  }

  const body = new Uint8Array(file.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
