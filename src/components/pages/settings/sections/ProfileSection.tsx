"use client";
import { api } from "@/lib/eden";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Stack, Typography, TextField, InputAdornment, Avatar, Divider } from "@mui/material";
import { FaExclamationCircle } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useSettings } from "@/lib/settings/SettingsContext";
import Modal from "@/components/Modal";
import { DownloadButton, DeleteButton, CancelButton } from "@/components/Buttons";
import type { ProfileSettings } from "@/lib/validation/settingsSchemas";
import { profileSchema } from "@/lib/validation/settingsSchemas";
import { Section } from "./common";

const socialKeys = ["github", "linkedin", "x", "instagram", "website"] as const;
const socialBaseMap: Record<(typeof socialKeys)[number], string | undefined> = {
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/in/",
  x: "https://x.com/",
  instagram: "https://instagram.com/",
  website: "https://"
};
interface GithubUserPreview {
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  html_url?: string | null;
  bio?: string | null;
}
function deriveUsername(key: (typeof socialKeys)[number], stored: string | undefined): string {
  if (!stored) return "";
  const base = socialBaseMap[key] || "";
  const norm = (s: string) => s.replace(/^https?:\/\/(www\.)?/, "");
  const baseHostPath = norm(base);
  const incoming = norm(stored);
  if (incoming.startsWith(baseHostPath)) {
    const rest = incoming.slice(baseHostPath.length);
    const trimmed = rest.startsWith("/") ? rest.slice(1) : rest;
    if (key === "website") return trimmed;
    return trimmed.split(/[/?#]/)[0] || "";
  }
  return stored;
}
function assembleValue(key: (typeof socialKeys)[number], username: string): string {
  const base = socialBaseMap[key];
  return username ? base + username : "";
}
function equalishUrl(a: string, b: string): boolean {
  const trimSlash = (p: string) => (p.endsWith("/") && p !== "/" ? p.replace(/\/+$/, "") : p);
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const hostA = ua.hostname.replace(/^www\./, "").toLowerCase();
    const hostB = ub.hostname.replace(/^www\./, "").toLowerCase();
    const pathA = trimSlash(ua.pathname || "/");
    const pathB = trimSlash(ub.pathname || "/");
    return hostA === hostB && pathA === pathB;
  } catch {
    return trimSlash(a) === trimSlash(b);
  }
}
function isGenericSiteTitle(title: string | undefined | null): boolean {
  if (!title) return true;
  const s = title.trim().toLowerCase();
  return s === "instagram" || s === "linkedin" || s === "x" || s === "twitter" || s === "github";
}

const ProfileSection: React.FC<{
  value?: ProfileSettings;
  onChange: (v: Partial<ProfileSettings>) => void;
  t: (k: string, opts?: Record<string, string | number | Date>) => string;
  onboarding?: boolean;
  hideAccountButtons?: boolean;
}> = ({ value, onChange, t, onboarding = false, hideAccountButtons = false }) => {
  const { data: session } = useSession();
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const showFullMeta = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["settings-show-full-metadata"]
  );
  const { settings: fullSettings, mutate } = useSettings();
  type ProfileMeta = { url?: string; title?: string; description?: string; icon?: string | null };
  type WithPreviews = { previews?: { profile?: Record<string, ProfileMeta | null> } };

  const [name, setName] = useState(value?.displayName || "");
  const [bio, setBio] = useState(value?.shortBio || "");
  const [socials, setSocials] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    socialKeys.forEach((k) => (o[k] = deriveUsername(k, value?.[k] as string | undefined)));
    return o;
  });
  // Track dirty fields so we don't override user input with late server responses
  const dirtyRef = useRef<{
    name: boolean;
    bio: boolean;
    socials: Record<(typeof socialKeys)[number], boolean>;
  }>({
    name: false,
    bio: false,
    socials: socialKeys.reduce(
      (acc, k) => ({ ...acc, [k]: false }),
      {} as Record<(typeof socialKeys)[number], boolean>
    )
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorsRef = useRef(errors);
  const originalRef = useRef<ProfileSettings | undefined>(value);
  const [cachedPreviews, setCachedPreviews] = useState<
    Partial<Record<(typeof socialKeys)[number], ProfileMeta | null>>
  >({});
  const [gh, setGh] = useState<{
    status: "idle" | "loading" | "success" | "error";
    data?: GithubUserPreview;
  }>({ status: "idle" });

  const [downloading, setDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [cooldownUntil, setCooldownUntil] = useState<string | undefined>(
    () =>
      (session?.user as unknown as { downloadDataDisabledUntil?: string })
        ?.downloadDataDisabledUntil
  );
  useEffect(() => {
    const iso = (session?.user as unknown as { downloadDataDisabledUntil?: string })
      ?.downloadDataDisabledUntil;
    setCooldownUntil(iso);
  }, [session?.user]);
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const untilMs = cooldownUntil ? Date.parse(cooldownUntil) : 0;
    return Math.max(0, untilMs - Date.now());
  });
  useEffect(() => {
    const untilMs = cooldownUntil ? Date.parse(cooldownUntil) : 0;
    const end = Math.max(0, untilMs);
    const initial = Math.max(0, end - Date.now());
    setRemainingMs(initial);
    if (initial <= 0) return;
    const interval = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      setRemainingMs((prev) => (prev !== left ? left : prev));
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);
  const onCooldown = remainingMs > 0;
  const formatHHMMSS = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  const downloadLabel = onCooldown
    ? t("profile.data.downloadBlockedTimer", { remaining: formatHHMMSS(remainingMs) })
    : t("profile.data.download");

  const formatProfileIssue = useCallback(
    (key: string, message: string, code: string) => {
      if (key === "displayName" && code === "too_big") return t("profile.errors.displayNameMax");
      if (key === "shortBio" && code === "too_big") return t("profile.errors.shortBioMax");
      if (message.toLowerCase().includes("url")) return t("profile.errors.invalidUrl");
      return message;
    },
    [t]
  );

  const validateSingle = useCallback(
    (field: keyof ProfileSettings, val: unknown): string | null => {
      if (val === "") return null;
      const picked = profileSchema.pick({ [field]: true } as Record<keyof ProfileSettings, true>);
      const res = picked.safeParse({ [field]: val });
      if (!res.success) {
        const iss = res.error.issues[0];
        return formatProfileIssue(field as string, iss.message, iss.code);
      }
      return null;
    },
    [formatProfileIssue]
  );

  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);
  useEffect(() => {
    if (!value) return;
    const currentErrors = errorsRef.current;
    if (!dirtyRef.current.name || value.displayName === name) {
      setName((prev) => (currentErrors.displayName ? prev : value.displayName || ""));
      if (value.displayName === name) dirtyRef.current.name = false;
    }
    if (!dirtyRef.current.bio || value.shortBio === bio) {
      setBio((prev) => (currentErrors.shortBio ? prev : value.shortBio || ""));
      if (value.shortBio === bio) dirtyRef.current.bio = false;
    }
    const incoming: Record<string, string> = {};
    socialKeys.forEach((k) => (incoming[k] = deriveUsername(k, value?.[k] as string | undefined)));
    setSocials((prev) => {
      const next: Record<string, string> = { ...prev };
      socialKeys.forEach((k) => {
        if (!currentErrors[k] && (!dirtyRef.current.socials[k] || incoming[k] === prev[k])) {
          next[k] = incoming[k];
          if (incoming[k] === prev[k]) dirtyRef.current.socials[k] = false;
        }
      });
      return next;
    });
    originalRef.current = value;
  }, [value, name, bio]);

  const commit = useCallback(() => {
    const orig = originalRef.current;
    if (!orig) {
      const candidates: Partial<ProfileSettings> = {
        displayName: name.trim(),
        shortBio: bio.trim(),
        ...Object.fromEntries(Object.entries(socials).map(([k, v]) => [k, (v as string).trim()]))
      };
      const nextErrors: Record<string, string> = {};
      const patch: Partial<ProfileSettings> = {};
      Object.entries(candidates).forEach(([k, v]) => {
        const raw = ((v as string) || "").trim();
        const candidate = (socialKeys as readonly string[]).includes(k)
          ? assembleValue(k as (typeof socialKeys)[number], raw)
          : raw;
        const err = validateSingle(k as keyof ProfileSettings, candidate);
        if (err) nextErrors[k] = err;
        else (patch as Record<string, unknown>)[k] = candidate as unknown;
      });
      setErrors(nextErrors);
      if (Object.keys(patch).length) onChange(patch);
      return;
    }
    const patch: Partial<ProfileSettings> = {};
    const norm = (v?: string | null) => (v ? v.trim() : "");
    if (norm(name) !== norm(orig.displayName)) {
      const candidate = name.trim();
      const err = validateSingle("displayName", candidate);
      if (err) setErrors((e) => ({ ...e, displayName: err }));
      else {
        setErrors((e) => {
          const { displayName, ...rest } = e;
          void displayName;
          return rest;
        });
        patch.displayName = candidate;
      }
    }
    if (norm(bio) !== norm(orig.shortBio)) {
      const candidate = bio.trim();
      const err = validateSingle("shortBio", candidate);
      if (err) setErrors((e) => ({ ...e, shortBio: err }));
      else {
        setErrors((e) => {
          const { shortBio, ...rest } = e;
          void shortBio;
          return rest;
        });
        patch.shortBio = candidate;
      }
    }
    (socialKeys as readonly string[]).forEach((k) => {
      const curr = assembleValue(k as (typeof socialKeys)[number], (socials[k] || "").trim());
      const prev = (orig as Record<string, string | undefined>)[k] || "";
      if ((curr || "") !== (prev || "")) {
        const err = validateSingle(k as keyof ProfileSettings, curr);
        if (err) setErrors((e) => ({ ...e, [k]: err }));
        else {
          setErrors((e) => {
            const clone = { ...(e as Record<string, string>) };
            delete (clone as Record<string, string>)[k];
            return clone;
          });
          (patch as Record<string, string>)[k] = curr;
        }
      }
    });
    if (Object.keys(patch).length) onChange(patch);
  }, [name, bio, socials, onChange, validateSingle]);

  // GitHub user lookup for preview (client-only)
  useEffect(() => {
    const handle = setTimeout(() => commit(), 1000);
    return () => clearTimeout(handle);
  }, [name, bio, socials, commit]);

  useEffect(() => {
    const username = (socials.github || "").trim();
    if (!username) {
      setGh({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        setGh({ status: "loading" });
        const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
        if (!res.ok) {
          setGh({ status: "error" });
          return;
        }
        const data = (await res.json()) as GithubUserPreview;
        setGh({ status: "success", data });
      } catch (e: unknown) {
        if (
          e &&
          typeof e === "object" &&
          "name" in e &&
          (e as { name?: string }).name === "AbortError"
        )
          return;
        setGh({ status: "error" });
      }
    })();
    return () => controller.abort();
  }, [socials.github]);

  useEffect(() => {
    const incoming = (fullSettings as unknown as WithPreviews | null)?.previews?.profile;
    if (!incoming) return;
    setCachedPreviews((prev) => {
      const next = { ...prev };
      (Object.keys(incoming) as (typeof socialKeys)[number][]).forEach((k) => {
        if (k === "github") return;
        next[k] = incoming[k] ?? null;
      });
      if (Object.prototype.hasOwnProperty.call(next, "github"))
        delete (next as Partial<Record<(typeof socialKeys)[number], ProfileMeta | null>>).github;
      return next;
    });
  }, [fullSettings]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await api.settings.get({ query: { previews: "1" } });
        if (error) return;
        mutate(async () => data, { revalidate: false });
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = useCallback(
    (key: (typeof socialKeys)[number]) => (e: React.ClipboardEvent<HTMLInputElement>) => {
      const txt = e.clipboardData.getData("text/plain");
      if (!txt) return;
      const cleaned = deriveUsername(key, txt.trim());
      if (cleaned !== txt.trim()) {
        e.preventDefault();
        setSocials((s) => ({ ...s, [key]: cleaned }));
      }
    },
    []
  );

  const [downloadingState] = useState({});
  void downloadingState; // satisfy linter for unused temporary

  return (
    <>
      <Section title={t("profile.displayName")}>
        <TextField
          size="small"
          fullWidth
          value={name}
          placeholder={session?.user?.name || t("profile.placeholders.name")}
          onChange={(e) => {
            dirtyRef.current.name = true;
            setName(e.target.value);
          }}
          onBlur={commit}
          error={!!errors.displayName}
          helperText={errors.displayName}
          slotProps={{
            input: {
              endAdornment: errors.displayName ? (
                <FaExclamationCircle color="var(--settings-input-error)" size={16} />
              ) : undefined
            }
          }}
        />
      </Section>
      {!onboarding && (
        <>
          <Section title={t("profile.shortBio")}>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              value={bio}
              placeholder={t("profile.placeholders.bio")}
              onChange={(e) => {
                dirtyRef.current.bio = true;
                setBio(e.target.value);
              }}
              onBlur={commit}
              error={!!errors.shortBio}
              helperText={errors.shortBio}
              style={{ background: "var(--color-white)" }}
              InputProps={{
                endAdornment: errors.shortBio ? (
                  <FaExclamationCircle color="var(--settings-input-error)" size={16} />
                ) : undefined
              }}
            />
          </Section>
          <Section title={t("profile.socialLinks")}>
            <Stack spacing={1.2}>
              {socialKeys.map((k) => (
                <React.Fragment key={k}>
                  <TextField
                    size="small"
                    fullWidth
                    value={socials[k]}
                    placeholder={
                      socialBaseMap[k]
                        ? k === "website"
                          ? t(`profile.placeholders.website`).replace(/^https?:\/\//, "")
                          : "username"
                        : t(`profile.placeholders.${k}`)
                    }
                    onChange={(e) => {
                      dirtyRef.current.socials[k] = true;
                      setSocials((s) => ({ ...s, [k]: e.target.value }));
                    }}
                    onPaste={handlePaste(k)}
                    onBlur={commit}
                    error={!!errors[k]}
                    helperText={errors[k]}
                    style={{ background: "var(--color-white)" }}
                    InputProps={{
                      startAdornment: socialBaseMap[k] ? (
                        <InputAdornment position="start" data-no-ai-translate>
                          {socialBaseMap[k]}
                        </InputAdornment>
                      ) : undefined,
                      endAdornment: errors[k] ? (
                        <FaExclamationCircle color="var(--settings-input-error)" size={16} />
                      ) : undefined
                    }}
                  />
                  {k === "github" && gh.status === "success" && gh.data && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        border: "1px solid var(--settings-preview-box-border)",
                        borderLeft: "4px solid var(--settings-preview-box-border-accent)",
                        borderRadius: 1,
                        p: 1,
                        background: "var(--color-white)"
                      }}
                      data-no-ai-translate
                    >
                      <Avatar
                        src={gh.data.avatar_url || undefined}
                        alt={gh.data.login}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {gh.data.name || gh.data.login}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          @{gh.data.login}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {(() => {
                    const metaEntry = cachedPreviews[k];
                    if (typeof metaEntry === "undefined") return null;
                    const currentUrl = assembleValue(k, socials[k] || "");
                    const meta: ProfileMeta | null = metaEntry as ProfileMeta | null;
                    const url = meta?.url || currentUrl;
                    if (meta?.url && !equalishUrl(meta.url, currentUrl)) return null;
                    const showError =
                      meta === null || !meta?.title || isGenericSiteTitle(meta.title);
                    if (showError && !showFullMeta) return null;
                    return (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: showError ? "stretch" : "center",
                          gap: 1,
                          border: "1px solid var(--settings-preview-box-border)",
                          borderLeft: "4px solid var(--settings-preview-box-border-accent)",
                          borderRadius: 1,
                          p: 1,
                          color: "var(--settings-socials-meta-text)",
                          background: "var(--color-white)"
                        }}
                        data-no-ai-translate
                      >
                        {!showError && meta?.icon && (
                          <Box
                            component="img"
                            src={meta.icon}
                            alt=""
                            sx={{ width: 20, height: 20, borderRadius: 0.75, flexShrink: 0 }}
                          />
                        )}
                        <Box sx={{ minWidth: 0, width: "100%" }}>
                          {showError ? (
                            <Box
                              component="pre"
                              sx={{
                                m: 0,
                                p: 0,
                                fontSize: 12,
                                whiteSpace: "pre-wrap",
                                background: "var(--color-white)",
                                border: "none",
                                color: "var(--foreground)"
                              }}
                            >
                              {JSON.stringify(meta ?? { url }, null, 2)}
                            </Box>
                          ) : (
                            <>
                              <Typography variant="caption" noWrap title={url}>
                                {meta?.title || url}
                              </Typography>
                              {meta?.description && (
                                <Typography variant="caption" sx={{ display: "block" }} noWrap>
                                  {meta.description}
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>
                      </Box>
                    );
                  })()}
                </React.Fragment>
              ))}
            </Stack>
          </Section>
          {!hideAccountButtons && (
            <>
              <Divider />
              <Section title={t("profile.data.section")}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <DownloadButton
                    disabled={downloading || onCooldown}
                    onClick={async () => {
                      if (downloading || onCooldown) return;
                      try {
                        setDownloading(true);
                        const { data, error, response } = await api.users.export.get();

                        if (error) {
                          if (error.status === 429) {
                            const j = error.value as { nextAvailable?: string };
                            if (j?.nextAvailable) setCooldownUntil(j.nextAvailable);
                          }
                        } else if (data) {
                          // data is Blob/ArrayBuffer
                          const blob = new Blob([data]);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `my-data-${new Date().toISOString().slice(0, 10)}.zip`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                          const headerNext =
                            response.headers.get("X-Data-Export-Next-Allowed") || undefined;
                          if (headerNext) setCooldownUntil(headerNext);
                        }
                      } finally {
                        setDownloading(false);
                      }
                    }}
                    confirmationDuration={2000}
                    showSpinner
                  >
                    {downloadLabel}
                  </DownloadButton>
                  <DeleteButton
                    confirmationDuration={5000}
                    onClick={async () => {
                      setShowDeleteModal(true);
                      try {
                        const { data } = await api.csrf.get();
                        if (data?.token) setCsrfToken(data.token);
                      } catch {}
                    }}
                  >
                    {t("profile.data.delete")}
                  </DeleteButton>
                </div>
              </Section>
              <Modal
                isOpen={showDeleteModal}
                onClose={() => (!deleting ? setShowDeleteModal(false) : undefined)}
                closeButtonColor="primary"
                title={t("profile.data.deleteConfirm.title")}
                width="sm"
                buttons={[
                  <CancelButton
                    key="cancel"
                    color="primary"
                    onClick={() => setShowDeleteModal(false)}
                  />,
                  <DeleteButton
                    key="confirm"
                    onClick={async () => {
                      if (deleting) return;
                      setDeleting(true);
                      try {
                        let token = csrfToken;
                        if (!token) {
                          try {
                            const { data } = await api.csrf.get();
                            if (data?.token) {
                              token = data.token;
                              setCsrfToken(data.token);
                            }
                          } catch {}
                        }
                        const { error } = await api.users.delete(null, {
                          headers: { "x-csrf-token": token || "" }
                        });

                        if (!error) {
                          try {
                            const { signOut } = await import("next-auth/react");
                            await signOut({ callbackUrl: "/" });
                          } catch {
                            window.location.href = "/";
                          }
                        }
                      } finally {
                        setDeleting(false);
                        setShowDeleteModal(false);
                      }
                    }}
                  />
                ]}
              >
                <Typography variant="body1">{t("profile.data.deleteConfirm.body")}</Typography>
              </Modal>
            </>
          )}
        </>
      )}
    </>
  );
};

export default ProfileSection;
