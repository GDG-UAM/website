"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import QRCode from "qrcode";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  HideButton,
  ViewButton,
  PlayButton,
  PauseButton,
  SaveButton,
  RandomButton,
  ReloadButton,
  BackButton
} from "@/components/Buttons";
import { RadioGroup, FormControlLabel, Radio, TextField } from "@mui/material";
import { subscribeToGiveaway, getSocket } from "@/lib/realtime/client";
import { baseURL } from "@/lib/config";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

// Types for winners API responses
type WinnerPublicDetail = {
  entryId: string;
  userId?: string | null;
  anonId?: string | null;
  displayName?: string;
  name?: string;
  image?: string;
};

type WinnerGetResponse = {
  winners?: Array<string | { toString(): string }>;
  winnerProofs?: Array<{
    position: number;
    seed: string;
    entryId: string | { toString(): string };
    at: string | Date;
    inputHash: string;
    inputSize: number;
  }>;
  winnersDetails?: WinnerPublicDetail[];
};

export default function AdminGiveawayViewPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const publicUrl = id ? `${baseURL}/giveaways/${id}` : "";
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("admin.giveaways.view");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [status, setStatus] = useState<"draft" | "active" | "paused" | "closed" | "cancelled">(
    "draft"
  );
  const [startAt, setStartAt] = useState<string | null>(null);
  const [endAt, setEndAt] = useState<string | null>(null);
  const [durationS, setDurationS] = useState<number | null>(null);
  const [remainingS, setRemainingS] = useState<number | null>(null);
  const [endAtInput, setEndAtInput] = useState<string>(""); // datetime-local
  const [durationInput, setDurationInput] = useState<string>(""); // seconds
  const [mode, setMode] = useState<"end" | "duration">("duration");
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showWinners, setShowWinners] = useState(false);
  const [winners, setWinners] = useState<string[] | null>(null);
  const [winnersDetails, setWinnersDetails] = useState<WinnerPublicDetail[] | null>(null);
  const [winnerProofs, setWinnerProofs] = useState<
    Array<{
      position: number;
      seed: string;
      entryId: string;
      at: string;
      inputHash: string;
      inputSize: number;
    }>
  >([]);
  const [revealMask, setRevealMask] = useState<boolean[]>([]);
  const [maxWinners, setMaxWinners] = useState<number>(1);
  const defaultAvatar = "/logo/196x196.webp"; // fallback image from public assets

  const qrSize = isFullscreen ? 360 : 240;
  const qrCornerSize = isFullscreen ? 150 : 100;

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed", err);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    QRCode.toDataURL(publicUrl, { margin: 1, width: 320 })
      .then((url) => {
        if (mounted) setQrSrc(url);
      })
      .catch(() => {
        if (mounted) setQrSrc(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, publicUrl]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Subscribe to live entry count
  useEffect(() => {
    if (!id) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      // warm up socket endpoint in Next.js pages router before connecting
      try {
        await fetch("/api/socket");
      } catch {}

      if (cancelled) return;
      try {
        console.log("[socket] Subscribing to giveaway room", id);
        unsubscribe = subscribeToGiveaway(id, (count) => {
          try {
            console.log("[socket] UI setEntryCount =>", count);
          } catch {}
          setEntryCount(count);
        });
      } catch {}

      // fetch initial count when entering the room
      try {
        const res = await fetch(`/api/admin/giveaways/${id}/count`, { cache: "no-store" });
        if (res.ok) {
          const j = (await res.json()) as { count?: number };
          if (!cancelled && typeof j.count === "number") setEntryCount(j.count);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  // Load initial giveaway config and subscribe to config/status updates
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      // initial fetch
      try {
        const res = await fetch(`/api/admin/giveaways/${id}`, { cache: "no-store" });
        if (res.ok) {
          const g = await res.json();
          if (cancelled) return;
          if (g?.status) setStatus(g.status);
          setStartAt(g?.startAt ?? null);
          setEndAt(g?.endAt ?? null);
          setDurationS(typeof g?.durationS === "number" ? g.durationS : null);
          setRemainingS(typeof g?.remainingS === "number" ? g.remainingS : null);
          // If no endAt configured, default the input to current moment
          setEndAtInput(
            g?.endAt
              ? toLocalDateTimeInput(g.endAt)
              : toLocalDateTimeInput(new Date().toISOString())
          );
          setDurationInput(g?.durationS ? String(g.durationS) : "");
          setMode(g?.endAt ? "end" : "duration");
          if (typeof g?.maxWinners === "number" && g.maxWinners > 0) {
            setMaxWinners(g.maxWinners);
          } else {
            setMaxWinners(1);
          }
        }
      } catch {}

      // socket listeners
      const s = getSocket();
      type ConfigPayload = {
        id?: string;
        status?: "draft" | "active" | "paused" | "closed" | "cancelled";
        startAt?: string | null;
        endAt?: string | null;
        durationS?: number | null;
        remainingS?: number | null;
      };
      const onConfig = (payload: ConfigPayload) => {
        // room already scopes; payload includes id for convenience
        if (payload?.status) setStatus(payload.status);
        if (payload?.startAt !== undefined) setStartAt(payload.startAt ?? null);
        if (payload?.endAt !== undefined) {
          setEndAt(payload.endAt ?? null);
          setEndAtInput(payload.endAt ? toLocalDateTimeInput(payload.endAt) : "");
        }
        if (payload?.durationS !== undefined) {
          setDurationS(typeof payload.durationS === "number" ? payload.durationS : null);
          setDurationInput(payload.durationS ? String(payload.durationS) : "");
        }
        if (payload?.remainingS !== undefined) {
          setRemainingS(typeof payload.remainingS === "number" ? payload.remainingS : null);
        }
      };
      type StatusPayload = { id?: string; status?: ConfigPayload["status"] };
      const onStatus = (payload: StatusPayload) => {
        if (payload?.status) setStatus(payload.status);
      };
      s.on("giveaway:config", onConfig);
      s.on("giveaway:status", onStatus);

      return () => {
        s.off("giveaway:config", onConfig);
        s.off("giveaway:status", onStatus);
      };
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Timer ticker
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Compute remaining time based on endAt or startAt + durationS
  const remainingMs = React.useMemo(() => {
    if (mode === "end") {
      const end = endAt ? Date.parse(endAt) : null;
      return end ? Math.max(0, end - nowMs) : null;
    }
    // duration mode
    if (status === "paused") {
      return remainingS != null ? remainingS * 1000 : null;
    }
    if (startAt && (remainingS != null || durationS != null)) {
      const base = remainingS ?? durationS!;
      return Math.max(0, Date.parse(startAt) + base * 1000 - nowMs);
    }
    return null;
  }, [nowMs, endAt, startAt, durationS, remainingS, mode, status]);

  const formattedRemaining = React.useMemo(() => {
    if (remainingMs == null) return "—";
    return formatDuration(remainingMs);
  }, [remainingMs]);

  // Auto-trigger winners view when timer hits zero
  useEffect(() => {
    if (remainingMs === 0 && !showWinners) {
      setShowWinners(true);
    }
  }, [remainingMs, showWinners]);

  // Load winners when panel opens
  useEffect(() => {
    if (!id || !showWinners) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/giveaways/${id}/winners`, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as WinnerGetResponse;
        if (cancelled) return;
        const ws: string[] = (Array.isArray(j.winners) ? j.winners : []).map((w) =>
          typeof w === "string" ? w : ((w as { toString?: () => string })?.toString?.() ?? "")
        );
        setWinners(ws);
        setWinnersDetails(Array.isArray(j.winnersDetails) ? j.winnersDetails : null);
        setWinnerProofs(
          (Array.isArray(j.winnerProofs) ? j.winnerProofs : []).map((p) => ({
            position: p.position,
            seed: p.seed,
            entryId: typeof p.entryId === "string" ? p.entryId : p.entryId.toString(),
            at: typeof p.at === "string" ? p.at : new Date(p.at).toISOString(),
            inputHash: p.inputHash,
            inputSize: p.inputSize
          }))
        );
        setRevealMask((Array.isArray(j.winnersDetails) ? j.winnersDetails : ws).map(() => false));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [id, showWinners]);

  const drawWinners = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/giveaways/${id}/winners`, {
        method: "POST",
        headers: await withCsrfHeaders()
      });
      if (!res.ok) return;
      const j = (await res.json()) as WinnerGetResponse;
      const ws: string[] = (Array.isArray(j.winners) ? j.winners : []).map((w) =>
        typeof w === "string" ? w : ((w as { toString?: () => string })?.toString?.() ?? "")
      );
      setWinners(ws);
      setWinnersDetails(Array.isArray(j.winnersDetails) ? j.winnersDetails : null);
      setWinnerProofs(
        (Array.isArray(j.winnerProofs) ? j.winnerProofs : []).map((p) => ({
          position: p.position,
          seed: p.seed,
          entryId: typeof p.entryId === "string" ? p.entryId : p.entryId.toString(),
          at: typeof p.at === "string" ? p.at : new Date(p.at).toISOString(),
          inputHash: p.inputHash,
          inputSize: p.inputSize
        }))
      );
      setRevealMask((Array.isArray(j.winnersDetails) ? j.winnersDetails : ws).map(() => false));
    } catch {}
  }, [id]);

  const reroll = useCallback(
    async (idx: number) => {
      if (!id) return;
      try {
        const res = await fetch(`/api/admin/giveaways/${id}/winners`, {
          method: "PATCH",
          headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ position: idx })
        });
        if (!res.ok) return;
        const j = (await res.json()) as WinnerGetResponse;
        const ws: string[] = (Array.isArray(j.winners) ? j.winners : []).map((w) =>
          typeof w === "string" ? w : ((w as { toString?: () => string })?.toString?.() ?? "")
        );
        setWinners(ws);
        setWinnersDetails(Array.isArray(j.winnersDetails) ? j.winnersDetails : null);
        setWinnerProofs(
          (Array.isArray(j.winnerProofs) ? j.winnerProofs : []).map((p) => ({
            position: p.position,
            seed: p.seed,
            entryId: typeof p.entryId === "string" ? p.entryId : p.entryId.toString(),
            at: typeof p.at === "string" ? p.at : new Date(p.at).toISOString(),
            inputHash: p.inputHash,
            inputSize: p.inputSize
          }))
        );
        setRevealMask((prev) => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      } catch {}
    },
    [id]
  );

  // Actions: pause/resume and save config
  const togglePause = useCallback(async () => {
    if (!id) return;
    if (mode === "end") return; // not pausable in endAt mode
    const next = status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/admin/giveaways/${id}`, {
        method: "PATCH",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) return;
      const updated = await res.json();
      if (updated?.status) setStatus(updated.status);
    } catch {}
  }, [id, status, mode]);

  const saveConfig = useCallback(async () => {
    if (!id) return;
    const patch: { durationS?: number | null; endAt?: string | null; mode?: "end" | "duration" } =
      {};
    if (mode === "end") {
      patch.endAt = endAtInput !== "" ? new Date(endAtInput).toISOString() : null;
      patch.durationS = null;
    } else {
      patch.durationS = durationInput !== "" ? Number(durationInput) || 0 : null;
      patch.endAt = null;
    }
    patch.mode = mode;
    try {
      const res = await fetch(`/api/admin/giveaways/${id}`, {
        method: "PATCH",
        headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(patch)
      });
      if (!res.ok) return;
      const updated = await res.json();
      if (updated?.durationS !== undefined)
        setDurationS(typeof updated.durationS === "number" ? updated.durationS : null);
      if (updated?.endAt !== undefined) {
        setEndAt(updated.endAt ?? null);
        setEndAtInput(updated.endAt ? toLocalDateTimeInput(updated.endAt) : "");
      }
      if (updated?.remainingS !== undefined)
        setRemainingS(typeof updated.remainingS === "number" ? updated.remainingS : null);
      if (updated?.status) setStatus(updated.status);
    } catch {}
  }, [id, durationInput, endAtInput, mode]);

  return (
    <div
      ref={containerRef}
      style={{ padding: 24, maxWidth: 1000, margin: "0 auto", background: "var(--background)" }}
    >
      {!isFullscreen && (
        <AdminBreadcrumbs
          items={[
            { label: t("breadcrumbs.admin"), href: "/admin" },
            { label: t("breadcrumbs.giveaways"), href: "/admin/giveaways" },
            { label: t("breadcrumbs.view") }
          ]}
        />
      )}
      {!isFullscreen && (
        <div style={{ marginBottom: "16px" }}>
          <BackButton
            onClick={() => {
              window.location.href = "/admin/giveaways";
            }}
          >
            {t("backToList")}
          </BackButton>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12
        }}
      >
        <h1 style={{ margin: 0 }}>{t("title")}</h1>
        {isFullscreen ? (
          <HideButton onClick={toggleFullscreen} iconSize={18} />
        ) : (
          <ViewButton onClick={toggleFullscreen} iconSize={18} />
        )}
      </div>

      <Grid $isFullscreen={isFullscreen}>
        <Card>
          {!showWinners && (
            <>
              <h3>{t("publicLink")}</h3>
              <LinkSubtitle>{publicUrl}</LinkSubtitle>
              <Center>
                <QRWrapper>
                  {!loading && (
                    <>
                      <CornerTL $qrCornerSize={qrCornerSize} />
                      <CornerTR $qrCornerSize={qrCornerSize} />
                      <CornerBL $qrCornerSize={qrCornerSize} />
                      <CornerBR $qrCornerSize={qrCornerSize} />
                    </>
                  )}
                  <InnerQR>
                    {loading ? (
                      <div style={{ color: "#6b7280", position: "relative", zIndex: 1 }}>
                        {t("generating")}
                      </div>
                    ) : qrSrc ? (
                      <>
                        <Image src={qrSrc} alt="QR" width={qrSize} height={qrSize} />
                      </>
                    ) : (
                      <div>—</div>
                    )}
                  </InnerQR>
                </QRWrapper>
              </Center>
            </>
          )}

          {showWinners && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 20
                }}
              >
                <h3 style={{ margin: 0 }}>{t("winners")}</h3>
                {!winners || winners.length === 0 ? (
                  <RandomButton onClick={drawWinners} ariaLabel={t("drawWinners")} iconSize={18} />
                ) : null}
              </div>

              <WinnersGrid>
                {(winners && winners.length > 0
                  ? winners
                  : Array.from({ length: Math.max(1, Number(maxWinners ?? 1)) }).map(() => "")
                ).map((w, i) => {
                  const revealed = revealMask[i];
                  const detail = (winnersDetails && winnersDetails[i]) || null;
                  const avatarSrc = detail?.image || defaultAvatar;
                  const displayName = detail?.displayName || detail?.name || t("anonymous");
                  return (
                    <WinnerCard
                      key={i}
                      style={{
                        cursor: winners && winners.length > 0 && !revealed ? "pointer" : "default"
                      }}
                      onClick={() => {
                        if (!winners || winners.length === 0) return;
                        setRevealMask((prev) => {
                          const next = [...prev];
                          next[i] = true;
                          return next;
                        });
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "56px 1fr",
                          gap: 12,
                          alignItems: "center",
                          width: "100%"
                        }}
                      >
                        {winners && winners.length > 0 ? (
                          <>
                            <Avatar>
                              {revealed ? (
                                <Image
                                  src={avatarSrc}
                                  alt="avatar"
                                  width={56}
                                  height={56}
                                  style={{ borderRadius: "50%" }}
                                />
                              ) : (
                                <SkeletonCircle />
                              )}
                            </Avatar>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: isFullscreen ? 18 : 14 }}>
                                {t("winnerNumber", {
                                  n: i + 1
                                })}
                              </div>
                              {revealed ? (
                                <div style={{ color: "#111827", fontSize: isFullscreen ? 18 : 14 }}>
                                  {displayName}
                                  <div style={{ color: "#6b7280", fontSize: 10 }}>ID: {w}</div>
                                </div>
                              ) : (
                                <>
                                  <SkeletonLine $isFullscreen={isFullscreen} $isName />
                                  <SkeletonLine $isFullscreen={isFullscreen} />
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <SkeletonCircle />
                            <div>
                              <SkeletonLine $isFullscreen={isFullscreen} $isName />
                              <SkeletonLine $isFullscreen={isFullscreen} $isName />
                              <SkeletonLine $isFullscreen={isFullscreen} />
                            </div>
                          </>
                        )}
                      </div>
                      {winners && winners.length > 0 && (
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 10 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ReloadButton
                            onClick={() => {
                              reroll(i);
                            }}
                            ariaLabel={t("reroll")}
                            iconSize={16}
                            disabled={!revealed}
                            style={{ marginLeft: 8 }}
                          />
                        </div>
                      )}
                    </WinnerCard>
                  );
                })}
              </WinnersGrid>

              {winnerProofs && winnerProofs.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4>{t("verification")}</h4>
                  <p style={{ color: "#6b7280" }}>{t("verificationHelp")}</p>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    <div>
                      {t("inputHash")}: {winnerProofs[0]?.inputHash}
                    </div>
                    <div>
                      {t("inputSize")}: {winnerProofs[0]?.inputSize}
                    </div>
                    <div>
                      {t("drawAt")}: {winnerProofs[0]?.at}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {winnerProofs.map((p) => (
                        <div key={p.position}>
                          #{p.position + 1}: {t("seed")}={p.seed} {"=>"} {t("entryId")}={p.entryId}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <h3>{t("entries")}</h3>
          <div style={{ fontSize: isFullscreen ? 32 : 24, marginBottom: 16 }}>
            {entryCount === null ? "—" : entryCount}
          </div>

          <h3>{t("timer")}</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: isFullscreen ? 32 : 24,
              marginBottom: 16
            }}
          >
            {formattedRemaining}
            {mode === "duration" &&
              (status === "active" ? (
                <PauseButton onClick={togglePause} ariaLabel="Pause" iconSize={18} />
              ) : (
                <PlayButton onClick={togglePause} ariaLabel="Resume" iconSize={18} />
              ))}
          </div>

          <div style={{ height: "100%" }}></div>

          <div style={{ marginBottom: 8 }}>
            <RadioGroup
              row
              value={mode}
              onChange={(e) => {
                const nextMode = (e.target as HTMLInputElement).value as "end" | "duration";
                setMode(nextMode);
                // When switching to End mode and no value entered, set to current moment
                if (nextMode === "end" && !endAtInput) {
                  setEndAtInput(toLocalDateTimeInput(new Date().toISOString()));
                }
              }}
            >
              <FormControlLabel value="duration" control={<Radio />} label={t("duration")} />
              <FormControlLabel value="end" control={<Radio />} label={t("endAt")} />
            </RadioGroup>
          </div>

          {mode === "duration" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <TextField
                label={t("durationInput")}
                type="number"
                size="small"
                inputProps={{ min: 0 }}
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <TextField
                label={t("endAtInput")}
                type="datetime-local"
                size="small"
                value={endAtInput}
                onChange={(e) => setEndAtInput(e.target.value)}
              />
            </div>
          )}
          <div>
            <SaveButton onClick={saveConfig}>{t("saveConfiguration")}</SaveButton>
          </div>
        </Card>
      </Grid>
    </div>
  );
}

const Grid = styled.div<{ $isFullscreen: boolean }>`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  & h3 {
    font-size: ${({ $isFullscreen }) => ($isFullscreen ? "24px" : "16px")};
  }
  & p {
    font-size: ${({ $isFullscreen }) => ($isFullscreen ? "20px" : "14px")};
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
`;

const Center = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const QRWrapper = styled.div`
  position: relative;
  width: min-content;
  padding: 20px;
`;

const InnerQR = styled.div`
  position: relative;
  padding: 10px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 0 0 5px #000;
  display: inline-block;
`;

const CornerBase = styled.div<{ $qrCornerSize: number }>`
  position: absolute;
  width: ${({ $qrCornerSize }) => $qrCornerSize}px;
  height: ${({ $qrCornerSize }) => $qrCornerSize}px;
  border-radius: 20px;
  border: 5px solid #000;
  z-index: 0;
`;

const CornerTL = styled(CornerBase)`
  top: 0;
  left: 0;
  background: var(--google-red);
  border-top-left-radius: 10px;
`;

const CornerTR = styled(CornerBase)`
  top: 0;
  right: 0;
  background: var(--google-green);
  border-top-right-radius: 10px;
`;

const CornerBL = styled(CornerBase)`
  bottom: 0;
  left: 0;
  background: var(--google-blue);
  border-bottom-left-radius: 10px;
`;

const CornerBR = styled(CornerBase)`
  bottom: 0;
  right: 0;
  background: var(--google-yellow);
  border-bottom-right-radius: 10px;
`;

const LinkSubtitle = styled.p`
  color: #6b7280;
  margin-bottom: 8px;
  text-align: center;
`;

// Utils
function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatDuration(ms: number) {
  let total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  total -= d * 86400;
  const h = Math.floor(total / 3600);
  total -= h * 3600;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  const dd = d ? `${d}d ` : "";
  return `${dd}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Winners UI styled components
const WinnersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const WinnerCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
`;

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const SkeletonCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
`;

const SkeletonLine = styled.div<{ $isFullscreen?: boolean; $isName?: boolean }>`
  width: 100%;
  height: ${({ $isFullscreen, $isName }) => ($isName ? ($isFullscreen ? "24px" : "16px") : "12px")};
  border-radius: 6px;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;
  ${({ $isName }) => ($isName ? "margin-bottom: 2px;" : "")}
`;
