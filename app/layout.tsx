import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vekto — підготовка до НМТ",
  description: "Тести, статистика та персональний темп підготовки до НМТ.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className="antialiased">{children}</body>
    </html>
  );
}
