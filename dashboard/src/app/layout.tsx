import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CausalFunnel Analytics — User Session Dashboard",
  description: "Track user interactions, visualize session journeys, and analyze click heatmaps for your web pages.",
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
