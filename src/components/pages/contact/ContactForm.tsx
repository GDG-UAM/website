"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import TextField from "@mui/material/TextField";
import { OpenSocialButton, SendButton, PlainButton } from "@/components/Buttons";
import FAQ from "@/components/pages/contact/FAQ";
import { withAnonymousCsrfHeaders } from "@/lib/security/csrfClient";
import { useSession } from "next-auth/react";

const PageContainer = styled.div`
  padding: 40px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
`;

const Grid = styled.div`
  display: grid;
  gap: 32px;
  align-items: start;
  position: relative;

  grid-template-columns: 1fr clamp(320px, 45vw, 500px);
  grid-template-rows: min-content auto;
  grid-template-areas:
    "left ."
    "faq .";

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      "left"
      "right"
      "faq";
  }
`;

const Left = styled.div`
  grid-area: left;
  max-width: 700px;
`;

const RightWrapper = styled.div`
  width: clamp(320px, 45vw, 500px);
  position: absolute;
  right: 0;
  top: 0;

  @media (max-width: 768px) {
    position: static;
    grid-area: right;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const Right = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 2rem;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const FAQSection = styled.div`
  grid-area: faq;
`;

const FAQTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--google-dark-gray);
`;

const Intro = styled.p`
  color: var(--google-dark-gray);
  line-height: 1.6;
`;

const FormTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 12px 0;
`;

const Toggle = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
  gap: 8px;
`;

const StyledForm = styled.form`
  display: grid;
  gap: 12px;
`;

const iconPaths = {
  user: "M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z",
  email:
    "M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480v58q0 59-40.5 100.5T740-280q-35 0-66-15t-52-43q-29 29-65.5 43.5T480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480v58q0 26 17 44t43 18q26 0 43-18t17-44v-58q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93h200v80H480Zm0-280q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z",
  organization:
    "M80-120v-720h400v160h400v560H80Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h320v-400H480v80h80v80h-80v80h80v80h-80v80Zm160-240v-80h80v80h-80Zm0 160v-80h80v80h-80Z",
  // website:
  // "M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z"
  website:
    "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Zm0-82q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z"
};

const Icon: React.FC<{ icon: keyof typeof iconPaths }> = ({ icon }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="var(--google-dark-gray)"
    style={{ marginRight: 8, flexShrink: 0 }}
  >
    <path d={iconPaths[icon]} />
  </svg>
);

type Mode = "personal" | "sponsor";

