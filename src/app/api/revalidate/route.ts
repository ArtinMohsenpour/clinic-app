import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const tag = new URL(request.url).searchParams.get("tag");

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  }

  return NextResponse.json({
    revalidated: false,
    now: Date.now(),
    message: "Missing tag param",
  });
}
