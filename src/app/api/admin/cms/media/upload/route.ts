import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { requireCmsAccess } from "../../_auth";

export const runtime = "nodejs";

// ---- Config
const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const PUBLIC_DIR = "uploads/media"; // served as /uploads/media/...

export async function POST(req: NextRequest) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const form = await req.formData();
  const file = form.get("file");
  const alt = ((form.get("alt") as string) || "").trim() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  // @ts-expect-error mime literal
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  // --- Save to /public/uploads/media
  const id = randomUUID();
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
      ? "webp"
      : "jpg";
  const filename = `${id}.${ext}`;

  // For file system: absolute path; for DB/URL: forward-slash relative
  const relKey = `${PUBLIC_DIR}/${filename}`; // "uploads/media/<id>.jpg"
  const absPath = path.join(process.cwd(), "public", PUBLIC_DIR, filename); // .../public/uploads/media/<id>.jpg

  await mkdir(path.dirname(absPath), { recursive: true });
  await writeFile(absPath, Buffer.from(await file.arrayBuffer()));

  const asset = await prisma.mediaAsset.create({
    data: {
      id,
      fileKey: relKey,
      publicUrl: `/${relKey}`, // served statically
      alt,
      mimeType: file.type,
      size: file.size,
      uploadedById: session.user.id,
    },
    select: { id: true, publicUrl: true, alt: true },
  });

  // Match the front-end expectation: { id, url, alt }
  return NextResponse.json(
    { id: asset.id, url: asset.publicUrl, alt: asset.alt },
    { status: 201 }
  );
}
