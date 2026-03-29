import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedEdu - Medical Course Management",
  description: "Comprehensive course management system for medical education",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Thêm suppressHydrationWarning vào thẻ body */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
