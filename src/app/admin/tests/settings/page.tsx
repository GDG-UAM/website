"use client";

import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useSession } from "next-auth/react";
import { ReloadButton } from "@/components/Buttons";

export default function AdminSettingsTestPage() {
  const { settings, isLoading, error, mutate, validationErrors, lastValidationError } =
    useSettings();
  const { data: session, status } = useSession();

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <AdminBreadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tests" },
          { label: "Settings Snapshot" }
        ]}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Settings Provider Snapshot</h1>
        <ReloadButton
          onClick={async () => {
            await mutate();
          }}
          iconSize={20}
        />
      </div>
      <p style={{ marginTop: 0, color: "#555", fontSize: 14 }}>
        Raw values from the settings context and current authenticated user session.
      </p>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Status</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.5 }}>
          <li>
            Settings Loading: <strong>{isLoading ? "true" : "false"}</strong>
          </li>
          <li>
            Settings Error: <strong>{error ? error.message || "yes" : "none"}</strong>
          </li>
          <li>
            Last Validation Error: <strong>{lastValidationError || "none"}</strong>
          </li>
          <li>
            Validation Errors Count: <strong>{validationErrors.length}</strong>
          </li>
          <li>
            Session Status: <strong>{status}</strong>
          </li>
          <li>
            Has User: <strong>{session?.user ? "true" : "false"}</strong>
          </li>
        </ul>
        {validationErrors.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 14 }}>All validation errors</summary>
            <pre
              style={{
                background: "#f9fafb",
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflowX: "auto",
                marginTop: 8
              }}
            >
              {validationErrors.join("\n")}
            </pre>
          </details>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))"
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, minHeight: 220 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>User Session</h2>
          <pre
            style={{
              background: "#111827",
              color: "#e5e7eb",
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 500,
              lineHeight: 1.4,
              margin: 0
            }}
          >
            {session
              ? JSON.stringify(session, null, 2)
              : status === "loading"
                ? "Loading..."
                : "No session"}
          </pre>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, minHeight: 220 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Settings JSON</h2>
          <pre
            style={{
              background: "#111827",
              color: "#e5e7eb",
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 500,
              lineHeight: 1.4,
              margin: 0
            }}
          >
            {settings ? JSON.stringify(settings, null, 2) : isLoading ? "Loading..." : "No data"}
          </pre>
        </div>
      </div>
    </div>
  );
}
