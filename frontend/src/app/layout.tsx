import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Advisory OS",
  description: "Ontology-centered MVP workbench for structured research synthesis.",
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
