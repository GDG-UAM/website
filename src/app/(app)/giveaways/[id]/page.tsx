"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import styled from "styled-components";
import Modal from "@/components/Modal";
import { AcceptButton, CancelButton } from "@/components/Buttons";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const Container = styled.div`
  padding: 24px;
  display: flex;
  justify-content: center;
`;

const ContentCard = styled.div`
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 24px;
  border-radius: 12px;
`;

const JoinArea = styled.div`
  margin-top: 18px;
  .join-button {
    background: var(--google-blue);
    color: #fff;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  .join-button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RequirementsList = styled.div`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RequirementRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  background: #f9fafb;
  padding: 5px;
  border-radius: 8px;
`;

const StatusIcon = styled.div`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: auto;
`;

const SignInToEnableSubtitle = styled.div`
  color: var(--color-gray-400);
`;

export default function GiveawayJoinPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const t = useTranslations("giveaways");
  const { data: session } = useSession();

  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  // Don't open modal on load; only after prechecks pass
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  // Login button manages its own loading state

  type Giveaway = {
    mustBeLoggedIn?: boolean;
    requirePhotoUsageConsent?: boolean;
    requireProfilePublic?: boolean;
    startAt?: string | null;
    endAt?: string | null;
    durationS?: number | null;
    remainingS?: number | null;
    status?: "draft" | "active" | "paused" | "closed" | "cancelled" | null;
  };
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  // serverPhotoConsent / serverProfilePublic hold server snapshot; desired* hold the user's selections
  const [understandPhoto, setUnderstandPhoto] = useState(false);
  const [understandProfile, setUnderstandProfile] = useState(false);
  const [serverPhotoConsent, setServerPhotoConsent] = useState<boolean | null>(null);
  const [serverProfilePublic, setServerProfilePublic] = useState<boolean | null>(null);
  const [desiredPhotoConsent, setDesiredPhotoConsent] = useState<boolean | null>(null);
  const [desiredProfilePublic, setDesiredProfilePublic] = useState<boolean | null>(null);
  const [prefsReady, setPrefsReady] = useState(false);
  const [prechecking, setPrechecking] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // SWR fetcher
  const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject()));
  // Read anonId once on mount
  const [anonId, setAnonId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAnonId(localStorage.getItem("telemetry_anon_id"));
    }
  }, []);

  // Giveaway details
  const { data: swrGiveaway, mutate: refreshGiveaway } = useSWR<Giveaway>(
    id ? `/api/giveaways/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );
  // Registration status
  const { data: swrReg, mutate: refreshReg } = useSWR(
    id != null && anonId !== undefined
      ? `/api/giveaways/${id}/entries/check${anonId ? `?anonId=${encodeURIComponent(anonId)}` : ""}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  // Privacy preferences (only when logged in)
  const { data: swrPrefs } = useSWR<{ photoConsent?: boolean; showProfilePublicly?: boolean }>(
    session?.user?.id ? "/api/settings/privacy" : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );

  // Reflect SWR data into local state and derive closures
  useEffect(() => {
    if (swrGiveaway) {
      setGiveaway(swrGiveaway);
      const now = Date.now();
      const endMs = swrGiveaway?.endAt ? new Date(swrGiveaway.endAt).getTime() : null;
      const hasEnd = typeof endMs === "number" && !Number.isNaN(endMs);
      const remaining: number | null =
        typeof swrGiveaway?.remainingS === "number" ? swrGiveaway.remainingS : null;
      const startMs = swrGiveaway?.startAt ? new Date(swrGiveaway.startAt).getTime() : null;
      const durationExpiredActive =
        !hasEnd &&
        swrGiveaway?.status === "active" &&
        typeof startMs === "number" &&
        typeof remaining === "number" &&
        startMs + remaining * 1000 <= now;
      const closed =
        swrGiveaway?.status === "closed" ||
        swrGiveaway?.status === "cancelled" ||
        (hasEnd && endMs! <= now) ||
        (!hasEnd && (remaining == null || remaining <= 0 || durationExpiredActive));
      setIsClosed(Boolean(closed));
      if (closed) setShowModal(false);
    }
  }, [swrGiveaway]);

  useEffect(() => {
    if (swrReg) setIsRegistered(Boolean(swrReg.registered));
  }, [swrReg]);

  // Load prefs when available
  useEffect(() => {
    if (session?.user?.id) {
      if (swrPrefs) {
        const pc = Boolean(swrPrefs.photoConsent);
        const pp = Boolean(swrPrefs.showProfilePublicly);
        setServerPhotoConsent(pc);
        setServerProfilePublic(pp);
        setDesiredPhotoConsent(pc);
        setDesiredProfilePublic(pp);
        setPrefsReady(true);
      }
    } else {
      setPrefsReady(true);
    }
  }, [session?.user?.id, swrPrefs]);

  // Recompute prefsReady when auth state changes
  useEffect(() => {
    if (!session?.user?.id) {
      setPrefsReady(true);
    }
  }, [session?.user?.id]);

  const handleAccept = () => {
    // Only allow accept if main consent checked and requirement verifications are satisfied
    if (!accepted) return;
    if (giveaway?.requirePhotoUsageConsent) {
      if (!desiredPhotoConsent) return;
      if (!understandPhoto) return;
    }
    if (giveaway?.requireProfilePublic) {
      if (!desiredProfilePublic) return;
      if (!understandProfile) return;
    }
    if (giveaway?.mustBeLoggedIn) {
      if (!session?.user?.id) return; // force login
    }
    (async () => {
      // If logged in and desired settings changed, apply them server-side now
      if (session?.user?.id) {
        try {
          const body: Record<string, unknown> = {};
          if (
            typeof desiredPhotoConsent === "boolean" &&
            desiredPhotoConsent !== serverPhotoConsent
          ) {
            body.photoConsent = desiredPhotoConsent;
          }
          if (
            typeof desiredProfilePublic === "boolean" &&
            desiredProfilePublic !== serverProfilePublic
          ) {
            body.showProfilePublicly = desiredProfilePublic;
          }
          if (Object.keys(body).length > 0) {
            await fetch("/api/settings/privacy", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
            // update server-side snapshot locally
            if (typeof body.photoConsent !== "undefined")
              setServerPhotoConsent(Boolean(body.photoConsent));
            if (typeof body.showProfilePublicly !== "undefined")
              setServerProfilePublic(Boolean(body.showProfilePublicly));
          }
        } catch {}
      }
      setShowModal(false);
    })();
  };

  // Precheck and possibly open modal; if already accepted and all conditions satisfied, this will proceed to join
  const handleJoin = async () => {
    if (!id) return;
    // If user hasn't accepted, run prechecks and open modal only if can join
    if (!accepted) {
      setPrechecking(true);
      try {
        // Refresh giveaway info and registration using SWR cache
        const [latestGiveaway, latestReg]: [
          Giveaway | undefined,
          { registered?: boolean } | undefined
        ] = await Promise.all([refreshGiveaway(), refreshReg()]);
        const updatedGiveaway: Giveaway | null = latestGiveaway ?? giveaway;
        const alreadyRegistered = Boolean(latestReg?.registered);
        setIsRegistered(alreadyRegistered);
        // compute latest closed state
        const now = Date.now();
        const endMs = updatedGiveaway?.endAt ? new Date(updatedGiveaway.endAt).getTime() : null;
        const hasEnd = typeof endMs === "number" && !Number.isNaN(endMs);
        const remaining: number | null =
          typeof updatedGiveaway?.remainingS === "number" ? updatedGiveaway.remainingS : null;
        const startMs = updatedGiveaway?.startAt
          ? new Date(updatedGiveaway.startAt).getTime()
          : null;
        const durationExpiredActive =
          !hasEnd &&
          updatedGiveaway?.status === "active" &&
          typeof startMs === "number" &&
          typeof remaining === "number" &&
          startMs + remaining * 1000 <= now;
        const closed =
          updatedGiveaway?.status === "closed" ||
          updatedGiveaway?.status === "cancelled" ||
          (hasEnd && endMs! <= now) ||
          (!hasEnd && (remaining == null || remaining <= 0 || durationExpiredActive));
        setIsClosed(Boolean(closed));
        if (!closed && !alreadyRegistered) {
          // Ensure prefs are ready before showing modal (avoid checkbox flicker)
          if (session?.user?.id && !prefsReady) {
            // prefs will arrive via SWR; mark ready if not already
            setPrefsReady(true);
          }
          setShowModal(true);
        } else {
          setShowModal(false);
        }
      } finally {
        setPrechecking(false);
      }
      return;
    }
    // also ensure requirement verifications present
    if (giveaway?.requirePhotoUsageConsent && !understandPhoto) {
      setShowModal(true);
      return;
    }
    if (giveaway?.requireProfilePublic && !understandProfile) {
      setShowModal(true);
      return;
    }
    if (giveaway?.mustBeLoggedIn && !session?.user?.id) {
      setShowModal(true);
      return;
    }

    setJoining(true);
    try {
      const anonId =
        typeof window !== "undefined" ? localStorage.getItem("telemetry_anon_id") : null;
      const res = await fetch(`/api/giveaways/${id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptTerms: true,
          anonId,
          finalConfirmations: {
            photoConsent: !!desiredPhotoConsent,
            profilePublic: !!desiredProfilePublic,
            understandPhoto: !!understandPhoto,
            understandProfile: !!understandProfile
          }
        })
      });
      if (res.ok) {
        setJoined(true);
        setIsRegistered(true);
      } else if (res.status === 409) {
        setIsRegistered(true);
      } else {
        const txt = await res.text();
        console.error("Join failed:", txt);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (mountedRef.current) setJoining(false);
    }
  };

  return (
    <Container>
      <ContentCard>
        <h1>{t("title")}</h1>

        {isRegistered === null ? (
          <p>{t("checking")}</p>
        ) : isClosed ? (
          <p>{t("closed")}</p>
        ) : isRegistered ? (
          <p>{t("alreadyRegistered")}</p>
        ) : (
          <>
            <p>{t("instructions")}</p>

            <JoinArea>
              <button
                disabled={isClosed || showModal || joining || joined || prechecking}
                onClick={handleJoin}
                className="join-button"
              >
                {joined ? t("joined") : prechecking ? t("checking") : t("join")}
              </button>
            </JoinArea>
          </>
        )}
      </ContentCard>

      <Modal
        isOpen={showModal && !isClosed}
        title={t("modal.title")}
        buttons={[
          <CancelButton key="cancel" onClick={() => setShowModal(false)} />,
          <AcceptButton
            key="accept"
            onClick={handleAccept}
            color={accepted ? "success" : "default"}
            disabled={
              !accepted ||
              (giveaway?.requirePhotoUsageConsent
                ? !understandPhoto || !(desiredPhotoConsent === true || serverPhotoConsent === true)
                : false) ||
              (giveaway?.requireProfilePublic
                ? !understandProfile ||
                  !(desiredProfilePublic === true || serverProfilePublic === true)
                : false) ||
              (giveaway?.mustBeLoggedIn ? !session?.user?.id : false)
            }
          />
        ]}
      >
        <div>
          <p>{t("modal.body")}</p>

          <RequirementsList>
            {giveaway?.mustBeLoggedIn && (
              <RequirementRow>
                <StatusIcon>
                  {session?.user?.id ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="var(--google-green)"
                    >
                      <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="var(--google-red)"
                    >
                      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                  )}
                </StatusIcon>
                <div style={{ flex: 1 }}>
                  <div>{t("modal.auth")}</div>
                  {!session?.user?.id && (
                    <div style={{ marginTop: 8 }}>
                      <GoogleLoginButton label={t("modal.loginWithGoogle")} size="sm" />
                    </div>
                  )}
                </div>
              </RequirementRow>
            )}

            {giveaway?.requirePhotoUsageConsent && (
              <RequirementRow>
                <StatusIcon>
                  {(() => {
                    const settingSelected =
                      serverPhotoConsent === true || desiredPhotoConsent === true;
                    const understandSelected = Boolean(understandPhoto);
                    const count = (settingSelected ? 1 : 0) + (understandSelected ? 1 : 0);
                    if (count === 2) {
                      return (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="var(--google-green)"
                        >
                          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                        </svg>
                      );
                    }
                    if (count === 1) {
                      return (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="var(--google-yellow)"
                        >
                          <path d="M160-440v-80h640v80H160Z" />
                        </svg>
                      );
                    }
                    return (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="var(--google-red)"
                      >
                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                      </svg>
                    );
                  })()}
                </StatusIcon>
                <div style={{ flex: 1 }}>
                  <div>{t("modal.photoConsent")}</div>
                  {session?.user?.id ? (
                    <div style={{ marginTop: 8 }}>
                      {/* Show toggle only after prefs are ready; avoids flicker */}
                      {prefsReady && serverPhotoConsent !== true && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!desiredPhotoConsent}
                              onChange={(e) => setDesiredPhotoConsent(e.target.checked)}
                            />
                          }
                          label={t("modal.enablePhotoConsent")}
                        />
                      )}

                      <div style={{ marginTop: 8 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={understandPhoto}
                              onChange={(e) => setUnderstandPhoto(e.target.checked)}
                            />
                          }
                          label={t("modal.understandPhoto")}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <SignInToEnableSubtitle>{t("modal.signinToEnable")}</SignInToEnableSubtitle>
                    </div>
                  )}
                </div>
              </RequirementRow>
            )}

            {giveaway?.requireProfilePublic && (
              <RequirementRow>
                <StatusIcon>
                  {(() => {
                    const settingSelected =
                      serverProfilePublic === true || desiredProfilePublic === true;
                    const understandSelected = Boolean(understandProfile);
                    const count = (settingSelected ? 1 : 0) + (understandSelected ? 1 : 0);
                    if (count === 2) {
                      return (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="var(--google-green)"
                        >
                          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                        </svg>
                      );
                    }
                    if (count === 1) {
                      return (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="var(--google-yellow)"
                        >
                          <path d="M160-440v-80h640v80H160Z" />
                        </svg>
                      );
                    }
                    return (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="var(--google-red)"
                      >
                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                      </svg>
                    );
                  })()}
                </StatusIcon>
                <div style={{ flex: 1 }}>
                  <div>{t("modal.profilePublic")}</div>
                  {session?.user?.id ? (
                    <div style={{ marginTop: 8 }}>
                      {prefsReady && serverProfilePublic !== true && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!desiredProfilePublic}
                              onChange={(e) => setDesiredProfilePublic(e.target.checked)}
                            />
                          }
                          label={t("modal.enableProfilePublic")}
                        />
                      )}

                      <div style={{ marginTop: 8 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={understandProfile}
                              onChange={(e) => setUnderstandProfile(e.target.checked)}
                            />
                          }
                          label={t("modal.understandProfile")}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <SignInToEnableSubtitle>{t("modal.signinToEnable")}</SignInToEnableSubtitle>
                    </div>
                  )}
                </div>
              </RequirementRow>
            )}
          </RequirementsList>

          {/* Main consent always last */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <FormControlLabel
              control={
                <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              }
              label={t("modal.acceptData")}
            />
          </div>
        </div>
      </Modal>
    </Container>
  );
}
