import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { AmbientThemeScript } from "@/lib/script";
import { SITE_URL, STORAGE_KEY } from "@/components/demo/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["wdth"],
  display: "swap",
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const code = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const description =
  "A React provider that switches between light and dark themes based on the ambient light around your user, with system and time-of-day fallbacks.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "react-ambient-light-adaptive-theme: themes that read the room",
  description,
  openGraph: {
    title: "Themes that read the room",
    description,
    url: SITE_URL,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7ebee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1520" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${code.variable}`}
    >
      <head>
        <AmbientThemeScript storageKey={STORAGE_KEY} />
      </head>
      <body>{children}</body>
    </html>
  );
}
