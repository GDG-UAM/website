import React from "react";
import { buildSectionMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return buildSectionMetadata("events");
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
