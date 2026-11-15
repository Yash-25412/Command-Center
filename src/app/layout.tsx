import type { Metadata } from "next";
import { Manrope, DM_Mono } from "next/font/google";
import "./globals.css";
import PageFadeIn from "@/components/PageFadeIn";

const sans = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Command Center",
  description: "Personal workload and project command center"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans text-[14px] leading-relaxed antialiased">
        <PageFadeIn>{children}</PageFadeIn>
      </body>
    </html>
  );
}
