import Link from "next/link";

export function Footer() {
  return (
    <nav className="bg-[#ffffff] text-[#1d1d1f] shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/">
          <div className="text-xl font-semibold">MyApp</div>
        </Link>
        <div className="text-xl font-semibold">FOOOTER</div>
        {/* TODO: Add mobile menu toggle/hamburger here */}
      </div>
    </nav>
  );
}
