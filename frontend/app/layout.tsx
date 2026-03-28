import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const themeInitScript = `
(function(){
  try {
    var d = document.documentElement;
    var m = window.matchMedia('(prefers-color-scheme: dark)');
    var t = localStorage.getItem('rr-theme');
    if (t === 'dark') { d.classList.add('dark'); d.style.colorScheme = 'dark'; }
    else if (t === 'light') { d.classList.remove('dark'); d.style.colorScheme = 'light'; }
    else {
      if (m.matches) { d.classList.add('dark'); d.style.colorScheme = 'dark'; }
      else { d.classList.remove('dark'); d.style.colorScheme = 'light'; }
    }
  } catch (e) {}
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Ranker",
  description:
    "Upload job descriptions and resumes to parse with AI and rank candidates by fit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Inline script avoids next/script beforeInteractive + RSC manifest bugs (Next 15). */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
