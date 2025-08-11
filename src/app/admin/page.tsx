import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  CalendarDays,
  Pill,
  MessageSquare,
  Activity,
} from "lucide-react";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  if (!session?.user) redirect("/login");

  // --- Dummy data ---
  const stats = {
    employees: 42,
    todaysAppointments: 18,
    lowStockMeds: 5,
    unreadMessages: 12,
  };

  const lowStockList = [
    { name: "هپارین ۵۰۰۰", stock: 12, unit: "ویال" },
    { name: "اریترپوئیتین ۴۰۰۰", stock: 7, unit: "ویال" },
    { name: "سفالکسین ۵۰۰", stock: 9, unit: "بسته" },
  ];

  const upcomingToday = [
    { time: "08:30", patient: "رضا کریمی", doctor: "دکتر احمدی", room: "۳" },
    { time: "10:00", patient: "سارا امیری", doctor: "دکتر موسوی", room: "۲" },
    { time: "11:15", patient: "امیر رضایی", doctor: "دکتر صادقی", room: "۱" },
  ];

  return (
    <div className="p-6 w-full space-y-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">
          خوش آمدید، {session.user.name ?? "کاربر"}
        </h1>
        <p className="text-gray-600 mt-1">مرور کلی امروز</p>
      </header>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="پرسنل"
          value={stats.employees}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="نوبت‌های امروز"
          value={stats.todaysAppointments}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <StatCard
          title="داروهای کم‌موجودی"
          value={stats.lowStockMeds}
          icon={<Pill className="w-5 h-5" />}
        />
        <StatCard
          title="پیام‌های خوانده‌نشده"
          value={stats.unreadMessages}
          icon={<MessageSquare className="w-5 h-5" />}
        />
      </section>

      {/* Placeholder Analytics Card */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">روند نوبت‌ها (هفتگی)</h2>
            <Activity className="text-gray-400 w-5 h-5" />
          </div>
          <div className="bg-gray-50 h-48 rounded flex items-center justify-center text-gray-400 text-sm">
            [نمودار اینجا نمایش داده می‌شود]
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">داروهای کم‌موجودی</h2>
          <ul className="space-y-2">
            {lowStockList.map((m, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{m.name}</span>
                <span className="text-gray-500">
                  {m.stock} {m.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Appointments Table */}
      <section className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3">نزدیک‌ترین نوبت‌های امروز</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2">ساعت</th>
                <th className="py-2">بیمار</th>
                <th className="py-2">پزشک</th>
                <th className="py-2">اتاق</th>
              </tr>
            </thead>
            <tbody>
              {upcomingToday.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{row.time}</td>
                  <td className="py-2">{row.patient}</td>
                  <td className="py-2">{row.doctor}</td>
                  <td className="py-2">{row.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
      <div className="rounded-lg bg-gray-100 p-2">{icon}</div>
      <div>
        <div className="text-gray-500 text-xs">{title}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
