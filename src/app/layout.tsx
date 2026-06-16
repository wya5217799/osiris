import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://osirisai.live";
const SITE_NAME = "烽火 Fanos";
const SITE_TITLE = "烽火 Fanos — 个人情报 / 预警平台｜实时航班、海事、地缘事件与 OSINT 工具";
const SITE_DESCRIPTION = "基于开源 Osiris 改造的个人情报 / 预警平台。在 3D 地球上实时追踪航班、船舶、卫星与全球摄像头；从浏览器运行 Nmap、DNS、WHOIS、SSL 证书分析与威胁情报等 OSINT 工具；汇聚地震、火灾、核设施、网络威胁、地缘冲突等 20+ 实时数据源。";

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | 烽火 Fanos",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    // OSINT Tools - Primary focus
    "OSINT tools", "free OSINT tools", "online OSINT toolkit", "OSINT framework",
    "nmap online", "nmap scanner online", "free nmap scan", "port scanner online",
    "DNS lookup tool", "WHOIS lookup", "reverse DNS", "DNS records",
    "SSL certificate checker", "certificate transparency", "cert lookup",
    "BGP routing lookup", "ASN lookup", "IP geolocation",
    "threat intelligence", "threat intel lookup", "IP reputation check",
    "network reconnaissance", "recon tools", "penetration testing tools",
    "cybersecurity tools", "infosec tools", "security scanner",
    "linux OSINT tools", "kali linux tools online", "OSINT browser tools",
    
    // Intelligence Platform
    "OSINT", "open source intelligence", "intelligence platform", "global intelligence",
    "geospatial intelligence", "GEOINT", "SIGINT", "real-time tracking",
    "palantir alternative", "open source palantir", "intelligence dashboard",
    
    // Tracking & Data
    "flight tracker", "aircraft tracking", "ADS-B tracker", "live flight radar",
    "satellite tracking", "ISS tracker", "space station tracker",
    "CCTV cameras live", "security cameras worldwide", "live cameras",
    "earthquake monitor", "seismic activity", "USGS earthquake",
    "wildfire tracker", "NASA FIRMS", "active fires",
    "nuclear facilities map", "nuclear power plants",
    "severe weather alerts", "weather radar",
    "cyber threats dashboard", "CVE tracker",
    "space weather", "solar storm", "GPS jamming",
    "defense stocks", "commodities tracker",
    
    // Brand
    "osiris", "osirisai", "osirisai.live",
  ],
  authors: [{ name: "Osiris Project", url: SITE_URL }],
  creator: "Osiris Project",
  publisher: "Osiris Project",
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
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "烽火 Fanos — 个人情报 / 预警平台｜实时航班、CCTV、卫星与 OSINT 工具",
    description: "在 3D 地球上实时追踪 1 万+ 航班、卫星与全球 CCTV；从浏览器运行 Nmap、DNS、WHOIS 与威胁情报扫描；20+ 实时情报源。",
    type: "website",
    siteName: SITE_NAME,
    locale: "zh_CN",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "OSIRIS — Open Source Intelligence Platform with Live Tracking & OSINT Tools",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🛰️ 烽火 Fanos — 个人情报 / 预警平台｜实时追踪 + OSINT 工具",
    description: "在 3D 地球上实时追踪全球航班、卫星与 CCTV；从浏览器运行 Nmap、DNS、WHOIS 扫描；20+ 实时情报源。",
    creator: "@simplifaisoul",
    site: "@simplifaisoul",
    images: [`${SITE_URL}/og-image.png`],
  },
  category: "technology",
  classification: "Intelligence & Security",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "OSIRIS",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#06060C",
    "msapplication-config": "none",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OSIRIS — OSINT Toolkit & Intelligence Platform",
  alternateName: ["OSIRIS", "OsirisAI", "Osiris OSINT"],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires a modern web browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Nmap port scanning from the browser — no install required",
    "DNS record lookup (A, AAAA, MX, NS, TXT, CNAME)",
    "WHOIS domain registration lookup",
    "SSL/TLS certificate transparency search",
    "BGP routing & ASN lookup",
    "IP geolocation & threat intelligence",
    "Real-time flight tracking (10,000+ aircraft via ADS-B)",
    "Satellite tracking (2,000+ objects including ISS)",
    "Worldwide CCTV camera monitoring (1,400+ feeds)",
    "Earthquake monitoring (USGS live feed)",
    "Wildfire detection (NASA FIRMS satellite data)",
    "Nuclear facility mapping (worldwide)",
    "Severe weather alerts & tracking",
    "Cyber threat & CVE intelligence",
    "Space weather & solar storm monitoring",
    "GPS jamming detection",
    "Defense & commodity market tracking",
    "SIGINT news aggregation feed",
    "Interactive 3D globe with day/night cycle",
    "Region intelligence dossier reports",
  ],
  screenshot: `${SITE_URL}/og-image.png`,
  author: {
    "@type": "Organization",
    name: "Osiris Project",
    url: SITE_URL,
  },
};

import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="canonical" href={SITE_URL} />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

      </head>
      <body className="antialiased">
        <ErrorBoundary name="OSIRIS Core">
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
