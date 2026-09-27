import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import { SuperTokensProvider } from "@/components/providers/supertokens-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import "@/styles/sidebar.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SelfBrief Aero",
  description: "Aviation Intelligence Platform",
  icons: {
    icon: [{ url: "/brand/logo.png", type: "image/png", sizes: "180x180" }],
    apple: [{ url: "/brand/logo.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SuperTokensProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </SuperTokensProvider>
      </body>
    </html>
  );
}
