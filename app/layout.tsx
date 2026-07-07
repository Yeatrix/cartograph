import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cartograph — read like an expedition",
  description:
    "One page a day. Three questions you can't fake. Watch the map — and your mind — change."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
