import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/provider/provider";
import Navbar from "@/components/navbar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "These2.0",
  description: "Find fmpm Thesis easily with no struggle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased")}>
        <Provider>
          <Navbar />
          <div className="min-h-[calc(100vh-56px)] grainy bg-gradient-to-r from-blue-100 to-cyan-100">
            {children}
          </div>
        </Provider>
      </body>
    </html>
  );
}
