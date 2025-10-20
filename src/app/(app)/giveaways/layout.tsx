import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("giveaways");
}

export default function GiveawaysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
