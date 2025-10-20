import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("contact");
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
