import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Center",
  description: "Personal workload and project command center"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-[14px] leading-relaxed">{children}</body>
    </html>
  );
}
