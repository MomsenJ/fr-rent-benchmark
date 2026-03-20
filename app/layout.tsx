import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "France Rent Benchmark MVP",
  description: "Single-page rent benchmark checker using local processed CSV files.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
