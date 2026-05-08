import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "400",
  display: "swap",
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hansoll-style-picker.vercel.app"),
  title: "HANSOLL SP'27 | Talbots Outlet",
  description: "Knitwell Group × Hansoll Textile — SP'27 Talbots Outlet style selection & review platform",
  openGraph: {
    title: "HANSOLL SP'27 | Talbots Outlet",
    description: "Knitwell Group × Hansoll Textile — SP'27 Collection style selection & review platform",
    url: "https://hansoll-style-picker.vercel.app",
    images: [{ url: "https://hansoll-style-picker.vercel.app/og-image-v2.png", width: 1200, height: 630 }],
    type: "website",
    siteName: "HANSOLL Style Picker",
  },
  twitter: {
    card: "summary_large_image",
    title: "HANSOLL SP'27 | Talbots Outlet",
    description: "Knitwell Group × Hansoll Textile — SP'27 Collection",
    images: ["/og-image-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
