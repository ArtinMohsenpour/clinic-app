import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  saveAvatarForUser,
  AVATAR_ALLOWED,
  AVATAR_MAX_SIZE,
} from "@/lib/upload-avatar";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "فایل ارسال نشده است." },
      { status: 400 }
    );

  // Optional early checks (the helper checks again)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!AVATAR_ALLOWED.includes(file.type as any))
    return NextResponse.json(
      { error: "فرمت تصویر مجاز نیست." },
      { status: 400 }
    );
  if (file.size > AVATAR_MAX_SIZE)
    return NextResponse.json(
      { error: "حجم فایل نباید بیش از ۲ مگابایت باشد." },
      { status: 400 }
    );

  try {
    const { url } = await saveAvatarForUser(session.user.id, file);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطا در آپلود تصویر";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
