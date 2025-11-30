import {
  getHeroSlides,
  getHomeServices,
  getLatestArticles,
  getHomeBranches,
  getHomeStaticPages,
} from "@/lib/data/home";
import HeroSlider from "@/components/public/home/HeroSlider";
import HomeAboutSection from "@/components/public/home/HomeAboutSection";
import HomeServicesSection from "@/components/public/home/HomeServicesSection";
import HomeArticlesSection from "@/components/public/home/HomeArticleSection";
import HomeBranchesSection from "@/components/public/home/HomeBranchesSection";

export const metadata = {
  title: "صفحه اصلی | کلینیک عصر سلامت",
  description: "خدمات پزشکی و درمانی با بالاترین کیفیت",
};

export default async function Home() {
  // 1. Fetch data in parallel for maximum speed
  const [heroSlides, services, articles, branches, staticPages] =
    await Promise.all([
      getHeroSlides(),
      getHomeServices(),
      getLatestArticles(),
      getHomeBranches(),
      getHomeStaticPages(),
    ]);

  console.log("Home page - articles:", articles);

  return (
    <main className="min-h-screen bg-background font-yekan">
      {/* 1. Hero */}
      <HeroSlider slides={heroSlides} />

      {/* 2. About */}
      <section className="py-16 md:py-18  relative bg-background-3">
        <div className=" absolute top-1 right-0 px-5 py-2 mt-3  bg-cms-primary text-white rounded-l-sm hidden md:flex">
          درباره ما
        </div>
        <div className="container mx-auto px-4">
          <HomeAboutSection data={staticPages} />
        </div>
      </section>

      {/* 3. Services */}
      <section className=" py-16 md:py-18 relative bg-background-2">
        <div className=" absolute top-1 right-0 px-5 py-2 mt-3 bg-service-bg text-white  rounded-l-sm hidden md:flex">
          خدمات
        </div>
        <div className="container mx-auto px-4">
          <HomeServicesSection data={services} />
        </div>
      </section>

      {/* 4. Articles */}
      <section className="py-16 md:py-18  relative  bg-background-3">
        <div className=" absolute top-1 right-0 px-5 py-2 mt-3  bg-golden-yellow text-white rounded-l-sm hidden md:flex">
          مقالات
        </div>
        <div className="container mx-auto px-4">
          <HomeArticlesSection data={articles} />
        </div>
      </section>

      {/* 5. Branches */}
      <section className="py-16 md:py-18  relative  bg-background-2">
        <div className=" absolute top-1 right-0 px-5 py-2 mt-3  bg-cms-primary text-white rounded-l-sm hidden md:flex">
          شعبه ها
        </div>
        <div className="container mx-auto px-4">
          <HomeBranchesSection data={branches} />
        </div>
      </section>

      {/* 4. CTA*/}
      <section className="b py-20 px-4">
        <div className="container mx-auto">{/* CTA Card */}</div>
      </section>
    </main>
  );
}
