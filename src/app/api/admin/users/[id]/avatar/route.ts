import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// App Router route handlers must run in Node.js for Buffer/fs
export const runtime = "nodejs";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file)
      return NextResponse.json(
        { error: "فایل ارسال نشده است." },
        { status: 400 }
      );

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "فرمت تصویر مجاز نیست." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیش از ۲ مگابایت باشد." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = mimeExtension(file.type); // jpg|png|webp
    const key = `${params.id}/${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.${ext}`;

    const storage = getStorage();
    const { url } = await storage.save({ buffer, key, contentType: file.type });

    // OPTIONAL: persist on user now (you can also do it client-side after success)
    await prisma.user.update({
      where: { id: params.id },
      data: { image: url },
    });

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "خطا در آپلود تصویر" },
      { status: 500 }
    );
  }
}

function mimeExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg"; // default for image/jpeg
}
