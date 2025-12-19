import { getContactUsPageData } from "@/lib/data/contact-us";
import RichTextRenderer from "@/components/common/RichTextRenderer";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata = {
  title: "تماس با ما | کلینیک تخصصی عصر سلامت",
  description: "راه‌های ارتباطی، آدرس و ساعات کاری کلینیک.",
};

export default async function ContactPage() {
  const pageData = await getContactUsPageData();

  if (!pageData || pageData.status !== "PUBLISHED") {
    notFound();
  }

  // نقشه هاردکد شده
  const HARD_CODED_MAP_URL =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.5444!2d51.41!3d35.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDQ1JzAwLjAiTiA1McKwMjQnNjAuMCJF!5e0!3m2!1sen!2sir!4v123456789";

  return (
    <div className="bg-background-2 min-h-screen">
      {/* 1. HERO SECTION */}
      <div className="relative isolate overflow-hidden px-6 py-16 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.50),white)] opacity-20" />

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-l from-cms-primary to-blue-600 bg-clip-text text-transparent sm:text-6xl">
            {pageData.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            ما مشتاقانه منتظر شنیدن صدای شما هستیم. تیم پشتیبانی ما در تمامی
            مراحل درمان همراه شماست.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* 2. CONTACT CARDS (Fetched from CMS) */}
            <div className="lg:col-span-4 space-y-6">
              {pageData.contactItems?.map((item) => {
                const Icon =
                  item.type === "PHONE"
                    ? Phone
                    : item.type === "EMAIL"
                    ? Mail
                    : MapPin;
                return (
                  <div
                    key={item.id}
                    className="group flex items-start gap-4 rounded-2xl bg-white/70 backdrop-blur-md p-6 ring-1 ring-gray-900/5 transition duration-200 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cms-primary/10 to-blue-200 text-cms-primary shadow-inner">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {item.label}
                      </dt>
                      <dd
                        className={`mt-1 text-lg font-bold text-gray-900 ${
                          item.type !== "ADDRESS" ? "dir-ltr text-right" : ""
                        }`}
                      >
                        {item.type === "PHONE" ? (
                          <a
                            href={`tel:${item.value}`}
                            className="hover:text-cms-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : item.type === "EMAIL" ? (
                          <a
                            href={`mailto:${item.value}`}
                            className="hover:text-cms-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </dd>
                    </div>
                  </div>
                );
              })}

              {/* CTA Card */}
              <div className="rounded-3xl bg-cms-primary p-8 hidden text-white shadow-2xl shadow-cms-primary/20 relative overflow-hidden group">
                <div className="relative z-10">
                  <MessageCircle className="h-10 w-10 mb-4 opacity-80" />
                  <h3 className="text-xl font-bold">
                    نیاز به نوبت فوری دارید؟
                  </h3>
                  <p className="mt-2 text-blue-100 text-sm leading-relaxed">
                    می‌توانید همین حالا از طریق سامانه رزرو آنلاین، نوبت خود را
                    ثبت کنید.
                  </p>
                  <button className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-cms-primary transition-all hover:bg-blue-50">
                    رزرو نوبت آنلاین
                  </button>
                </div>
                <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-150" />
              </div>
            </div>

            {/* 3. CONTENT & MAP SECTION */}
            <div className="lg:col-span-8 space-y-8">
              {/* Dynamic Body Content (Working Hours etc.) */}
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl p-8 sm:p-10 shadow-sm ring-1 ring-gray-900/5 relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-8 w-1.5 rounded-full bg-cms-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    ساعات کاری و توضیحات
                  </h2>
                </div>
                <div className="prose prose-blue max-w-none prose-p:leading-8 prose-p:text-gray-600 prose-strong:text-gray-900">
                  {pageData.body ? (
                    <RichTextRenderer content={pageData.body} />
                  ) : (
                    <p className="italic text-gray-400">
                      توضیحاتی ثبت نشده است.
                    </p>
                  )}
                </div>
              </div>

              {/* Hard-coded Map */}
              <div className="overflow-hidden rounded-3xl bg-white p-2 shadow-sm ring-1 ring-gray-900/5 h-[450px]">
                <iframe
                  src={HARD_CODED_MAP_URL}
                  width="100%"
                  height="100%"
                  className="rounded-2xl grayscale hover:grayscale-0 transition-all duration-700"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
