import type { Metadata } from "next";
import "@/app/globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import { getTranslations, getLocale, getMessages } from "next-intl/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AppProviders from "@/components/providers/AppProviders";
import { NextIntlClientProvider } from "next-intl";
import { Open_Sans, Poppins, Roboto, Lexend } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const lexend = Lexend({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("title"),
    description: t("description")
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const flags = (session as SessionWithFlags)?.user?.flags || {};
  const viewAs: "deuteranopia" | "protanopia" | "tritanopia" | null = flags[
    "accessibility-view-as-deuteranopia"
  ]
    ? "deuteranopia"
    : flags["accessibility-view-as-protanopia"]
      ? "protanopia"
      : flags["accessibility-view-as-tritanopia"]
        ? "tritanopia"
        : null;
  const filterId = viewAs ? `cbf-${viewAs}` : null;

  return (
    <html
      lang={locale}
      className={`${openSans.className} ${poppins.className} ${roboto.className} ${lexend.className}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                (() => {
                  try {
                    var raw = localStorage.getItem('accessibilityPrefs');
                    var prefs = raw ? JSON.parse(raw) : {};
                    var doc = document.documentElement;
                    var getSystemReduceMotion = () => {
                      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    };
                    var getSystemHighContrast = () => {
                      return window.matchMedia && (window.matchMedia('(prefers-contrast: more)').matches || window.matchMedia('(forced-colors: active)').matches);
                    };
                    var highContrast = 'highContrast' in prefs ? prefs.highContrast : getSystemHighContrast();
                    var reduceMotion = 'reduceMotion' in prefs ? prefs.reduceMotion : getSystemReduceMotion();
                    var dyslexicFont = 'dyslexicFont' in prefs ? prefs.dyslexicFont : false;
                    var daltonismMode = prefs.daltonismMode || 'none';
                    doc.toggleAttribute('data-contrast', highContrast);
                    doc.toggleAttribute('data-reduce-motion', reduceMotion);
                    doc.toggleAttribute('data-dyslexic-font', dyslexicFont);
                    doc.removeAttribute('data-deuteranopia');
                    doc.removeAttribute('data-protanopia');
                    doc.removeAttribute('data-tritanopia');
                    if (daltonismMode === 'deuteranopia') doc.setAttribute('data-deuteranopia', '');
                    if (daltonismMode === 'protanopia') doc.setAttribute('data-protanopia', '');
                    if (daltonismMode === 'tritanopia') doc.setAttribute('data-tritanopia', '');
                  } catch(e) {}
                })();
              `
          }}
        />
      </head>
      <body style={filterId ? { filter: `url(#${filterId})` } : undefined}>
        {/* Inline SVG filters for color-blindness simulation (view-as flags) */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            {/* Deuteranopia */}
            <filter id="cbf-deuteranopia">
              <feColorMatrix
                type="matrix"
                values="0.625 0.375 0     0 0
                        0.700 0.300 0     0 0
                        0.000 0.300 0.700 0 0
                        0     0     0     1 0"
              />
            </filter>

            {/* Protanopia */}
            <filter id="cbf-protanopia">
              <feColorMatrix
                type="matrix"
                values="0.567 0.433 0     0 0
                        0.558 0.442 0     0 0
                        0.000 0.242 0.758 0 0
                        0     0     0     1 0"
              />
            </filter>

            {/* Tritanopia */}
            <filter id="cbf-tritanopia">
              <feColorMatrix
                type="matrix"
                values="0.950 0.050 0     0 0
                        0.000 0.433 0.567 0 0
                        0.000 0.475 0.525 0 0
                        0     0     0     1 0"
              />
            </filter>
          </defs>
        </svg>
        <StyledComponentsRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AppProviders locale={locale}>
              <Navbar />
              <main>{children}</main>
              <Footer />
            </AppProviders>
          </NextIntlClientProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
