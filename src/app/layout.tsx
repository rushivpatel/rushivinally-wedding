import type { Metadata } from "next";
import { Playfair_Display, Faculty_Glyphic } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AudioPlayer from "@/components/AudioPlayer";
import SiteGate from "@/components/SiteGate";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-primary",
  subsets: ["latin"],
});

const facultyGlyphic = Faculty_Glyphic({
  variable: "--font-secondary",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vinally & Rushi's Wedding",
  description: "Join us as we celebrate our wedding.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${facultyGlyphic.variable} h-full antialiased`}
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
