import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("settings");
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
