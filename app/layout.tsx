import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gpykss Harvester — DOM Scraping & CSV Export Engine",
  description:
    "Internal developer utility for scraping, parsing, and structuring unstructured web directory data into clean CSV matrix files. Powered by FastAPI, BeautifulSoup4, and Pandas inside Vercel Serverless.",
  keywords: [
    "web scraper",
    "CSV export",
    "table parser",
    "BeautifulSoup",
    "FastAPI",
    "Vercel",
  ],
  authors: [{ name: "Godspower John Okon" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#09090b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
