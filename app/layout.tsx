import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/ui/navbar";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  weight: ["400", "600", "700", "900"],
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Postcard — Democratizing the truth",
  description:
    "Honesty-as-a-Service: Forensic-grade source verification for the post-truth era.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", playfair.variable, garamond.variable)}
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
        style={{ background: "var(--postal-paper)" }}
      >
        <Navbar />
        {children}
        <Toaster position="bottom-center" theme="light" />
      </body>
    </html>
  );
}
