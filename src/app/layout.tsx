import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frugal Friend",
  description: "Made with love, for Chantal",
  icons: {
    icon: [
      {
        url: 'https://i.imgur.com/BdvDqOW.png',
        sizes: '32x32',
        type: 'image/png',
      }
    ]
  },
  verification: {
    google: 'RzcKHgphgbZ4U8xXKdFJOzs_f7OTTg6vAkKOO7Jd5Ow'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}