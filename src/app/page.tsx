import {
  getHeroSlides,
  getHomeServices,
  getLatestArticles,
  getHomeBranches,
  getHomeStaticPages,
  getHomeInsurances,
} from "@/lib/data/home";
import HeroSlider from "@/components/public/home/HeroSlider";
import HomeAboutSection from "@/components/public/home/HomeAboutSection";
import HomeServicesSection from "@/components/public/home/HomeServicesSection";
import HomeArticlesSection from "@/components/public/home/HomeArticleSection";
import HomeBranchesSection from "@/components/public/home/HomeBranchesSection";
import HomeInsurancesSection from "@/components/public/home/HomeInsurancesSection";

export const metadata = {
  title: "صفحه اصلی | کلینیک عصر سلامت",
  description: "خدمات پزشکی و درمانی با بالاترین کیفیت",
};

export default async function Home() {
  // 1. Fetch data in parallel for maximum speed
  const [heroSlides, services, articles, branches, staticPages, insurances] =
    await Promise.all([
      getHeroSlides(),
      getHomeServices(),
      getLatestArticles(),
      getHomeBranches(),
      getHomeStaticPages(),
      getHomeInsurances(),
    ]);

  return (
    <main className="min-h-screen bg-background font-yekan">
      {/* 1. Hero */}
      {heroSlides && heroSlides.length > 0 && (
        <HeroSlider slides={heroSlides} />
      )}

      {/* 2. About */}
      {staticPages && staticPages.length > 0 && (
        <section className="py-16 md:py-18 relative bg-background-3">
          <div className="absolute top-1 right-0 px-5 py-2 mt-3 bg-cms-primary text-white rounded-l-sm hidden md:flex">
            درباره ما
          </div>
          <div className="container mx-auto px-4">
            <HomeAboutSection data={staticPages} />
          </div>
        </section>
      )}

      {/* 3. Services */}
      {services && services.length > 0 && (
        <section className="py-16 md:py-18 relative bg-background-2">
          <div className="absolute top-1 right-0 px-5 py-2 mt-3 bg-service-bg text-white rounded-l-sm hidden md:flex">
            خدمات
          </div>
          <div className="container mx-auto px-4">
            <HomeServicesSection data={services} />
          </div>
        </section>
      )}

      {/* 4. Articles */}
      {articles && articles.length > 0 && (
        <section className="py-16 md:py-18 relative bg-background-3">
          <div className="absolute top-1 right-0 px-5 py-2 mt-3 bg-golden-yellow text-white rounded-l-sm hidden md:flex">
            مقالات
          </div>
          <div className="container mx-auto px-4">
            <HomeArticlesSection data={articles} />
          </div>
        </section>
      )}

      {/* 5. Branches */}
      {branches && branches.length > 0 && (
        <section className="py-16 md:py-18 relative bg-background-2">
          <div className="absolute top-1 right-0 px-5 py-2 mt-3 bg-cms-primary text-white rounded-l-sm hidden md:flex">
            شعبه ها
          </div>
          <div className="container mx-auto px-4">
            <HomeBranchesSection data={branches} />
          </div>
        </section>
      )}

      {/* 6. Insurances */}
      {insurances && insurances.length > 0 && (
        <section className="py-16 md:py-18 relative bg-background-3">
          <div className="absolute top-1 right-0 px-5 py-2 mt-3 bg-service-bg text-white rounded-l-sm hidden md:flex">
            بیمه ها
          </div>
          <div className="container mx-auto px-4">
            <HomeInsurancesSection data={insurances} />
          </div>
        </section>
      )}
    </main>
  );
}