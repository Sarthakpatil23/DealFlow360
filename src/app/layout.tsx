import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealFlow360 — B2B Sales Operations Platform",
  description: "Next-generation CPQ, discount governance, and fulfillment engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-[#171717] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
