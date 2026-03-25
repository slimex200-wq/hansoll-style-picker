import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HANSOLL SP'27 | Talbots Outlet",
  description: "Style selection for SP'27 Talbots Outlet Collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#fafafa", color: "#333", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
