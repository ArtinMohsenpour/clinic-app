import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, ArrowLeft } from "lucide-react";
import { getBranchesPageData } from "@/lib/data/branches";

export const metadata = {
  title: "شعب کلینیک | آدرس و اطلاعات تماس",
  description:
    "همه شعب فعال کلینیک به همراه آدرس، شماره تماس و تصویر محیط. نزدیک‌ترین شعبه را پیدا کنید.",
};

export default async function BranchesPage() {
  const branches = await getBranchesPageData();

  return (
    <div className="bg-background-2" dir="rtl">
      {/* Hero */}
      <div className="relative isolate overflow-hidden px-6 py-12 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.emerald.50),white)] opacity-50" />
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight bg-gradient-to-l from-cms-primary to-emerald-600 bg-clip-text text-transparent sm:text-6xl font-yekan">
            شعب ما
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 font-yekan">
            آدرس و اطلاعات تماس شعب فعال کلینیک
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pb-16">
        {(!branches || branches.length === 0) && (
          <div className="mx-auto max-w-md text-center bg-white/70 backdrop-blur p-8 rounded-2xl ring-1 ring-gray-900/5">
            <p className="text-gray-500 font-yekan">در حال حاضر شعبه‌ای ثبت نشده است.</p>
          </div>
        )}

        {branches && branches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map((b) => (
              <Link
                key={b.id}
                href={`/branches/${b.key}`}
                className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 bg-white ring-1 ring-gray-200/70"
              >
                {/* Image */}
                <div className="relative bg-gray-100 aspect-[4/3]">
                  {b.cms?.hero?.publicUrl ? (
                    <Image
                      src={b.cms.hero.publicUrl}
                      alt={b.cms.hero.alt || b.name}
                      fill
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-cms-secondary/90 via-cms-secondary/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                </div>

                {/* Body */}
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-white font-yekan drop-shadow-sm">
                      {b.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.city && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold font-yekan border border-white/30">
                          {b.city} شهر
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex flex-col gap-2 max-w-[75%]">
                      {b.cms?.publicAddress && (
                        <span className="inline-flex items-center gap-2 text-[13px] leading-5 text-white/95 font-yekan">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-2">{b.cms.publicAddress}</span>
                        </span>
                      )}
                      {b.cms?.phonePrimary && (
                        <span className="inline-flex items-center gap-2 text-[13px] leading-5 text-white/95 font-yekan">
                          <Phone className="w-4 h-4" />
                          {b.cms.phonePrimary}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-0 left-0 inline-flex text-xs items-center gap-2 px-4 py-2 bg-white/20 text-white font-bold rounded-tr-xl border border-white/30 group-hover:bg-cms-secondary/90 transition-colors font-yekan">
                      مشاهده شعبه
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
