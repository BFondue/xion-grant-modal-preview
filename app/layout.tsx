import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XION Grant Modal Preview",
  description: "Preview the redesigned XION grant approval modal",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
