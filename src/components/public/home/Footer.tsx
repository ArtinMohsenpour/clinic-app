import Link from "next/link";
import {
  Phone,
  MapPin,
  Mail,
  Instagram,
  Linkedin,
  Twitter,
  ChevronLeft,
} from "lucide-react";
import { getFooterData } from "@/lib/data/home";
import Image from "next/image";

export default async function Footer() {
  const { mainBranch } = await getFooterData();

  // Prepare Display Data
  const contactInfo = mainBranch?.cms;
  const branchName =
    contactInfo?.title || mainBranch?.name || "کلینیک عصر سلامت";
  const branchSubtitle =
    contactInfo?.subtitle || "ارائه دهنده خدمات نوین پزشکی";

  // Dynamic description from CMS body if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyContent = contactInfo?.body as any;
  const description =
    bodyContent?.content ||
    "ما در کلینیک عصر سلامت متعهد هستیم تا با بهره‌گیری از بهترین متخصصان و تجهیزات روز دنیا، خدماتی شایسته و با کیفیت را به شما مراجعین عزیز ارائه دهیم. سلامت شما، هدف ماست.";

  // Dynamic Persian Year
  const currentYear = new Date().toLocaleDateString("fa-IR", {
    year: "numeric",
  });

  return (
    <footer className="bg-[#1e293b] text-white pt-16 pb-8 font-yekan relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-service-bg via-primary-500 to-service-bg opacity-70"></div>

      {/* Main Container - Responsive width matching Navbar */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Column 1: Brand & About (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm border border-white/10">
                {/* Logo Placeholder */}
                <span className="text-2xl font-bold text-service-bg">
                  {" "}
                  <Image
                    src="/assets/images/logo-asr.png"
                    alt="Clinic Logo"
                    fill
                    priority // Loads image faster
                    className="object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">
                  عصر سلامت
                </span>
                <span className="text-xs text-gray-400">{branchSubtitle}</span>
              </div>
            </div>

            <p className="text-gray-400 leading-relaxed text-sm text-justify ml-4 line-clamp-4">
              {description}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <SocialLink href="#" icon={<Instagram className="w-5 h-5" />} />
              <SocialLink href="#" icon={<Twitter className="w-5 h-5" />} />
              <SocialLink href="#" icon={<Linkedin className="w-5 h-5" />} />
            </div>
          </div>

          {/* Column 2: Quick Links (4 cols) */}
          <div className="lg:col-span-4 lg:px-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-service-bg rounded-full"></span>
              دسترسی سریع
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
              <FooterLink href="/" label="صفحه اصلی" />
              <FooterLink href="/about" label="درباره ما" />

              <FooterLink href="/services" label="خدمات ما" />
              <FooterLink href="/forms" label="فرم‌ها و مدارک" />

              <FooterLink href="/articles" label="مقالات و اخبار" />
              <FooterLink href="/education" label="آموزش بیماران" />

              <FooterLink href="/branches" label="شعب ما" />
              <FooterLink href="/insurances" label="بیمه‌های طرف قرارداد" />

              <FooterLink href="/staff" label="پزشکان و پرسنل" />
              <FooterLink href="/jobs" label="فرصت‌های شغلی" />

              <FooterLink href="/faq" label="سوالات متداول" />
              <FooterLink href="/contact" label="تماس با ما" />
            </ul>
          </div>

          {/* Column 3: Contact Info (4 cols) */}
          <div className="lg:col-span-4">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-service-bg rounded-full"></span>
              اطلاعات تماس
            </h3>
            <div className="flex flex-col gap-6">
              {/* Address */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-service-bg group-hover:bg-service-bg group-hover:text-white transition-colors mt-1 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-400 font-bold">آدرس:</span>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {contactInfo?.publicAddress || "آدرس ثبت نشده است"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-service-bg group-hover:bg-service-bg group-hover:text-white transition-colors mt-1 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-400 font-bold">
                    تلفن تماس:
                  </span>
                  <a
                    href={`tel:${contactInfo?.phonePrimary}`}
                    className="text-sm text-gray-300 hover:text-white transition-colors dir-ltr text-right"
                  >
                    {contactInfo?.phonePrimary || "شماره ثبت نشده"}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-service-bg group-hover:bg-service-bg group-hover:text-white transition-colors mt-1 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-400 font-bold">
                    پست الکترونیک:
                  </span>
                  <a
                    href={`mailto:${contactInfo?.emailPublic}`}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {contactInfo?.emailPublic || "ایمیل ثبت نشده"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            تمامی حقوق مادی و معنوی این وبسایت متعلق به {branchName} می‌باشد. ©{" "}
            {currentYear}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              حریم خصوصی
            </Link>
            <Link
              href="/imprint"
              className="hover:text-white transition-colors"
            >
              قوانین و مقررات
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-service-bg hover:text-white hover:-translate-y-1 transition-all duration-300"
    >
      {icon}
    </a>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-gray-400 hover:text-cyan-400 hover:-translate-x-1 transition-all duration-300 text-sm flex items-center gap-1 group"
      >
        <ChevronLeft className="w-3 h-3 text-gray-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all" />
        {label}
      </Link>
    </li>
  );
}