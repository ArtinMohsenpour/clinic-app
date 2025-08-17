import { NextRequest, NextResponse } from "next/server";
import { saveAvatarForUser, AVATAR_ALLOWED, AVATAR_MAX_SIZE } from "@/lib/upload-avatar";
// import { requireAdmin } from "@/lib/rbac"; // (if you have it)

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // await requireAdmin(req); // ensure only admins can hit this route
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "فایل ارسال نشده است." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!AVATAR_ALLOWED.includes(file.type as any)) return NextResponse.json({ error: "فرمت تصویر مجاز نیست." }, { status: 400 });
  if (file.size > AVATAR_MAX_SIZE) return NextResponse.json({ error: "حجم فایل نباید بیش از ۲ مگابایت باشد." }, { status: 400 });

  try {
    const { url } = await saveAvatarForUser(params.id, file);
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطا در آپلود تصویر";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}