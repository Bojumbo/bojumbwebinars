import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoWebinar - Платформа для автовебінарів",
  description: "Дивіться трансляцію в прямому ефірі",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
