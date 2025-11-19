/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  FileText,
  Receipt,
  CreditCard,
  Loader2,
  Banknote,
  History,
  ArrowLeft,
  Lock,
} from "lucide-react";

type AccountingStats = {
  payslips: number;
  pendingBills: number;
  monthlyExpenses: number;
  recentInvoices: any[];
};

const ACCOUNTING_MODULES = [
  {
    key: "payslips",
    title: "مدیریت حقوق و دستمزد",
    description: "بارگذاری فیش‌های حقوقی پرسنل و مدیریت پرداخت‌ها.",
    icon: Banknote,
    href: "/admin/accounting/payslips",
    enabled: true,
  },
  {
    key: "expenses",
    title: "هزینه‌های کلینیک",
    description: "ثبت و مدیریت قبوض آب، برق، اجاره و خرید تجهیزات.",
    icon: Receipt,
    href: "/admin/accounting/expenses",
    enabled: false, // Currently disabled
  },
  {
    key: "invoices",
    title: "صورت‌حساب‌ها و درآمد",
    description: "مدیریت فاکتورهای بیماران و وضعیت پرداخت بیمه.",
    icon: Wallet,
    href: "/admin/accounting/invoices",
    enabled: false, // Currently disabled
  },
  {
    key: "reports",
    title: "گزارشات مالی",
    description: "نمودار سود و زیان و ترازنامه مالی.",
    icon: FileText,
    href: "/admin/accounting/reports",
    enabled: false, // Currently disabled
  },
];

export default function AccountingDashboard() {
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/accounting/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="h-12 w-12 animate-spin text-[#008071]/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 pb-20 font-yekan space-y-6 select-none">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-right">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#135029]">
            امور مالی و حسابداری
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            مدیریت یکپارچه درآمدها، هزینه‌ها و حقوق پرسنل
          </p>
        </div>
        {/* Quick Action (Example) */}
        <div className="hidden md:block">
          {/* You can add global actions here later */}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Modules Grid - Styled like CMS Modules */}
        <section className="xl:col-span-2 rounded-2xl bg-white p-4 md:p-6 shadow-sm shadow-emerald-900/5 border-r-[6px] border-r-[#008071]">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-1.5 rounded-full bg-[#135029]" />
            <h2 className="text-lg font-bold text-[#135029]">ماژول‌ها</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACCOUNTING_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isEnabled = mod.enabled;

              if (!isEnabled) {
                return (
                  <div
                    key={mod.key}
                    className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-5 opacity-75"
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="bg-white/80 px-3 py-1 rounded-full shadow-sm flex items-center gap-2 text-xs font-medium text-gray-500">
                        <Lock className="w-3 h-3" /> به زودی
                      </div>
                    </div>
                    <div className="flex items-start gap-4 grayscale opacity-60">
                      <div className="p-3 rounded-2xl bg-gray-100 text-gray-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-500">{mod.title}</h3>
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={mod.key}
                  href={mod.href}
                  className="group relative block rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#135029] hover:shadow-[#008071]"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-gray-50 text-gray-600 transition-colors group-hover:bg-[#008071]/10 group-hover:text-[#008071]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 group-hover:text-[#135029] transition-colors">
                          {mod.title}
                        </h3>
                        <ArrowLeft className="w-4 h-4 text-[#008071] opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                      </div>
                      <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Side Widget Column */}
        <div className="space-y-6">
          {/* Recent Activity / Transactions - Styled like CMS Activity */}
          <div className="rounded-2xl bg-white p-5 shadow-sm shadow-emerald-900/5 border-r-[6px] border-r-[#008071]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <div className="bg-[#B6EBE5]/30 p-1.5 rounded-lg text-[#008071]">
                <History className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">
                تراکنش‌های اخیر
              </h3>
            </div>

            <div className="py-8 text-center flex flex-col items-center gap-3 text-gray-400">
              <CreditCard className="w-12 h-12 opacity-10" />
              <p className="text-xs">هنوز تراکنشی ثبت نشده است.</p>
              {/* Action Button (Disabled for now as invoices page is locked) */}
              <button
                disabled
                className="mt-2 text-xs text-gray-400 font-bold border border-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50"
              >
                + ثبت فاکتور جدید
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
