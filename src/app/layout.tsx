import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/public/home/Navbar";
import Footer from "@/components/public/home/Footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getFooterData } from "@/lib/data/home";

export const metadata: Metadata = {
  title: "Clinic App",
  description: "صفحه اصلی | کلینیک عصر سلامت",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  const user = session?.user;

  // Fetch footer data
  const footerData = await getFooterData();

  return (
    <html lang="fa" dir="rtl">
      <body
        dir="rtl"
        className="flex relative flex-col min-h-screen font-yekan"
      >
        <Navbar user={user} />
        <main className="flex-grow w-full">{children}</main>
        <Footer data={footerData} />
      </body>
    </html>
  );
}