import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

/** GA4 measurement ID. Overridable via env for other environments; falls back
 *  to the campaign's own ID so analytics work without extra config. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-Z46LB01E8V";

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

/** Absolute site origin — required so the canonical tag and OG/Twitter image
 *  URLs resolve to absolute links. Defaults to the production domain; override
 *  via NEXT_PUBLIC_SITE_URL for staging/preview. (NEXT_PUBLIC_* is inlined at
 *  build time — rebuild after changing it.) */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destini.heromotocorp.com";

/** Shared marketing copy, reused across the tab title, OG and Twitter cards. */
const SITE_TITLE = "Hero Destini · Turn Your Child Into the Hero of Their Own Adventure";
const SITE_DESCRIPTION =
  "Create a free, personalised adventure video starring your child with Hero Destini. Upload a selfie, pick a magical world, and bring your little one's story to life in minutes.";
/** Meta share image — the Hero Destini logo, per brief. */
const OG_IMAGE = "/hero-logo-2.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Hero Destini",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Hero Destini",
  keywords: [
    "Hero Destini",
    "Hero MotoCorp",
    "Destini scooter",
    "personalised kids story",
    "personalized children's video",
    "custom adventure story for kids",
    "make your child a hero",
    "magical adventure video",
    "Hero Ka Scooter Scooter Ka Hero",
    "family video campaign",
  ],
  authors: [{ name: "Hero MotoCorp" }],
  creator: "Hero MotoCorp",
  publisher: "Hero MotoCorp",
  // Relative path is resolved against metadataBase → an absolute canonical URL.
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Hero Destini",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_IN",
    images: [
      {
        url: OG_IMAGE,
        width: 396,
        height: 132,
        alt: "Hero Destini",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
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
      {/* GA4 via gtag.js — the official Next.js integration; loads after
          hydration so it never blocks first paint. */}
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
