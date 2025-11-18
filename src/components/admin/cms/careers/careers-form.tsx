"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "create" | "edit";
type Props = {
  mode: Mode;
  careerId?: string;
};

type FormData = {
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT";
  requirements: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
};

const defaultData: FormData = {
  title: "",
  description: "",
  department: "",
  location: "",
  employmentType: "FULL_TIME",
  requirements: "",
  status: "DRAFT",
};

// --- Sub-components defined OUTSIDE the main component to prevent re-mounts on input ---

const Label = ({ htmlFor, text }: { htmlFor: string; text: string }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold mb-1">
    {text}
  </label>
);

// Note: We removed the hardcoded `onChange` from here so it spreads correctly from props
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    dir="rtl"
    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
    {...props}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    dir="rtl"
    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary bg-white"
    {...props}
  >
    {props.children}
  </select>
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    dir="rtl"
    rows={props.rows || 5}
    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-navbar-secondary"
    {...props}
  />
);

// ---------------------------------------------------------------------------------------

export default function CareersForm({ mode, careerId }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(defaultData);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && careerId) {
      setLoading(true);
      fetch(`/api/admin/cms/careers/${careerId}`, { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error("آگهی مورد نظر یافت نشد.");
          return res.json();
        })
        .then((data) => {
          setFormData(data);
        })
        .catch((e) =>
          setError(e instanceof Error ? e.message : "خطای دریافت اطلاعات")
        )
        .finally(() => setLoading(false));
    }
  }, [mode, careerId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url =
      mode === "create"
        ? "/api/admin/cms/careers"
        : `/api/admin/cms/careers/${careerId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "خطا در ذخیره‌سازی");
      }

      alert("آگهی با موفقیت ذخیره شد.");
      router.push("/admin/cms/careers");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
      setLoading(false);
    }
  };

  if (mode === "edit" && loading && !formData.title) {
    return (
      <div className="p-6 text-center text-gray-500">
        در حال بارگذاری اطلاعات...
      </div>
    );
  }

  return (
    <form
      dir="rtl"
      onSubmit={handleSubmit}
      className="p-6 pb-12 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-md ring-1 ring-gray-100 space-y-6"
    >
      <h1 className="text-2xl font-extrabold text-navbar-primary">
        {mode === "create" ? "ایجاد آگهی شغلی جدید" : "ویرایش آگهی شغلی"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <Label htmlFor="title" text="عنوان شغل" />
          <Input
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            disabled={loading}
            placeholder="مثلا: پرستار بخش"
            required
          />
        </div>
        <div>
          <Label htmlFor="department" text="دپارتمان" />
          <Input
            name="department"
            id="department"
            value={formData.department}
            onChange={handleChange}
            disabled={loading}
            placeholder="مثلا: داخلی"
          />
        </div>
        <div>
          <Label htmlFor="location" text="موقعیت مکانی" />
          <Input
            name="location"
            id="location"
            value={formData.location}
            onChange={handleChange}
            disabled={loading}
            placeholder="مثلا: شعبه اصلی"
          />
        </div>
        <div>
          <Label htmlFor="employmentType" text="نوع همکاری" />
          <Select
            name="employmentType"
            id="employmentType"
            value={formData.employmentType}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="FULL_TIME">تمام‌وقت</option>
            <option value="PART_TIME">پاره‌وقت</option>
            <option value="CONTRACT">قراردادی</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="status" text="وضعیت آگهی" />
          <Select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="DRAFT">پیش‌نویس (نمایش داده نمی‌شود)</option>
            <option value="OPEN">آگهی‌شده (قابل مشاهده)</option>
            <option value="CLOSED">بسته‌شده (آرشیو)</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description" text="شرح وظایف" />
        <TextArea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleChange}
          disabled={loading}
          placeholder="توضیحات کامل در مورد این موقعیت شغلی..."
          rows={8}
        />
      </div>

      <div>
        <Label htmlFor="requirements" text="نیازمندی‌ها" />
        <TextArea
          name="requirements"
          id="requirements"
          value={formData.requirements}
          onChange={handleChange}
          disabled={loading}
          placeholder="لیست مهارت‌ها و شرایط مورد نیاز..."
          rows={5}
        />
      </div>

      <hr />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-navbar-secondary text-white hover:bg-navbar-hover disabled:opacity-50"
        >
          {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
        <Link
          href="/admin/cms/careers"
          className="px-4 py-2 rounded-xl border hover:bg-gray-50"
        >
          انصراف
        </Link>
        {error && <div className="text-red-600 text-sm mr-auto">{error}</div>}
      </div>
    </form>
  );
}
