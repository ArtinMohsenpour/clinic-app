/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import {
  saveAvatarForUser,
  AVATAR_ALLOWED,
  AVATAR_MAX_SIZE,
} from "@/lib/upload-avatar";

export const runtime = "nodejs";

// در Next.js 15 پارامتر params به صورت Promise تعریف می‌شود
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // استخراج id با استفاده از await
  const { id } = await params;

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "فایل ارسال نشده است." },
      { status: 400 }
    );
  }

  // بررسی فرمت و حجم فایل
  if (!AVATAR_ALLOWED.includes(file.type as any)) {
    return NextResponse.json(
      { error: "فرمت تصویر مجاز نیست." },
      { status: 400 }
    );
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return NextResponse.json(
      { error: "حجم فایل نباید بیش از ۲ مگابایت باشد." },
      { status: 400 }
    );
  }

  try {
    // استفاده از id استخراج شده برای ذخیره آواتار
    const { url } = await saveAvatarForUser(id, file);
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطا در آپلود تصویر";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
