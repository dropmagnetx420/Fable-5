import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { AppToaster } from "@/components/providers/toaster";
import { ServiceWorkerRegistrar } from "@/components/providers/service-worker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bangla = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bangla",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sitol Chaya — Mess Manager",
  description: "Shared mess expense & meal management for 6 members.",
  applicationName: "Sitol Chaya",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sitol Chaya",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: { url: "/icons/icon.svg", type: "image/svg+xml" },
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1414" },
  ],
};

// Runs before paint to set the theme class and avoid a flash of the wrong theme.
const noFlashScript = `
(function(){
  try {
    var t = localStorage.getItem('chaya-theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    var loc = localStorage.getItem('chaya-locale');
    if (loc === 'bn' || loc === 'en') root.lang = loc;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={`${inter.variable} ${bangla.variable} font-sans`}>
        <ThemeProvider>
          <I18nProvider>
            {children}
            <AppToaster />
            <ServiceWorkerRegistrar />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
