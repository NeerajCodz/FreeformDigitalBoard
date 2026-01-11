import type { Metadata } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "Freeform Digital Board",
    template: "%s | Freeform Digital Board",
  },
  description:
    "A free-form digital board for creating, organizing, and saving text or image pins with tagging, grouping, zooming, and snapshots.",
  keywords: [
    "whiteboard",
    "canvas",
    "pins",
    "digital board",
    "productivity",
    "NeerajCodz",
  ],
  authors: [{ name: "NeerajCodz" }],
  creator: "NeerajCodz",
  publisher: "NeerajCodz",
  metadataBase: new URL("https://github.com/NeerajCodz/Digital-Circuit-Simulator"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/NeerajCodz/Digital-Circuit-Simulator",
    title: "Freeform Digital Board | NeerajCodz",
    description:
      "A canvas-first pin board with text and image notes, tagging, grouping, and snapshots.",
    siteName: "Freeform Digital Board",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Digital Circuit Simulator - Interactive Logic Gate Design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freeform Digital Board",
    description: "Create, organize, and save text or image pins on a free-form board.",
    images: ["/logo.svg"],
    creator: "@neerajcodz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ClerkProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
