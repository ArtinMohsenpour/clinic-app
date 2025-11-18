import CareersForm from "@/components/admin/cms/careers/careers-form";
import CmsBreadCrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";

// optional but recommended to avoid static generation attempts
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <-- await the params

  return (
    <div className="space-y-4">
      <CmsBreadCrumbs
        items={[
          { href: "/admin/cms", label: "CMS" },
          { href: "/admin/cms/careers", label: "فرصت‌های شغلی" },
          { label: "ویرایش آگهی" },
        ]}
      />
      <CareersForm mode="edit" careerId={id} />
    </div>
  );
}