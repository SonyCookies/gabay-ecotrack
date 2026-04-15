import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import StoreProvider from "@/components/providers/StoreProvider";
import SessionManager from "@/components/providers/SessionManager";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GABAY EcoTrack",
  description: "Centralized solid waste management logistics.",
};

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
      </body>
    </html>
  );
}
