import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/** Condensed uppercase display face for headings and the campaign voice. */
const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hero Destini · Fantasy World",
  description:
    "Create your very own personalised dragon story with your child in the Hero Destini fantasy world.",
};

export const viewport: Viewport = {
  themeColor: "#0b0f1a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
