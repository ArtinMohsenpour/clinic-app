import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
import FormFileForm from "@/components/admin/cms/forms/form-file-form";

export default function Page() {
  return (
    <div className="space-y-4">
      <CmsBreadcrumbs items={[{ href: "/admin/cms", label: "CMS" }, { href: "/admin/cms/forms", label: "فرم‌ها و فایل‌ها" }, { label: "ایجاد" }]} />
      <FormFileForm mode="create" />
    </div>
  );
}