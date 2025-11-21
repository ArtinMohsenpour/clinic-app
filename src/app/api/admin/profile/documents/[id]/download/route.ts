import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

// Force Node.js runtime for filesystem access
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Change type to Promise
) {
  try {
    // 2. Await params before using properties (Fixes the crash)
    const { id } = await params;

    // 3. Authenticate
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Find Document
    const doc = await prisma.document.findUnique({
      where: { id }, // use the awaited id
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // 5. Ownership Check
    if (doc.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Locate File on Disk
    const filePath = path.join(process.cwd(), "public", "uploads", doc.fileKey);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "File missing from server storage" },
        { status: 404 }
      );
    }

    // 7. Read File
    const fileBuffer = await fs.readFile(filePath);

    // 8. Smart Filename: Ensure it has an extension
    // If the user titled it "Payslip Aban" but the file is .pdf, we want "Payslip Aban.pdf"
    const ext = path.extname(doc.fileKey); // e.g. ".pdf"
    let downloadFilename = doc.title || "download";
    if (!downloadFilename.endsWith(ext)) {
      downloadFilename += ext;
    }

    // 9. Return Response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          downloadFilename
        )}`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}