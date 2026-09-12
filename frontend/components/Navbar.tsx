"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut } from "lucide-react";

const navLinks = [
  { href: "/check",  label: "Prevention" },
  { href: "/report", label: "Report" },
  { href: "/graph",  label: "Cluster Graph" },
];

export function Navbar() {
  const path = usePathname();
  const router = useRouter();

  if (path === "/login") return null;

  const handleLogout = () => {
    sessionStorage.removeItem("raksha_user");
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0d0d0d]/90 backdrop-blur-md print:hidden">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#e63946] rounded-lg flex items-center justify-center group-hover:shadow-[0_0_14px_rgba(230,57,70,0.5)] transition-shadow">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Raksha<span className="text-[#e63946]">Cover</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                path.startsWith(href)
                  ? "text-[#e63946]"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA & Logout */}
        <div className="flex items-center gap-3">
          <Link href="/report" className="btn-red text-sm px-5 py-2 rounded-lg hidden sm:block">
            Report Fraud
          </Link>
          <button onClick={handleLogout} className="text-[#9ca3af] hover:text-white transition-colors p-2" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
