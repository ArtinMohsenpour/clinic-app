/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set<string>([
  // docs
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // images
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 24 * 1024 * 1024; // 24MB

function extFromMime(mime: string, filename?: string | null) {
  // Prefer clean mapping
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "application/msword":
      return "doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
  // Fallback: take from filename if present
  if (filename) {
    const ext = path.extname(filename).replace(/^\./, "").toLowerCase();
    if (ext) return ext;
  }
  // Last resort
  return "bin";
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session?.user?.id ?? null;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  // Build storage key like: media/2025/08/abc12345.docx
  const now = new Date();
  const yy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const rand = crypto.randomBytes(10).toString("hex");
  const ext = extFromMime(mime, (file as any).name);
  const key = `media/${yy}/${mm}/${rand}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const storage = getStorage();
  const saved = await storage.save({
    buffer,
    key,
    contentType: mime,
  });

  // For images, width/height are optional – store nulls unless you add a probe step
  const asset = await prisma.mediaAsset.create({
    data: {
      fileKey: saved.key,
      publicUrl: saved.url,
      alt: (file as any).name || null,
      mimeType: mime,
      size: file.size,
      width: null,
      height: null,
      uploadedById: userId,
    },
    select: { id: true, publicUrl: true, mimeType: true, size: true },
  });

  // Audit (best-effort)
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId ?? undefined,
        action: "CMS_MEDIA_UPLOAD",
        targetId: asset.id,
        meta: { mime: asset.mimeType, size: asset.size, url: asset.publicUrl },
      },
    });
  } catch {}

  return NextResponse.json({ id: asset.id, url: asset.publicUrl });
}
