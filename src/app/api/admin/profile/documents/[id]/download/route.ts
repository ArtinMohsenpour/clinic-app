import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth.api.getSession({ headers: (req as any).headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { title: true, fileKey: true, mimeType: true },
  });
  if (!doc) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const fullPath = path.join(process.cwd(), "public", "uploads", doc.fileKey);

  try {
    const buf = await fs.readFile(fullPath); // Node Buffer

    // ✅ Create a fresh ArrayBuffer (not SharedArrayBuffer) and copy data
    const ab = new ArrayBuffer(buf.byteLength);
    new Uint8Array(ab).set(buf);

    return new Response(ab, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": String(buf.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          doc.title
        )}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
