import HeroSlider from "@/components/public/home/HeroSlider";

// app/page.tsx
export default function Home() {
  return (
    <div className="my-5">
      {/* Hero Section */}

      <HeroSlider />

      {/* About Section */}
      <section className="mt-16 ">
        <h2 className="text-3xl font-bold font-digikala text-navbar-secondary mb-4">
          درباره ما
        </h2>
        <p className="text-lg font-bnazanin text-gray-700 leading-relaxed">
          مرکز ما با هدف ارتقای سلامت بیماران و ارائه خدماتی با کیفیت و مطابق با
          استانداردهای روز دنیا تأسیس شده است. ما با بهره‌گیری از بهترین متخصصان
          و جدیدترین تکنولوژی‌ها، محیطی ایمن و آرامش‌بخش برای بیماران فراهم
          کرده‌ایم.
        </p>
      </section>

      {/* Services Section */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold font-digikala text-navbar-secondary mb-8">
          خدمات ما
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 bg-white shadow rounded-lg text-center">
            <h3 className="text-xl font-bold font-nastaliq text-navbar-secondary mb-2">
              دیالیز
            </h3>
            <p className="text-gray-600 font-bnazanin">
              ارائه خدمات دیالیز با تجهیزات مدرن و کادر حرفه‌ای.
            </p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg text-center">
            <h3 className="text-xl font-bold font-nastaliq text-navbar-secondary mb-2">
              مشاوره پزشکی
            </h3>
            <p className="text-gray-600 font-bnazanin">
              مشاوره حضوری و آنلاین توسط بهترین پزشکان متخصص.
            </p>
          </div>
          <div className="p-6 bg-white shadow rounded-lg text-center">
            <h3 className="text-xl font-bold font-nastaliq text-navbar-secondary mb-2">
              آزمایشگاه تخصصی
            </h3>
            <p className="text-gray-600 font-bnazanin">
              انجام آزمایش‌های تخصصی با دقت و سرعت بالا.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mt-16 text-center">
        <h2 className="text-3xl font-bold font-digikala text-navbar-secondary">
          وقت مشاوره بگیرید
        </h2>
        <p className="text-lg font-bnazanin text-gray-700 mt-2">
          هم‌اکنون وقت ملاقات خود را رزرو کنید و از خدمات تخصصی ما بهره‌مند
          شوید.
        </p>
        <a
          href="/appointments"
          className="inline-block mt-6 bg-navbar-secondary text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-navbar-hover transition"
        >
          رزرو نوبت
        </a>
      </section>
    </div>
  );
}
