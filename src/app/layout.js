import { Geist, Geist_Mono } from "next/font/google";
import NextAuthProvider from '@/components/providers/NextAuthProvider';
import Navbar from '@/components/layout/Navbar';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OnlyFarms - Content Creator Platform",
  description: "A premium platform for content creators and their fans",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-100`}
      >
        <NextAuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
