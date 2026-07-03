import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Real IELTS Prep",
  description: "Practice all 4 IELTS skills — Reading, Listening, Writing, Speaking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 font-sans antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
