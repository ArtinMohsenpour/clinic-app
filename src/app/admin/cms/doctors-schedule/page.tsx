import CmsBreadcrumbs from "@/components/admin/cms/ui/cms-bread-crumbs";
// We will create this component in the next step.
// It will contain the logic for selecting a branch and managing its schedule.
import ScheduleManager from "@/components/admin/cms/doctors-schedule/schedule-manager";

export default function Page() {
  return (
    <div className="space-y-4" dir="rtl">
      <CmsBreadcrumbs
        items={[
          { label: "CMS", href: "/admin/cms" },
          { label: "برنامه حضور پزشکان" },
        ]}
        backHref="/admin/cms"
      />
      <ScheduleManager />
    </div>
  );
}