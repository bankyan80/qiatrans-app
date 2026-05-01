import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qua Trans Manajemen - Sistem Manajemen Transportasi",
  description:
    "Aplikasi manajemen transportasi modern untuk pemilik usaha rental. Kelola armada, booking, pembayaran, dan laporan dalam satu platform.",
  keywords: [
    "rental mobil",
    "manajemen transportasi",
    "fleet management",
    "car rental",
    "booking",
  ],
  icons: {
    icon: "/logo.png",
  },
  authors: [{ name: "Qua Trans Manajemen" }],
  openGraph: {
    title: "Qua Trans Manajemen - Sistem Manajemen Transportasi",
    description:
      "Aplikasi manajemen transportasi modern untuk pemilik usaha rental.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
