import {
  getHeroSlides,
  getHomeServices,
  getLatestArticles,
  getHomeBranches,
} from "@/lib/data/home";
import HeroSlider from "@/components/public/home/HeroSlider";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "صفحه اصلی | کلینیک عصر سلامت",
  description: "خدمات پزشکی و درمانی با بالاترین کیفیت",
};

export default async function Home() {
  // 1. Fetch data in parallel for maximum speed
  const [heroSlides, services, articles, branches] = await Promise.all([
    getHeroSlides(),
    getHomeServices(),
    getLatestArticles(),
    getHomeBranches(),
  ]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] font-yekan">
      {/* Hero Section */}
      <HeroSlider slides={heroSlides} />

      {/* About Section (Static) */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navbar-secondary mb-6 font-digikala">
            درباره مرکز ما
          </h2>
          <p className="text-lg text-gray-600 leading-loose font-bnazanin text-justify md:text-center">
            مرکز ما با هدف ارتقای سلامت بیماران و ارائه خدماتی با کیفیت و مطابق
            با استانداردهای روز دنیا تأسیس شده است. ما با بهره‌گیری از بهترین
            متخصصان و جدیدترین تکنولوژی‌ها، محیطی ایمن و آرامش‌بخش برای بیماران
            فراهم کرده‌ایم.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-4">
            <h2 className="text-3xl font-bold text-navbar-secondary font-digikala">
              خدمات تخصصی
            </h2>
            <Link
              href="/services"
              className="text-navbar-secondary hover:text-navbar-hover font-medium flex items-center gap-1 text-sm"
            >
              مشاهده همه
              <span className="text-lg">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-gray-50 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-navbar-secondary group-hover:scale-110 transition-transform">
                  {service.cover?.publicUrl ? (
                    <Image
                      src={service.cover.publicUrl}
                      alt={service.title}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-3xl">✚</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-navbar-secondary transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 font-bnazanin">
                  {service.excerpt || "توضیحات خدمات ارائه شده در این بخش..."}
                </p>
              </div>
            ))}
            {!services.length && (
              <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                هنوز خدمتی ثبت نشده است.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-navbar-secondary to-teal-700 rounded-3xl p-8 md:p-16 text-center text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden">
            {/* Decorative Circle */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10 font-digikala">
              نوبت دهی آنلاین و سریع
            </h2>
            <p className="text-lg md:text-xl text-teal-50 mb-10 max-w-2xl mx-auto relative z-10 font-bnazanin">
              هم‌اکنون وقت ملاقات خود را رزرو کنید و از خدمات تخصصی ما در
              کوتاه‌ترین زمان ممکن بهره‌مند شوید.
            </p>
            <Link
              href="/appointments"
              className="inline-block bg-white text-navbar-secondary px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-transform hover:-translate-y-1 shadow-lg relative z-10"
            >
              رزرو نوبت
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
