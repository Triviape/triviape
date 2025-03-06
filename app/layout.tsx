import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "./providers/query-provider";
import { ResponsiveUIProvider } from "./contexts/responsive-ui-context";
import PerformanceProvider from "./providers/PerformanceProvider";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Triviape - The Ultimate Trivia Experience",
  description: "Challenge yourself with daily trivia quizzes, compete with friends, and become a trivia master!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ReactQueryProvider>
          <ResponsiveUIProvider>
            <PerformanceProvider>
              {children}
            </PerformanceProvider>
          </ResponsiveUIProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
