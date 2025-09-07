import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../../_auth";
import { z } from "zod";

const ReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

// POST /api/admin/cms/hero/reorder -> update order of all slides
export async function POST(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const json = await req.json();
  const parsed = ReorderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { orderedIds } = parsed.data;

  try {
    // Perform all updates within a single transaction
    const updates = orderedIds.map((id, index) =>
      prisma.heroSlide.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    // Create an audit log for the reorder action
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CMS_HERO_REORDER",
        targetId: "hero_slides", // A general target ID for the collection
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Hero slide reorder error:", err);
    return NextResponse.json(
      { error: "Failed to reorder slides" },
      { status: 500 }
    );
  }
}
