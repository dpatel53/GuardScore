import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuardScore — cyber-hygiene monitoring for small business",
  description:
    "Automated daily checks on your SSL certificate, domain expiry, email spoofing protection and website security headers, with plain-English alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
