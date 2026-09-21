import type { Metadata } from "next";
import { Playfair_Display, Google_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import SiteGate from "@/components/SiteGate";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-primary",
  subsets: ["latin"],
});

const googleSans = Google_Sans({
  variable: "--font-secondary",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vinallyrushi.com"),
  title: "Vinally & Rushi's Wedding",
  description: "Join us as we celebrate our wedding.",
  openGraph: {
    title: "Vinally & Rushi's Wedding",
    description: "Join us as we celebrate our wedding.",
    url: "/",
    siteName: "Vinally & Rushi's Wedding",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vinally & Rushi's Wedding",
    description: "Join us as we celebrate our wedding.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${googleSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-secondary">
        <SiteGate>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AudioPlayer />
        </SiteGate>
      </body>
    </html>
  );
}
