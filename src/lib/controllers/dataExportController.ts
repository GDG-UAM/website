import JSZip from "jszip";
import { findUserById, setUserDataExportCooldown } from "@/lib/controllers/userController";
import { getUserSettings } from "@/lib/controllers/userSettingsController";
import { listTelemetryForUser } from "@/lib/controllers/telemetryController";

type DataExportResult = {
  arrayBuffer: ArrayBuffer;
  filename: string;
  nextAllowed: Date;
};

type ExportError = Error & { status?: number; nextAvailable?: string };

/**
 * Build a ZIP with the user's data and set a 24h cooldown.
 * Throws an error with status 404 if user not found, or 429 with nextAvailable if on cooldown.
 */
export async function buildUserDataExport(userId: string): Promise<DataExportResult> {
  const user = await findUserById(userId);
  if (!user) {
    const err: ExportError = new Error("Not found");
    err.status = 404;
    throw err;
  }

  const now = Date.now();
  const until = user.downloadDataDisabledUntil?.getTime?.();
  if (typeof until === "number" && until > now) {
    const err: ExportError = new Error("Too Many Requests");
    err.status = 429;
    err.nextAvailable = new Date(until).toISOString();
    throw err;
  }

  const [settings, telemetry] = await Promise.all([
    getUserSettings(userId),
    listTelemetryForUser(userId)
  ]);

  const zip = new JSZip();
  const safeUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image ?? "",
    role: user.role,
    displayName: (user as unknown as { displayName?: string }).displayName ?? null,
    allowAnonUsage: (user as unknown as { allowAnonUsage?: boolean }).allowAnonUsage ?? true,
    showProfilePublicly:
      (user as unknown as { showProfilePublicly?: boolean }).showProfilePublicly ?? false,
    createdAt: (user as unknown as { createdAt?: Date }).createdAt,
    updatedAt: (user as unknown as { updatedAt?: Date }).updatedAt,
    profileHistory:
      (
        user as unknown as {
          profileHistory?: Array<{ name: string; image?: string; changedAt: Date }>;
        }
      ).profileHistory ?? []
  };
  zip.file("user.json", JSON.stringify(safeUser, null, 2));
  if (settings) zip.file("userSettings.json", JSON.stringify(settings, null, 2));
  zip.file("telemetry.json", JSON.stringify(telemetry ?? [], null, 2));

  const arrayBuffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

  const nextAllowed = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await setUserDataExportCooldown(userId, nextAllowed);

  const filename = `my-data-${new Date().toISOString().slice(0, 10)}.zip`;
  return { arrayBuffer, filename, nextAllowed };
}
