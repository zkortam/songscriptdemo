import type { Metadata } from "next";
import { Suspense } from "react";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { themeBootstrap } from "@/lib/theme";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { UploadTray } from "@/components/catalogue/UploadTray";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Songscription Library",
  description: "Your catalogue of transcribed songs, ready to learn and practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={hanken.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-dvh bg-canvas bg-glows font-sans text-ink">
        <Providers>
          <div className="flex">
            <Suspense>
              <Sidebar />
            </Suspense>
            <div className="min-w-0 flex-1 overflow-x-clip">
              <div className="lg:hidden">
                <AppHeader />
              </div>
              <main className="mx-auto w-full max-w-content px-4 pb-24 sm:px-6 lg:px-10">
                {children}
              </main>
            </div>
          </div>
          <UploadTray />
        </Providers>
      </body>
    </html>
  );
}
