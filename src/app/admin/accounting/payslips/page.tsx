"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  User,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Loader2,
  X,
  History as HistoryIcon,
  Calendar,
  ChevronDown,
  PenTool, // Icon for title
} from "lucide-react";

// --- Constants ---
const PERSIAN_MONTHS = [
  { value: 1, label: "فروردین" },
  { value: 2, label: "اردیبهشت" },
  { value: 3, label: "خرداد" },
  { value: 4, label: "تیر" },
  { value: 5, label: "مرداد" },
  { value: 6, label: "شهریور" },
  { value: 7, label: "مهر" },
  { value: 8, label: "آبان" },
  { value: 9, label: "آذر" },
  { value: 10, label: "دی" },
  { value: 11, label: "بهمن" },
  { value: 12, label: "اسفند" },
];

const getCurrentPersianYear = () => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
    });
    return parseInt(formatter.format(new Date()));
  } catch (e) {
    return 1403;
  }
};

const currentYear = getCurrentPersianYear();
const YEARS_LIST = Array.from({ length: 20 }, (_, i) => currentYear - i);

// --- Types ---
type Employee = {
  id: string;
  name: string;
  image: string | null;
  role: string;
  code: string | null;
};

type Payslip = {
  id: string;
  title: string;
  periodMonth: number;
  periodYear: number;
  createdAt: string;
  size: number;
  url: string;
};

