"use client";

import { ButtonProvider } from "@/components/Buttons";
import { ToastProvider } from "@/components/Toast";
import AuthSessionProvider from "./SessionProvider";
import { AiTranslationProvider } from "@/components/ai/translation/AiTranslationProvider";
import { SettingsProvider } from "@/lib/settings/SettingsContext";
import AccessibilityProvider from "./AccessibilityProvider";
import AppThemeProvider from "./AppThemeProvider";
import TelemetryInitializer from "./TelemetryInitializer";
import { EventsCacheProvider } from "./EventsCacheProvider";
import ColorBlindViewFlagProvider from "./ColorBlindViewFlagProvider";
// import dynamic from "next/dynamic";
// import { useSettings } from "@/lib/settings/SettingsContext";
import React from "react";
// import { usePathname } from "next/navigation";

// const OnboardingModal = dynamic(() => import("@/components/onboarding/OnboardingModal"), {
//   ssr: false
// });

const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const { mutate } = useSettings();
  // const [open, setOpen] = React.useState(false);
  // const [checked, setChecked] = React.useState(false);
  // const pathname = usePathname();
  // React.useEffect(() => {
  //   if (pathname === "/logout") {
  //     setChecked(true);
  //     return;
  //   }
  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       const res = await fetch("/api/settings/onboarding", { credentials: "include" });
  //       if (!res.ok) return;
  //       const data = (await res.json()) as { required?: boolean };
  //       if (!cancelled) {
  //         setOpen(!!data.required);
  //         setChecked(true);
  //       }
  //     } catch {
  //       setChecked(true);
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [pathname]);

  // return (
  //   <>
  //     {children}
  //     {checked && pathname !== "/logout" && (
  //       <OnboardingModal
  //         open={open}
  //         onComplete={async () => {
  //           setOpen(false);
  //           try {
  //             await mutate();
  //           } catch {}
  //         }}
  //       />
  //     )}
  //   </>
  // );
  return children;
};

interface AppProvidersProps {
  children: React.ReactNode;
  locale: string;
}

function AppProviders({ children, locale }: AppProvidersProps) {
  return (
    <AuthSessionProvider>
      <AiTranslationProvider sourceLang={locale}>
        <AppThemeProvider>
          <SettingsProvider>
            <AccessibilityProvider>
              <ButtonProvider>
                <ToastProvider>
                  <EventsCacheProvider>
                    <TelemetryInitializer />
                    <ColorBlindViewFlagProvider />
                    <OnboardingGate>{children}</OnboardingGate>
                  </EventsCacheProvider>
                </ToastProvider>
              </ButtonProvider>
            </AccessibilityProvider>
          </SettingsProvider>
        </AppThemeProvider>
      </AiTranslationProvider>
    </AuthSessionProvider>
  );
}

export default AppProviders;
