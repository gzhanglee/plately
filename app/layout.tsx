import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plateful Camera Coach",
  description:
    "A live food photography coach with camera overlays and simple shot feedback.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
