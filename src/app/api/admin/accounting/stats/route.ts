import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate "This Month" date range
    const now = new Date();
    // Persian calendar adjustments can be complex, but for standard Gregorian month logic:
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch data in parallel
    const [payslipsCount, expensesStats, invoicesStats] = await Promise.all([
      // 1. Payslips (Existing Model)
      prisma.document.count({
        where: {
          type: "PAYSLIP",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // 2. Expenses (Placeholder until model exists)
      // Once you add the 'Expense' model:
      // prisma.expense.aggregate({
      //   _sum: { amount: true },
      //   _count: { _all: true }, // for pending bills
      //   where: { date: { gte: startOfMonth, lte: endOfMonth } }
      // })
      Promise.resolve({
        _sum: { amount: 0 },
        pendingCount: 0,
      }),

      // 3. Invoices (Placeholder until model exists)
      // Once you add the 'Invoice' model:
      // prisma.invoice.findMany({
      //   take: 5,
      //   orderBy: { createdAt: 'desc' },
      //   select: { id: true, totalAmount: true, status: true }
      // })
      Promise.resolve([]),
    ]);

    // Construct the response matching the frontend type:
    // type AccountingStats = { payslips, pendingBills, monthlyExpenses, recentInvoices }
    const responseData = {
      payslips: payslipsCount,
      // Defaulting to 0 for now
      pendingBills: 0, // expensesStats.pendingCount (if using real model)
      monthlyExpenses: 0, // Number(expensesStats._sum.amount) || 0
      recentInvoices: [], // invoicesStats
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Accounting Stats API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
