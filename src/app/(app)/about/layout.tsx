import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("about");
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
