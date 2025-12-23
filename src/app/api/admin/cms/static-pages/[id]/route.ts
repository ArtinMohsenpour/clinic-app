import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../../_auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type IdParam = { id: string };

// Schema for validating updates to a page and its contact items
const UpdatePageSchema = z.object({
  title: z.string().min(2, "Title is required").optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  body: z.string().nullable().optional(), // From a rich text editor
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  contactItems: z
    .array(
      z.object({
        id: z.string().optional(), // Existing items will have an ID
        type: z.enum(["PHONE", "EMAIL", "ADDRESS"]),
        label: z.string().min(1, "Label is required"),
        value: z.string().min(1, "Value is required"),
        url: z.string().url("Must be a valid URL").optional().nullable(),
      })
    )
    .optional(),
});

// GET /api/admin/cms/pages/[id] -> get a single page with its details
export async function GET(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;

  const page = await prisma.staticPage.findUnique({
    where: { id },
    include: {
      contactItems: {
        orderBy: { order: "asc" }, // Ensure items are sent in the correct order
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}

// PATCH /api/admin/cms/pages/[id] -> update a page and its contact items
export async function PATCH(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;

  const json = await req.json();
  const parsed = UpdatePageSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, slug, body, status, contactItems } = parsed.data;

  try {
    // Use a transaction to ensure all updates succeed or none do.
    await prisma.$transaction(async (tx) => {
      // 1. Update the main StaticPage data
      await tx.staticPage.update({
        where: { id },
        data: {
          title,
          slug,
          body: body === undefined ? undefined : body || Prisma.JsonNull,
          status,
          updatedById: gate.session.user.id,
        },
      });

      // 2. If contactItems were included in the request, sync them.
      if (contactItems) {
        // Find which items to delete: those in the DB but not in the incoming array
        const incomingIds = new Set(
          contactItems.map((item) => item.id).filter(Boolean)
        );
        await tx.contactItem.deleteMany({
          where: {
            pageId: id,
            id: { notIn: Array.from(incomingIds) as string[] },
          },
        });

        // 3. Update existing items and create new ones (upsert)
        for (let i = 0; i < contactItems.length; i++) {
          const item = contactItems[i];
          await tx.contactItem.upsert({
            where: { id: item.id || "" }, // A non-existent ID ensures this becomes a create operation
            create: {
              pageId: id,
              type: item.type,
              label: item.label,
              value: item.value,
              url: item.url,
              order: i, // Set the order based on the array index
            },
            update: {
              type: item.type,
              label: item.label,
              value: item.value,
              url: item.url,
              order: i, // Update the order
            },
          });
        }
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A page with this slug already exists." },
        { status: 409 }
      );
    }
    // Generic error for other failures
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
  revalidateTag("static-pages");
  revalidateTag("home-static-pages");

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/cms/pages/[id] -> delete a page (and its items via cascading delete)
export async function DELETE(req: Request, ctx: { params: Promise<IdParam> }) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;

  try {
    // Because of the `onDelete: Cascade` in the schema, deleting the page
    // will automatically delete all of its associated ContactItem records.
    await prisma.staticPage.delete({ where: { id } });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // This will likely fail if the page ID is not found.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidateTag("static-pages");
  revalidateTag("home-static-pages");

  return NextResponse.json({ ok: true });
}
