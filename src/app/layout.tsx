import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/public/home/Navbar";
import Footer from "@/components/public/home/Footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata: Metadata = {
  metadataBase: new URL("https://asr-salamat.ir"),
  title: {
    default: "مرکز جامع دیالیز طلوع عصر سلامت",
    template: "%s | مرکز جامع دیالیز طلوع عصر سلامت",
  },
  description:
    "درمانگاه عصر سلامت با تمرکز بر خدمات تخصصی دیالیز و مراقبت‌های نوین کلیوی، با بهره‌گیری از تجهیزات پیشرفته و تیمی مجرب، خدماتی ایمن و انسانی ارائه می‌دهد.",
  alternates: {
    canonical: "/",
    languages: {
      "fa-IR": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "مرکز جامع دیالیز طلوع عصر سلامت",
    url: "https://asr-salamat.ir/",
    title: "مرکز جامع دیالیز طلوع عصر سلامت",
    description:
      "خدمات تخصصی دیالیز با استانداردهای روز دنیا در محیطی آرام و مجهز.",
  },
  twitter: {
    card: "summary_large_image",
    title: "مرکز جامع دیالیز طلوع عصر سلامت",
    description:
      "خدمات تخصصی دیالیز با استانداردهای روز دنیا در محیطی آرام و مجهز.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  const user = session?.user;

  // Footer fetches its own data; previous external fetch removed

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: "مرکز جامع دیالیز طلوع عصر سلامت",
    url: "https://asr-salamat.ir/",
    telephone: "+98-21-44675890",
    email: "aria1998htl@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "تهران، خیابان مطهری، بعد از چهارراه سهروردی، پلاک ۲۳۱، ساختمان پزشکی آراد، طبقه سوم",
      addressLocality: "تهران",
      addressRegion: "تهران",
      postalCode: "",
      addressCountry: "IR",
    },
    image: "https://asr-salamat.ir/favicon.ico",
    sameAs: [],
    openingHoursSpecification: [],
  };

  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "مرکز جامع دیالیز طلوع عصر سلامت",
    url: "https://asr-salamat.ir/",
    inLanguage: "fa-IR",
  };

  return (
    <html lang="fa" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrganization),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body
        dir="rtl"
        className="flex relative flex-col min-h-screen font-yekan"
      >
        <Navbar user={user} />
        <main className="flex-grow w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}