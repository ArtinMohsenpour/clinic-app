import Image from "next/image";
import { getStaffPageData } from "@/lib/data/staff";
import { Briefcase, Building2, Mail, Phone, ChevronDown, User, Stethoscope } from "lucide-react";

export const metadata = {
    title: "پرسنل و پزشکان کلینیک | تیم ما",
    description:
        "آشنایی با تیم حرفه‌ای کلینیک: پزشکان، پرستاران و کارکنان واحدهای مختلف همراه با تصویر و عنوان شغلی.",
};

export default async function StaffPage() {
    const staff = await getStaffPageData();

    return (
        <div className="bg-background-2 min-h-screen" dir="rtl">
            {/* Hero */}
            <div className="relative isolate overflow-hidden px-6 py-16 lg:px-8 bg-white border-b border-gray-100">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-40" />
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight bg-gradient-to-l from-cms-primary to-indigo-600 bg-clip-text text-transparent sm:text-6xl font-yekan">
                        تیم متخصص ما
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600 font-yekan">
                        با پزشکان و کادر درمان متعهد ما که آماده ارائه بهترین خدمات به شما هستند، آشنا شوید.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-6 md:px-10 py-16">
                {(!staff || staff.length === 0) && (
                    <div className="mx-auto max-w-md text-center bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-yekan text-lg">در حال حاضر اطلاعات پرسنل ثبت نشده است.</p>
                    </div>
                )}

                {staff && staff.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {staff.map((u) => {
                            const primary = u.branches?.[0];
                            const avatar = u.profile?.avatarThumbUrl || u.image || null;

                            const title = primary?.positionTitle || "کارمند کلینیک";
                            const dept = primary?.department?.name || null;
                            const branch = primary?.branch?.name || null;
                            const specialty = u.specialty?.name || null;

                            // Determine role display: Specialty > User Role > Position Title
                            // We grab the first assigned role if available. Using 'name' as displayName doesn't exist.
                            const userRole = u.roles?.[0]?.role?.name || null;

                            const initials = u.name
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((s) => s[0])
                                .join(" ")
                                .toUpperCase();

                            return (
                                <div
                                    key={u.id}
                                    className="group relative bg-white rounded-3xl ring-1 ring-gray-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden"
                                >
                                    {/* Image Container - No Overlay */}
                                    <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                                        {avatar ? (
                                            <Image
                                                src={avatar}
                                                alt={u.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                className="object-cover object-top transition-all duration-700 ease-out  group-hover:grayscale group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-300 grayscale group-hover:grayscale-0 transition-all duration-700">
                                                <User className="w-24 h-24 opacity-50" />
                                                <span className="sr-only">{initials}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex flex-col flex-grow">

                                        {/* Role & Specialty Tags */}
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {specialty ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium font-yekan">
                            <Stethoscope className="w-3 h-3" />
                                                    {specialty}
                          </span>
                                            ) : userRole ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium font-yekan">
                            <Briefcase className="w-3 h-3" />
                                                    {userRole}
                          </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-700 text-xs font-medium font-yekan">
                            <Briefcase className="w-3 h-3" />
                                                    {title}
                          </span>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 font-yekan mb-1 truncate">
                                            {u.name}
                                        </h3>

                                        {/* Location Info */}
                                        {(dept || branch) && (
                                            <div className="text-sm text-gray-500 font-yekan flex items-center gap-1.5 mb-4">
                                                <Building2 className="w-3.5 h-3.5 text-cms-secondary" />
                                                <span className="truncate">
                           {dept && `${dept}`}
                                                    {dept && branch && " - "}
                                                    {branch && `${branch}`}
                        </span>
                                            </div>
                                        )}

                                        {/* Spacer to push dropdown to bottom */}
                                        <div className="flex-grow" />

                                        {/* Contact Dropdown using Native HTML Details */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <details className="group/dropdown relative">
                                                <summary className="list-none flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors">
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            اطلاعات تماس
                          </span>
                                                    <ChevronDown className="w-4 h-4 transition-transform group-open/dropdown:rotate-180" />
                                                </summary>

                                                {/* Dropdown Content */}
                                                <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/5 z-10 animate-in fade-in zoom-in-95 duration-200 origin-bottom">
                                                    <div className="space-y-3">
                                                        {u.phone ? (
                                                            <div className="flex items-center gap-3 text-sm text-gray-600 group/item hover:text-indigo-600 transition-colors">
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                    <Phone className="w-4 h-4" />
                                                                </div>
                                                                <span dir="ltr" className="font-mono">{u.phone}</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic text-center">شماره تماس ثبت نشده</p>
                                                        )}

                                                        {u.email && (
                                                            <div className="flex items-center gap-3 text-sm text-gray-600 group/item hover:text-indigo-600 transition-colors">
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                    <Mail className="w-4 h-4" />
                                                                </div>
                                                                <span className="truncate text-xs font-sans">{u.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}