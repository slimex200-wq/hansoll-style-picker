import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HANSOLL SP'27 | Talbots Outlet",
  description: "Knitwell Group × Hansoll Textile — SP'27 Talbots Outlet style selection & review platform",
  openGraph: {
    title: "HANSOLL SP'27 | Talbots Outlet",
    description: "Knitwell Group × Hansoll Textile — SP'27 Collection style selection & review platform",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HANSOLL SP'27 | Talbots Outlet",
    description: "Knitwell Group × Hansoll Textile — SP'27 Collection",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
