import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import StoreProvider from "@/components/providers/StoreProvider";
import SessionManager from "@/components/providers/SessionManager";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1b4018",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "GABAY EcoTrack",
  description: "Centralized solid waste management logistics.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GABAY",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900">
        <StoreProvider>
          <SessionManager>
            {children}
          </SessionManager>
        </StoreProvider>
        <Toaster 
          closeButton 
          position="top-right" 
          expand={true}
          visibleToasts={5}
          offset="24px"
          gap={12}
          toastOptions={{
            unstyled: true,
            className: "flex justify-end p-0 bg-transparent",
          }}
        />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
