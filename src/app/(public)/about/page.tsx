import { getAboutPageData } from "@/lib/data/about";
import {
  Building2,
  Heart,
  GraduationCap,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "درباره ما | کلینیک تخصصی",
  description: "آشنایی با تاریخچه، ماموریت و ارزش‌های کلینیک عصر سلامت.",
};

// --- Helper to render rich text from CMS ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RichTextRenderer({ content }: { content: any }) {
  if (!content) return null;

  // Case 1: Content is a direct HTML string inside JSON
  if (typeof content === "string") {
    return (
      <div
        className="prose prose-lg prose-slate mx-auto text-justify leading-8 text-gray-600"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Case 2: Content is an object (e.g. Tiptap/EditorJS)
  if (typeof content === "object" && content?.html) {
    return (
      <div
        className="prose prose-lg prose-slate mx-auto text-justify leading-8 text-gray-600"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    );
  }

  return (
    <div className="text-gray-600 text-center">{JSON.stringify(content)}</div>
  );
}

export default async function AboutPage() {
  const pageData = await getAboutPageData();

  return (
    <div className="bg-background-2">
      {/* 1. HERO SECTION: Centered, Clean, Modern Typography */}
      <div className="relative isolate overflow-hidden  px-6  py-12 lg:px-8">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-20" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg]  shadow-xl shadow-cms-primary/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-2 text-4xl font-bold tracking-tight bg-gradient-to-l from-cms-primary to-indigo-600 bg-clip-text text-transparent sm:text-6xl">
            {pageData?.title || "درباره کلینیک ما"}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            تعهد ما ارائه خدمات درمانی با بالاترین استانداردهای جهانی در محیطی
            آرام و حرفه‌ای است.
          </p>
        </div>

        {/* 2. DYNAMIC CONTENT SECTION (Centered Rich Text) */}
        <div className="mx-auto mt-8 max-w-3xl">
          {pageData?.body ? (
            <div className="rounded-2xl bg-white/60 backdrop-blur p-4 sm:p-6 shadow-sm ring-1 ring-gray-900/5">
              <RichTextRenderer content={pageData.body} />
            </div>
          ) : (
            <p className="text-center italic text-gray-400 mt-10">
              محتوای متنی هنوز وارد نشده است...
            </p>
          )}

          {/* Contact Items Grid - Clean Cards */}
          {pageData?.contactItems && pageData.contactItems.length > 0 && (
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageData.contactItems.map((item) => {
                // Choose icon based on label or type (simple heuristic)
                const Icon =
                  item.type === "PHONE"
                    ? Phone
                    : item.type === "EMAIL"
                    ? Mail
                    : MapPin;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col items-center rounded-2xl bg-white/70 backdrop-blur p-6 text-center ring-1 ring-inset ring-gray-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cms-primary/10 to-indigo-200 text-cms-primary shadow-inner">
                      <Icon className="h-5 w-5" />
                    </div>
                    <dt className="text-sm font-semibold leading-7 text-gray-900">
                      {item.label}
                    </dt>
                    {item.type === "PHONE" ? (
                      <dd className="mt-1 text-sm leading-7 text-indigo-600 hover:text-indigo-700" dir="ltr">
                        <a href={`tel:${item.value}`} aria-label="شماره تماس">
                          {item.value}
                        </a>
                      </dd>
                    ) : item.type === "EMAIL" ? (
                      <dd className="mt-1 text-sm leading-7 text-indigo-600 hover:text-indigo-700" dir="ltr">
                        <a href={`mailto:${item.value}`} aria-label="آدرس ایمیل">
                          {item.value}
                        </a>
                      </dd>
                    ) : (
                      <dd className="mt-1 text-sm leading-7 text-gray-600" dir="ltr">
                        {item.value}
                      </dd>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. VALUES SECTION (Minimalist Grid) */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-cms-primary">
            چرا ما؟
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            ارزش‌های بنیادین کلینیک
          </p>
        </div>

        <div className="mx-auto max-w-2xl lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col items-center text-center transition duration-200 hover:-translate-y-1">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cms-primary text-white shadow-xl ring-1 ring-white/20">
                <Heart className="h-8 w-8" aria-hidden="true" />
              </div>
              <dt className="text-xl font-semibold leading-7 text-gray-900">
                مراقبت بیمار‌محور
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  ما نیازهای شما را در اولویت قرار می‌دهیم و با دلسوزی و احترام،
                  همراه همیشگی سلامت شما هستیم.
                </p>
              </dd>
            </div>

            <div className="flex flex-col items-center text-center transition duration-200 hover:-translate-y-1">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cms-primary text-white shadow-xl ring-1 ring-white/20">
                <GraduationCap className="h-8 w-8" aria-hidden="true" />
              </div>
              <dt className="text-xl font-semibold leading-7 text-gray-900">
                دانش روز پزشکی
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  تیم پزشکی ما متشکل از نخبگان دانشگاهی است که همواره در حال
                  به‌روزرسانی دانش خود هستند.
                </p>
              </dd>
            </div>

            <div className="flex flex-col items-center text-center transition duration-200 hover:-translate-y-1">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cms-primary text-white shadow-xl ring-1 ring-white/20">
                <Building2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <dt className="text-xl font-semibold leading-7 text-gray-900">
                تکنولوژی پیشرفته
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  استفاده از جدیدترین تجهیزات تشخیصی و درمانی برای تضمین دقت و
                  کیفیت خدمات.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 4. STATS SECTION (Clean Bar) */}
      <div className=" border-t border-gray-100 py-12 sm:pt-16 pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 text-center lg:grid-cols-4 font-mono">
            {[
              { id: 1, name: "سال تجربه درخشان", value: "15+" },
              { id: 2, name: "بیمار بهبود یافته", value: "10k+" },
              { id: 3, name: "پزشک و متخصص", value: "40+" },
              { id: 4, name: "شعبه فعال در کشور", value: "5" },
            ].map((stat) => (
              <div
                key={stat.id}
                className="mx-auto flex max-w-xs flex-col gap-y-2 rounded-2xl bg-white/60 backdrop-blur p-6 ring-1 ring-gray-900/5 shadow-sm"
              >
                <dt className="text-sm font-medium leading-7 text-gray-600">
                  {stat.name}
                </dt>
                <dd className="order-first text-4xl font-extrabold tracking-tight bg-gradient-to-l from-gray-900 to-indigo-700 bg-clip-text text-transparent sm:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
