import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../_auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Schema for validating the creation of a new page
const CreatePageSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with dashes"),
  body: z.any().optional(), // Assuming body is a JSON object from a rich text editor
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  contactItems: z
    .array(
      z.object({
        type: z.enum(["PHONE", "EMAIL", "ADDRESS"]),
        label: z.string().min(1, "Label is required"),
        value: z.string().min(1, "Value is required"),
        url: z.string().optional().nullable(),
      })
    )
    .optional(),
});

// GET /api/admin/cms/pages -> list all static pages
export async function GET(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const pages = await prisma.staticPage.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ items: pages });
}

// POST /api/admin/cms/pages -> create a new static page
export async function POST(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const json = await req.json();
  const parsed = CreatePageSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, slug, body, status, contactItems } = parsed.data;

  // Check for duplicate slug
  const existing = await prisma.staticPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
  }

  const newPage = await prisma.staticPage.create({
    data: {
      title,
      slug,
      body: body || Prisma.JsonNull,
      status,
      authorId: gate.session.user.id,
      updatedById: gate.session.user.id,
      contactItems: contactItems
        ? {
            create: contactItems.map((item, index) => ({
              ...item,
              order: index,
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json(newPage, { status: 201 });
}
