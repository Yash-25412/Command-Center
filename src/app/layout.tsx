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
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,500;1,8..60,600&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-[14px] leading-relaxed">{children}</body>
    </html>
  );
}
