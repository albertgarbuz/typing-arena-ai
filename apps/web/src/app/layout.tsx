import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/manrope/cyrillic-400.css";
import "@fontsource/manrope/cyrillic-500.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/manrope/cyrillic-700.css";
import "@fontsource/manrope/cyrillic-800.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/cyrillic-400.css";
import "@fontsource/jetbrains-mono/cyrillic-500.css";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Typing Arena AI — точность, ритм, свобода", template: "%s · Typing Arena AI" },
  description: "Платформа обучения слепой печати и честных соревнований. Этап 1: знакомство с программой, принципами AI-тренера и методикой расчёта.",
  applicationName: "Typing Arena AI",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080c12" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} /></head>
      <body>
        <a className="skip-link" href="#main-content">Перейти к содержимому</a>
        {children}
      </body>
    </html>
  );
}
