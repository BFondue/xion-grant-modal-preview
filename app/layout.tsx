import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XION Grant Modal Preview",
  description: "Preview the redesigned XION grant approval modal",
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
