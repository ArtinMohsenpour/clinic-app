import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServicesPageData } from "@/lib/data/services";

export const metadata = {
  title: "خدمات ما | کلینیک تخصصی",
  description:
    "فهرست کامل خدمات تخصصی کلینیک؛ با کیفیت بالا، تیم حرفه‌ای و تجربه کاربری مناسب.",
};

export default async function ServicesPage() {
  const services = await getServicesPageData();

  return (
    <div className="bg-background-2" dir="rtl">
      {/* Hero */}
      <div className="relative isolate overflow-hidden px-6 py-12 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-30" />
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight bg-gradient-to-l from-cms-primary to-indigo-600 bg-clip-text text-transparent sm:text-6xl font-yekan">
            خدمات تخصصی کلینیک
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 font-yekan">
            مجموعه‌ای از خدمات حرفه‌ای برای سلامت و آرامش شما
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pb-16">
        {(!services || services.length === 0) && (
          <div className="mx-auto max-w-md text-center bg-white/70 backdrop-blur p-8 rounded-2xl ring-1 ring-gray-900/5">
            <p className="text-gray-500 font-yekan">در حال حاضر خدمتی ثبت نشده است.</p>
          </div>
        )}

        {services && services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group relative block rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500"
              >
                {/* Image */}
                <div className="relative bg-gray-100 aspect-[4/3]">
                  {service.cover?.publicUrl ? (
                    <Image
                      src={service.cover.publicUrl}
                      alt={service.cover.alt || service.title}
                      fill
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-service-bg/90 via-service-bg/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                </div>

                {/* Body */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold font-yekan drop-shadow-sm">
                    {service.title}
                  </h3>
                  {service.excerpt || service.subtitle ? (
                    <p className="mt-2 text-sm text-gray-100 line-clamp-3 font-yekan">
                      {service.excerpt || service.subtitle}
                    </p>
                  ) : null}
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-sm font-bold rounded-xl border border-white/30 hover:bg-service-bg/90 transition-colors font-yekan">
                      مشاهده جزئیات
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