type ContactPayload = {
  type: Mode;
  name: string;
  email: string;
  message: string;
  orgName?: string;
  website?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const ContactForm: React.FC<{ csrfToken?: string }> = () => {
  const t = useTranslations("contact");
  const [mode, setMode] = useState<Mode>("personal");
  const { data: session } = useSession();
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const showFormIcons = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["contact-show-form-icons"]
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedMessage, setTouchedMessage] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [touchedOrgName, setTouchedOrgName] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Update grid min-height based on right section height
  useEffect(() => {
    const updateMinHeight = () => {
      if (gridRef.current && rightRef.current) {
        const isDesktop = window.innerWidth > 768;
        if (isDesktop) {
          const rightHeight = rightRef.current.offsetHeight;
          gridRef.current.style.minHeight = `${rightHeight}px`;
        } else {
          gridRef.current.style.minHeight = "";
        }
      }
    };

    updateMinHeight();

    // Use ResizeObserver to track changes in right section height
    const resizeObserver = new ResizeObserver(updateMinHeight);
    if (rightRef.current) {
      resizeObserver.observe(rightRef.current);
    }

    // Track window resize
    window.addEventListener("resize", updateMinHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMinHeight);
    };
  }, [mode]); // Re-run when mode changes (affects form height)

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload: ContactPayload = { type: mode, name, email, message };
    if (mode === "sponsor") {
      payload.orgName = orgName;
      payload.website = website;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: await withAnonymousCsrfHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setName("");
        setTouchedName(false);
        setEmail("");
        setTouchedEmail(false);
        setOrgName("");
        setTouchedOrgName(false);
        setWebsite("");
        setMessage("");
        setTouchedMessage(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const invalidName = !name.trim();
  const invalidEmail = !email.trim() || !isValidEmail(email);
  const invalidMessage = !message.trim();
  const invalidOrgName = !orgName.trim();

  const fieldsMissing =
    mode === "personal"
      ? invalidName || invalidEmail || invalidMessage
      : invalidOrgName || invalidName || invalidEmail || invalidMessage;

  const personalInvalid = {
    name: invalidName,
    email: invalidEmail,
    message: invalidMessage
  };

  const sendTooltip = fieldsMissing ? "Some required fields are missing or invalid" : undefined;

  return (
    <PageContainer>
      <Grid ref={gridRef}>
        <Left>
          <Title>
            {t("title")}
            <div style={{ display: "flex", gap: "8px" }}>
              <OpenSocialButton
                network="instagram"
                user="https://gdguam.es/l/instagram"
                ignoreStart
                iconSize={18}
                dontUseContext
              />
              <OpenSocialButton
                network="whatsapp"
                user="https://gdguam.es/l/whatsapp"
                ignoreStart
                iconSize={18}
                dontUseContext
              />
              <OpenSocialButton
                network="email"
                user="gdguam@gmail.com"
                iconSize={18}
                dontUseContext
              />
              <OpenSocialButton
                network="gdgCommunity"
                user="https://gdguam.es/l/gdg-community"
                ignoreStart
                iconSize={18}
                dontUseContext
              />
            </div>
          </Title>
          <Intro>{t("intro")}</Intro>
        </Left>

        <RightWrapper ref={rightRef}>
          <Right>
            <Toggle>
              <PlainButton
                noBackground
                slim
                style={{ fontSize: "0.95rem" }}
                color={mode === "personal" ? "primary" : "default"}
                onClick={() => setMode("personal")}
              >
                {t("personal")}
              </PlainButton>
              <PlainButton
                noBackground
                slim
                style={{ fontSize: "0.95rem" }}
                color={mode === "sponsor" ? "primary" : "default"}
                onClick={() => setMode("sponsor")}
              >
                {t("sponsor")}
              </PlainButton>
            </Toggle>

            <FormTitle>
              {mode === "personal" ? t("formTitlePersonal") : t("formTitleSponsor")}
            </FormTitle>

            <StyledForm onSubmit={handleSubmit}>
              {mode === "personal" ? (
                <>
                  <div style={{ display: "flex", gap: 8 }}>
                    <TextField
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouchedName(true)}
                      label={t("fullName")}
                      fullWidth
                      required
                      error={touchedName && personalInvalid.name}
                      helperText={touchedName && personalInvalid.name ? t("required") : " "}
                      placeholder={t("namePlaceholder")}
                      slotProps={
                        showFormIcons
                          ? {
                              input: {
                                startAdornment: <Icon icon="user" />
                              }
                            }
                          : undefined
                      }
                    />
                  </div>

                  <TextField
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouchedEmail(true)}
                    label={t("email")}
                    type="email"
                    fullWidth
                    required
                    error={touchedEmail && personalInvalid.email}
                    helperText={
                      touchedEmail && personalInvalid.email
                        ? email.trim() === ""
                          ? t("required")
                          : t("validEmail")
                        : " "
                    }
                    placeholder={t("emailPlaceholder")}
                    slotProps={
                      showFormIcons
                        ? {
                            input: {
                              startAdornment: <Icon icon="email" />
                            }
                          }
                        : undefined
                    }
                  />

                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => setTouchedMessage(true)}
                    label={t("message")}
                    multiline
                    rows={6}
                    fullWidth
                    required
                    error={touchedMessage && personalInvalid.message}
                    helperText={touchedMessage && personalInvalid.message ? t("required") : " "}
                  />
                </>
              ) : (
                <>
                  <TextField
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onBlur={() => setTouchedOrgName(true)}
                    label={t("organization")}
                    fullWidth
                    required
                    error={touchedOrgName && invalidOrgName}
                    helperText={touchedOrgName && invalidOrgName ? t("required") : " "}
                    placeholder={t("organizationPlaceholder")}
                    slotProps={
                      showFormIcons
                        ? {
                            input: {
                              startAdornment: <Icon icon="organization" />
                            }
                          }
                        : undefined
                    }
                  />
                  <TextField
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouchedName(true)}
                    label={t("contactName")}
                    fullWidth
                    required
                    error={touchedName && invalidName}
                    helperText={touchedName && invalidName ? t("required") : " "}
                    placeholder={t("namePlaceholder")}
                    slotProps={
                      showFormIcons
                        ? {
                            input: {
                              startAdornment: <Icon icon="user" />
                            }
                          }
                        : undefined
                    }
                  />
                  <TextField
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouchedEmail(true)}
                    label={t("contactEmail")}
                    type="email"
                    fullWidth
                    required
                    error={touchedEmail && invalidEmail}
                    helperText={
                      touchedEmail && invalidEmail
                        ? email.trim() === ""
                          ? t("required")
                          : t("validEmail")
                        : " "
                    }
                    placeholder={t("emailPlaceholder")}
                    slotProps={
                      showFormIcons
                        ? {
                            input: {
                              startAdornment: <Icon icon="email" />
                            }
                          }
                        : undefined
                    }
                  />
                  <TextField
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    label={t("website")}
                    fullWidth
                    helperText={" "}
                    placeholder={t("websitePlaceholder")}
                    slotProps={
                      showFormIcons
                        ? {
                            input: {
                              startAdornment: <Icon icon="website" />
                            }
                          }
                        : undefined
                    }
                  />
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => setTouchedMessage(true)}
                    label={t("message")}
                    multiline
                    rows={6}
                    fullWidth
                    required
                    error={touchedMessage && invalidMessage}
                    helperText={touchedMessage && invalidMessage ? t("required") : " "}
                  />
                </>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SendButton
                  fullWidth
                  confirmationDuration={500}
                  showSpinner
                  onClick={handleSubmit}
                  disabled={submitting || fieldsMissing}
                  tooltip={sendTooltip}
                  childrenSent={t("sent")}
                  tooltipSent={null}
                  iconSwitchDelay={5000}
                >
                  {t("send")}
                </SendButton>
              </div>
            </StyledForm>
          </Right>
        </RightWrapper>

        <FAQSection>
          <FAQTitle>{t("faq.title")}</FAQTitle>
          <FAQ
            items={Array.from({ length: 4 }).map((_, i) => ({
              id: `faq_${i}`,
              question: t(`faq.items.${i}.q`),
              answer: t(`faq.items.${i}.a`)
            }))}
          />
        </FAQSection>
      </Grid>
    </PageContainer>
  );
};
