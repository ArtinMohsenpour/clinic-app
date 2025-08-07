// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center select-none px-4">
      <h1 className="text-4xl font-bold mb-4">صفحه پیدا نشد</h1>
      <p className="text-gray-600 mb-6">
        متاسفیم، صفحه‌ای که به دنبال آن بودید یافت نشد.
      </p>
      <Link
        href="/admin"
        className="px-4 py-2 bg-navbar-secondary text-white rounded hover:bg-navbar-primary transition"
      >
        بازگشت به صفحه ادمین
      </Link>
    </div>
  );
}
