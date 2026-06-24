import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import { ManufacturingProvider } from "@/context/manufacturing-context";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CementPro MES | Manufacturing Management",
  description:
    "Manufacturing execution system demo for cement products factory management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ManufacturingProvider>{children}</ManufacturingProvider>
      </body>
    </html>
  );
}
