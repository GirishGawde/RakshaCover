import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthGuard } from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RakshaCover — Fraud Detection & Protection",
  description: "AI-powered cyber fraud prevention, incident reporting, and cluster intelligence for India.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0d0d0d] text-[#f5f5f5] antialiased">
        <AuthGuard>
          <Navbar />
          <main>{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
