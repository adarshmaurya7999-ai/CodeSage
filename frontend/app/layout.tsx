import type { Metadata } from "next";
import { DM_Sans, Fira_Code, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeSage AI — Code Review Dashboard",
  description: "AI-powered pull request review for engineering teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrains.variable} ${dmSans.variable} ${firaCode.variable} h-full`}
    >
      <body className="noise-overlay min-h-full antialiased">{children}</body>
    </html>
  );
}