export default function PayslipsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Employee[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Form State
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(1);
  const [customTitle, setCustomTitle] = useState(""); // NEW: Title state

  // Search
  const handleSearch = async (term: string) => {
    setQuery(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/accounting/employees?q=${encodeURIComponent(term)}`
      );
      if (res.ok) setResults(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Select Employee
  const selectEmployee = async (emp: Employee) => {
    setSelectedEmp(emp);
    setResults([]);
    setQuery("");
    setLoadingDocs(true);
    try {
      const res = await fetch(
        `/api/admin/accounting/payslips?userId=${emp.id}`
      );
      if (res.ok) setPayslips(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Upload
  const handleUpload = async () => {
    if (!uploadFile || !selectedEmp) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("userId", selectedEmp.id);
    formData.append("month", month.toString());
    formData.append("year", year.toString());
    // Send title if present
    if (customTitle.trim()) formData.append("title", customTitle);

    try {
      const res = await fetch("/api/admin/accounting/payslips", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        setPayslips([newDoc, ...payslips]);
        setUploadFile(null);
        setCustomTitle(""); // Reset title
        alert("فایل با موفقیت ذخیره شد.");
      } else {
        const err = await res.json();
        alert(err.error || "خطا در بارگذاری.");
      }
    } catch (err) {
      alert("خطای سیستم.");
    } finally {
      setUploading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این فایل اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/accounting/payslips?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) setPayslips((prev) => prev.filter((p) => p.id !== id));
      else alert("خطا در حذف.");
    } catch (err) {
      alert("خطا.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 pb-20 font-yekan space-y-8 select-none">
      <header className="flex items-center gap-3 mb-8 ">
        <Link
          href="/admin/accounting"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[#008071] hover:border-[#008071] transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#135029]">
            مدیریت فیش‌های حقوقی
          </h1>
          <p className="text-sm text-gray-500">جستجو، بارگذاری و بایگانی</p>
        </div>
      </header>

      {/* Search */}
      <section className="relative max-w-2xl mx-auto select-none">
        <div className="relative">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#008071]">
            {searching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          <input
            type="text"
            className="w-full h-14 pr-12 pl-6 rounded-2xl border-2 border-transparent bg-white shadow-sm text-lg focus:border-[#008071] focus:ring-0 outline-none transition-all"
            placeholder="جستجوی نام یا شماره تماس ..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {results.length > 0 && (
          <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {results.map((emp) => (
              <button
                key={emp.id}
                onClick={() => selectEmployee(emp)}
                className="w-full flex items-center gap-3 p-4 hover:bg-[#f5f5f7] transition-colors text-right border-b last:border-0 group"
              >
                <div className="w-10 h-10 rounded-full bg-[#135029]/10 flex items-center justify-center text-[#135029] group-hover:bg-[#135029] group-hover:text-white transition-colors">
                  {emp.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={emp.image}
                      alt={emp.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{emp.name}</p>
                  <p className="text-xs text-gray-500">
                    {emp.role} {emp.code && `| کد: ${emp.code}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedEmp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-1 space-y-6">
            {/* Profile */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#008071]/10 to-transparent" />
              <button
                onClick={() => setSelectedEmp(null)}
                className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-md mb-4">
                <div className="w-full h-full rounded-full bg-[#f5f5f7] flex items-center justify-center overflow-hidden">
                  {selectedEmp.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedEmp.image}
                      alt={selectedEmp.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {selectedEmp.name}
              </h2>
              <p className="text-sm text-[#008071] font-medium mt-1">
                {selectedEmp.role}
              </p>
              {selectedEmp.code && (
                <span className="inline-block mt-3 px-3 py-1 bg-gray-50 text-gray-500 text-xs rounded-lg">
                  کد: {selectedEmp.code}
                </span>
              )}
            </div>

            {/* Upload Form */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#135029]/10 rounded-lg text-[#135029]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-800">بارگذاری فایل جدید</h3>
              </div>

              <div className="space-y-5">
                {/* Title Input */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-medium">
                    عنوان فایل (اختیاری)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="مثلاً: پاداش، عیدی، فیش آبان"
                      className="w-full p-2.5 pl-8 rounded-xl border bg-gray-50 outline-none focus:border-[#008071] text-sm"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                    <PenTool className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Date Selector */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50">
                    <Calendar className="w-4 h-4 text-[#008071]" />
                    <span className="text-sm font-bold text-gray-700">
                      دوره مالی
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-xl py-2.5 px-3 pr-8 outline-none focus:border-[#008071]"
                      >
                        {YEARS_LIST.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        سال
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-xl py-2.5 px-3 outline-none focus:border-[#008071]"
                      >
                        {PERSIAN_MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* File Input */}
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  {uploadFile ? (
                    <div className="flex flex-col items-center text-[#008071]">
                      <FileText className="w-10 h-10 mb-2" />
                      <span className="text-sm font-bold truncate max-w-[200px]">
                        {uploadFile.name}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {formatSize(uploadFile.size)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-[#008071]">
                      <UploadCloud className="w-10 h-10 mb-2" />
                      <span className="text-sm font-medium">
                        انتخاب فایل (PDF/تصویر)
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="w-full py-3 bg-[#008071] hover:bg-[#135029] text-white rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "ثبت و بارگذاری"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          {/* Right Column: History List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <HistoryIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800">سوابق پرداختی‌ها</h3>
                </div>
                <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-500 font-medium">
                  {payslips.length} رکورد یافت شد
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {loadingDocs ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-[#008071]/50" />
                    <p className="text-sm">در حال دریافت سوابق...</p>
                  </div>
                ) : payslips.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
                    <div className="bg-gray-50 p-6 rounded-full">
                      <FileText className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      هیچ فیش حقوقی برای این پرسنل ثبت نشده است.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-right">
                    <thead className="bg-[#f5f5f7] text-gray-500 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 font-medium rounded-r-xl">عنوان</th>
                        <th className="p-4 font-medium">دوره</th>
                        <th className="p-4 font-medium">تاریخ بارگذاری</th>
                        <th className="p-4 font-medium">حجم</th>
                        <th className="p-4 text-center rounded-l-xl">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payslips.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className=" font-medium text-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              {doc.title}
                            </div>
                          </td>
                          <td className=" text-gray-600">
                            <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                              {doc.periodYear} /{" "}
                              {PERSIAN_MONTHS.find(
                                (m) => m.value === doc.periodMonth
                              )?.label || doc.periodMonth}
                            </span>
                          </td>
                          <td className="p-4 justify-center text-gray-500 dir-ltr text-start  font-yekan text-xs">
                            {new Date(doc.createdAt).toLocaleDateString(
                              "fa-IR"
                            )}
                          </td>
                          <td className="p-4 text-gray-400 dir-ltr text-start text-xs font-mono">
                            {formatSize(doc.size)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              <a
                                href={doc.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-[#008071] bg-[#008071]/5 hover:bg-[#008071] hover:text-white rounded-lg transition-colors"
                                title="دانلود فایل"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                title="حذف فایل"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
