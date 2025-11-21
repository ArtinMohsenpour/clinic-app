import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET: Fetch payslips
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docs = await prisma.document.findMany({
      where: { userId: userId, type: "PAYSLIP" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        periodMonth: true,
        periodYear: true,
        createdAt: true,
        size: true,
        mimeType: true,
        fileKey: true,
      },
    });

    const storage = getStorage();
    const mappedDocs = docs.map((doc) => ({
      ...doc,
      url: storage.publicUrl(doc.fileKey),
    }));

    return NextResponse.json(mappedDocs);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: Upload
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);
    // NEW: Get custom title or use default
    const customTitle = formData.get("title") as string;

    if (!file || !userId || !month || !year) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Fetch User to get Name & Code for Folder
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, employeeCode: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Create Readable Folder Name
    // Example: "Ali_Rezaei_1023" (or use short ID if no employee code)
    const safeName = user.name.replace(/\s+/g, "_");
    const safeId = user.employeeCode || userId.slice(0, 8); // Use first 8 chars if no code
    const userFolder = `${safeName}_${safeId}`;

    // 3. Prepare File
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    // Key: accounting/payslip/Ali_Rezaei_1023/170234123_payslip.pdf
    const key = `accounting/payslip/${userFolder}/${Date.now()}_${filename}`;

    // 4. Save to Disk
    const storage = getStorage();
    const result = await storage.save({
      buffer,
      key,
      contentType: file.type,
    });

    // 5. Save to DB
    const docTitle =
      customTitle && customTitle.trim() !== ""
        ? customTitle
        : `فیش حقوقی ${month}/${year}`;

    const doc = await prisma.document.create({
      data: {
        userId,
        type: "PAYSLIP",
        title: docTitle, // Use the custom title
        periodMonth: month,
        periodYear: year,
        mimeType: file.type,
        size: file.size,
        fileKey: key,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({ ...doc, url: result.url }, { status: 201 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");
    if (!docId)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    const doc = await prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storage = getStorage();
    if (storage.remove) await storage.remove(doc.fileKey);

    await prisma.document.delete({ where: { id: docId } });

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
