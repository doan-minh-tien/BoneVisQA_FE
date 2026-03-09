import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedEdu - Medical Course Management",
  description: "Comprehensive course management system for medical education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
