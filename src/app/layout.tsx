import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "../config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: `${siteConfig.siteName} | ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col relative">
        {/* Background Decorative Elements */}
        <div className="bg-orb-1"></div>
        <div className="bg-orb-2"></div>
        <div className="bg-orb-3"></div>

        <Navbar />
        
        <main className="flex-1 pt-20">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
