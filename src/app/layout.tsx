import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Privato — The right information, right when it matters", template: "%s · Privato" },
  description: "A private information network for the people you trust.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={GeistSans.variable}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
