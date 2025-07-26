import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { EmployeeRefreshProvider } from "@/lib/hooks/use-employee-refresh";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SECL Directory - Coal India Employee Directory",
  description: "South Eastern Coalfields Limited employee directory for Coal India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <EmployeeRefreshProvider>
            <div className="h-screen bg-background font-sans flex flex-col">
              <AppNav />
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
              <Toaster />
            </div>
          </EmployeeRefreshProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
