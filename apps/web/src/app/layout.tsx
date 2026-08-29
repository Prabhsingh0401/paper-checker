import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/common/toast";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VedaAI - Paper Checker",
  description: "Upload, extract, and map exam answers with AI assistance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full`}>
      <body className="h-full bg-gradient-to-t from-gray-300 to-white text-foreground antialiased" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
        <ToastProvider>
          <div className="h-full flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 lg:gap-3 lg:my-3 lg:mr-4 pt-2 lg:pt-0">
              <div className="hidden lg:block">
                <Topbar />
              </div>
              <div className="flex-1 flex flex-col min-h-0 rounded-none lg:rounded-2xl overflow-y-auto lg:overflow-hidden bg-gradient-to-t from-gray-300 to-white">
                {children}
              </div>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
