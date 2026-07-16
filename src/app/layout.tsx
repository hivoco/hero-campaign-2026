import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/** Condensed uppercase display face for headings and the campaign voice. */
const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** True Bebas Neue Bold (Google Fonts only ships 400) — used for the story
 *  card titles. Exposed as `--font-display-bold` (see `.display-bold`). */
const bebasNeueBold = localFont({
  src: "../../public/BebasNeue-Bold.otf",
  variable: "--font-display-bold",
  weight: "700",
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
      className={`${bebasNeue.variable} ${bebasNeueBold.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
