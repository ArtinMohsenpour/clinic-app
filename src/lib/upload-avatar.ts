import crypto from "crypto";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const AVATAR_ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function mimeExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg"; // default for image/jpeg
}

/** Saves the avatar file for a given user, updates User.image and Profile avatar fields, and writes an audit log. */
export async function saveAvatarForUser(userId: string, file: File) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!AVATAR_ALLOWED.includes(file.type as any)) {
    throw new Error("فرمت تصویر مجاز نیست.");
  }
  if (file.size > AVATAR_MAX_SIZE) {
    throw new Error("حجم فایل نباید بیش از ۲ مگابایت باشد.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = mimeExtension(file.type);
  const key = `${userId}/${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}.${ext}`;

  const storage = getStorage();

  // Remember previous avatar key to optionally delete later
  const prev = await prisma.profile.findUnique({
    where: { userId },
    select: { avatarKey: true },
  });

  const { url, key: savedKey } = await storage.save({
    buffer,
    key,
    contentType: file.type || "application/octet-stream",
  });

  // Persist to User + Profile (thumb URL uses storage public URL for now)
  await prisma.user.update({ where: { id: userId }, data: { image: url } });
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, avatarKey: savedKey, avatarThumbUrl: url },
    update: { avatarKey: savedKey, avatarThumbUrl: url },
  });

  try {
    await prisma.auditLog.create({
      data: {
        action: "PROFILE_AVATAR_UPDATE",
        actorId: userId,
        targetId: userId,
        meta: { key: savedKey, url },
      },
    });
  } catch {}

  // Delete previous file if driver supports it
  if (
    prev?.avatarKey &&
    prev.avatarKey !== savedKey &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (storage as any).remove
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (storage as any).remove(prev.avatarKey);
    } catch {}
  }

  return { url, key: savedKey };
}
