import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGate } from "./components/AuthGate";
import { AuthProvider } from "./contexts/AuthContext";
import { RegisterServiceWorker } from "./components/RegisterServiceWorker";
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
  title: "Diary of Us",
  description: "An intimate, shared journal for couples.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Diary of Us",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(91,108,255,0.08),transparent_60%),_radial-gradient(circle_at_bottom,_rgba(59,179,255,0.08),transparent_60%),_rgba(5,8,25,0.96)] text-slate-100">
          <RegisterServiceWorker />
          <AuthProvider>
            <AuthGate>{children}</AuthGate>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
