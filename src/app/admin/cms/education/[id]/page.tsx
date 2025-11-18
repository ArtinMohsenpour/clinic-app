import EducationForm from "@/components/admin/cms/education/education-form";
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
          { href: "/admin/cms/education", label: "آموزش بیماران" },
          { label: "ویرایش" },
        ]}
      />
      <EducationForm mode="edit" educationId={id} />
    </div>
  );
}
