"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import {
  SaveButton,
  CancelButton,
  AddButton,
  DeleteButton,
  ViewButton,
  HideButton
} from "@/components/Buttons";
import { useTranslations } from "next-intl";
import { TextField, MenuItem, Autocomplete, CircularProgress } from "@mui/material";
import Certificate, { CertificateData, CERTIFICATE_DESIGNS } from "@/components/Certificate";
import { api } from "@/lib/eden";

type UserLite = {
  _id: string;
  name: string;
  displayName?: string;
  image?: string;
};

const PageLayout = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const FormColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

const PreviewColumn = styled.div`
  width: 450px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;

  @media (max-width: 1024px) {
    width: 100%;
    position: static;
    order: 2;
  }
`;

const PreviewTitle = styled.div`
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
  max-width: 100%;
`;

const Section = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const SignatureRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

const SignatureFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  flex: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InstructorRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

const MobilePreview = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: block;
    margin-top: 16px;
  }
`;

const DesktopPreview = styled.div`
  @media (max-width: 1024px) {
    display: none;
  }
`;

const ScrollablePreview = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  position: relative;
  background: #f9fafb;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const OverlayContent = styled.div`
  position: relative;
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
`;

export type CertificateType =
  | "COURSE_COMPLETION"
  | "EVENT_ACHIEVEMENT"
  | "PARTICIPATION"
  | "VOLUNTEER";
export type ParticipationRole = "ATTENDEE" | "PARTICIPANT" | "SPEAKER" | "ORGANIZER";

export type CertificateFormData = {
  type: CertificateType;
  title: string;
  description?: string;
  designId: string;
  recipient: {
    userId?: string;
    name: string;
  };
  period?: {
    startDate?: string;
    endDate?: string;
  };
  signatures: Array<{
    name?: string;
    role?: string;
    imageUrl?: string;
  }>;
  metadata: {
    // Course completion
    instructors?: Array<{ ref?: string; name?: string }>;
    grade?: string;
    hours?: number;
    // Event achievement
    rank?: string;
    group?: string;
    // Participation
    role?: ParticipationRole;
  };
};

type Props = {
  initial?: Partial<CertificateFormData>;
  onCancel?: () => void;
  onSubmit: (data: CertificateFormData) => Promise<void> | void;
};

const defaultFormData: CertificateFormData = {
  type: "PARTICIPATION",
  title: "",
  description: "",
  designId: CERTIFICATE_DESIGNS[0].id,
  recipient: {
    name: ""
  },
  period: {
    startDate: "",
    endDate: ""
  },
  signatures: [],
  metadata: {}
};

export default function CertificateForm({ initial, onCancel, onSubmit }: Props) {
  const t = useTranslations("admin.certificates.form");

  // Track if this is the initial load to prevent metadata reset on type sync
  const isInitialLoadRef = useRef(true);

  const [data, setData] = useState<CertificateFormData>(() => ({
    ...defaultFormData,
    ...initial,
    recipient: { ...defaultFormData.recipient, ...initial?.recipient },
    period: { ...defaultFormData.period, ...initial?.period },
    signatures: initial?.signatures || [],
    metadata: { ...initial?.metadata }
  }));

  // Sync form data when initial prop changes (e.g., when editing and data loads async)
  useEffect(() => {
    if (initial) {
      isInitialLoadRef.current = true;
      setData({
        ...defaultFormData,
        ...initial,
        recipient: { ...defaultFormData.recipient, ...initial?.recipient },
        period: { ...defaultFormData.period, ...initial?.period },
        signatures: initial?.signatures || [],
        metadata: { ...initial?.metadata }
      });
    }
  }, [initial]);

  // User search state for recipient
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientOptions, setRecipientOptions] = useState<UserLite[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);

  // User search state for instructors
  const [instructorQueries, setInstructorQueries] = useState<Record<number, string>>({});
  const [instructorOptions, setInstructorOptions] = useState<UserLite[]>([]);
  const [instructorLoading, setInstructorLoading] = useState(false);
  const [instructorOpen, setInstructorOpen] = useState<number | null>(null);

  // Preview overlay state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const calculateScale = () => {
      if (!contentRef.current) return;

      const certContent = contentRef.current;
      const certWidth = certContent.scrollWidth || 1050;
      const certHeight = certContent.scrollHeight || 750;

      const margin = 80; // Safer margin
      const availableWidth = window.innerWidth - margin;
      const availableHeight = window.innerHeight - margin;

      const scaleX = availableWidth / certWidth;
      const scaleY = availableHeight / certHeight;

      // Fit completely in view, but cap at 1 to avoid upscaling blur scaling
      setScale(Math.min(scaleX, scaleY, 1));
    };

    // Delay slightly to allow render to happen and layout to settle
    const timer = setTimeout(calculateScale, 0);
    window.addEventListener("resize", calculateScale);
    return () => {
      window.removeEventListener("resize", calculateScale);
      clearTimeout(timer);
    };
  }, [isPreviewOpen, data]); // Re-calc if data changes

  // Prevent background scrolling when overlay is open
  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPreviewOpen]);

  // Fetch users for recipient search
  useEffect(() => {
    if (!recipientOpen) return;
    let ignore = false;
    async function fetchUsers() {
      setRecipientLoading(true);
      try {
        const { data: result, error } = await api.admin.users.get({
          query: { q: recipientQuery || undefined, pageSize: 20 }
        });
        if (error || ignore) return;
        setRecipientOptions(result.items || []);
      } finally {
        if (!ignore) setRecipientLoading(false);
      }
    }
    fetchUsers();
    return () => {
      ignore = true;
    };
  }, [recipientQuery, recipientOpen]);

  // Fetch users for instructor search
  useEffect(() => {
    if (instructorOpen === null) return;
    const currentIdx = instructorOpen; // Capture value before async
    let ignore = false;
    async function fetchUsers() {
      setInstructorLoading(true);
      try {
        const query = instructorQueries[currentIdx] || "";
        const { data: result, error } = await api.admin.users.get({
          query: { q: query || undefined, pageSize: 20 }
        });
        if (error || ignore) return;
        setInstructorOptions(result.items || []);
      } finally {
        if (!ignore) setInstructorLoading(false);
      }
    }
    fetchUsers();
    return () => {
      ignore = true;
    };
  }, [instructorQueries, instructorOpen]);

  // Reset metadata when type changes (only on user interaction, not initial load)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    setData((prev) => ({
      ...prev,
      metadata: {}
    }));
  }, [data.type]);

  const updateField = <K extends keyof CertificateFormData>(
    key: K,
    value: CertificateFormData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateRecipient = (field: keyof CertificateFormData["recipient"], value: string) => {
    setData((prev) => ({
      ...prev,
      recipient: { ...prev.recipient, [field]: value }
    }));
  };

  const updatePeriod = (field: keyof NonNullable<CertificateFormData["period"]>, value: string) => {
    setData((prev) => ({
      ...prev,
      period: { ...prev.period, [field]: value }
    }));
  };

  const updateMetadata = (field: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
  };

  const addSignature = () => {
    setData((prev) => ({
      ...prev,
      signatures: [...prev.signatures, { name: "", role: "" }]
    }));
  };

  const removeSignature = (index: number) => {
    setData((prev) => ({
      ...prev,
      signatures: prev.signatures.filter((_, i) => i !== index)
    }));
  };

  const updateSignature = (index: number, field: "name" | "role" | "imageUrl", value: string) => {
    setData((prev) => ({
      ...prev,
      signatures: prev.signatures.map((sig, i) => (i === index ? { ...sig, [field]: value } : sig))
    }));
  };

  const addInstructor = () => {
    const current = data.metadata.instructors || [];
    updateMetadata("instructors", [...current, { name: "" }]);
  };

  const removeInstructor = (index: number) => {
    const current = data.metadata.instructors || [];
    updateMetadata(
      "instructors",
      current.filter((_, i) => i !== index)
    );
    // Clean up query state
    setInstructorQueries((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateInstructor = (index: number, name: string, ref?: string) => {
    const current = data.metadata.instructors || [];
    updateMetadata(
      "instructors",
      current.map((inst, i) => (i === index ? { name, ref } : inst))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(data);
  };

  // Build preview data
  const previewData: CertificateData = {
    title: data.title,
    description: data.description,
    type: data.type,
    recipient: data.recipient,
    designId: data.designId,
    period: data.period,
    signatures: data.signatures,
    metadata: data.metadata
  };

  const renderTypeSpecificFields = () => {
    switch (data.type) {
      case "COURSE_COMPLETION":
        return (
          <Section>
            <SectionTitle>{t("courseMetadata")}</SectionTitle>
            <TwoCol>
              <TextField
                label={t("hours")}
                type="number"
                value={data.metadata.hours || ""}
                onChange={(e) =>
                  updateMetadata("hours", e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <TextField
                label={t("grade")}
                value={data.metadata.grade || ""}
                onChange={(e) => updateMetadata("grade", e.target.value)}
              />
            </TwoCol>
            <div style={{ marginTop: "12px" }}>
              <div style={{ marginBottom: "8px", fontWeight: 500, fontSize: "0.875rem" }}>
                {t("instructors")}
              </div>
              {(data.metadata.instructors || []).map((inst, idx) => (
                <InstructorRow key={idx}>
                  <Autocomplete
                    freeSolo
                    fullWidth
                    options={instructorOptions}
                    open={instructorOpen === idx}
                    onOpen={() => setInstructorOpen(idx)}
                    onClose={() => setInstructorOpen(null)}
                    getOptionLabel={(option) =>
                      typeof option === "string"
                        ? option
                        : option.displayName || option.name || option._id
                    }
                    inputValue={instructorQueries[idx] ?? inst.name ?? ""}
                    onInputChange={(_e, newValue) => {
                      setInstructorQueries((prev) => ({ ...prev, [idx]: newValue }));
                      // Update instructor name as user types (allow manual entry)
                      updateInstructor(idx, newValue, undefined);
                    }}
                    onChange={(_e, newValue) => {
                      if (typeof newValue === "string") {
                        updateInstructor(idx, newValue, undefined);
                      } else if (newValue) {
                        updateInstructor(idx, newValue.displayName || newValue.name, newValue._id);
                        setInstructorQueries((prev) => ({
                          ...prev,
                          [idx]: newValue.displayName || newValue.name
                        }));
                      }
                    }}
                    loading={instructorLoading && instructorOpen === idx}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label={`${t("instructorName")} ${idx + 1}`}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {instructorLoading && instructorOpen === idx ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                  <DeleteButton iconSize={20} onClick={() => removeInstructor(idx)} />
                </InstructorRow>
              ))}
              <AddButton iconSize={20} onClick={addInstructor}>
                {t("addInstructor")}
              </AddButton>
            </div>
          </Section>
        );

      case "EVENT_ACHIEVEMENT":
        return (
          <Section>
            <SectionTitle>{t("achievementMetadata")}</SectionTitle>
            <TwoCol>
              <TextField
                label={t("rank")}
                value={data.metadata.rank || ""}
                onChange={(e) => updateMetadata("rank", e.target.value)}
                required
              />
              <TextField
                label={t("group")}
                value={data.metadata.group || ""}
                onChange={(e) => updateMetadata("group", e.target.value)}
              />
            </TwoCol>
          </Section>
        );

      case "PARTICIPATION":
        return (
          <Section>
            <SectionTitle>{t("participationMetadata")}</SectionTitle>
            <TextField
              select
              fullWidth
              label={t("participationRole")}
              value={data.metadata.role || ""}
              onChange={(e) => updateMetadata("role", e.target.value)}
              required
            >
              <MenuItem value="ATTENDEE">{t("roles.attendee")}</MenuItem>
              <MenuItem value="PARTICIPANT">{t("roles.participant")}</MenuItem>
              <MenuItem value="SPEAKER">{t("roles.speaker")}</MenuItem>
              <MenuItem value="ORGANIZER">{t("roles.organizer")}</MenuItem>
            </TextField>
          </Section>
        );

      case "VOLUNTEER":
        return (
          <Section>
            <SectionTitle>{t("volunteerMetadata")}</SectionTitle>
            <TextField
              label={t("volunteerHours")}
              type="number"
              value={data.metadata.hours || ""}
              onChange={(e) =>
                updateMetadata("hours", e.target.value ? Number(e.target.value) : undefined)
              }
              required
            />
          </Section>
        );

      default:
        return null;
    }
  };

  const previewComponent = (
    <>
      <PreviewTitle
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {t("preview")}
      </PreviewTitle>

      <PreviewContainer>
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
          <ViewButton onClick={() => setIsPreviewOpen(true)} color="default" />
        </div>
        <ScrollablePreview>
          <div style={{ width: "525px", height: "375px", position: "relative" }}>
            {" "}
            {/* Wrapper for layout flow */}
            <div
              style={{
                width: "1050px", // Render width
                transform: "scale(0.5)",
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0
              }}
            >
              <Certificate data={previewData} />
            </div>
          </div>
        </ScrollablePreview>
      </PreviewContainer>

      {/* Overlay */}
      {isPreviewOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <Overlay onClick={() => setIsPreviewOpen(false)} style={{ zIndex: 99999 }}>
            <div style={{ position: "absolute", top: 20, right: 20, zIndex: 100000 }}>
              <HideButton onClick={() => setIsPreviewOpen(false)} />
            </div>
            <OverlayContent
              ref={contentRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `scale(${scale})`,
                width: "1050px", // Base width for layout calculation
                // Height is auto
                display: "flex",
                justifyContent: "center"
              }}
            >
              <Certificate data={previewData} />
            </OverlayContent>
          </Overlay>,
          document.body
        )}
    </>
  );

  return (
    <PageLayout>
      <FormColumn>
        <Form onSubmit={handleSubmit}>
          {/* Certificate Type */}
          <Section>
            <SectionTitle>{t("basicInfo")}</SectionTitle>
            <TextField
              select
              fullWidth
              label={t("certificateType")}
              value={data.type}
              onChange={(e) => updateField("type", e.target.value as CertificateType)}
              required
            >
              <MenuItem value="COURSE_COMPLETION">{t("types.courseCompletion")}</MenuItem>
              <MenuItem value="EVENT_ACHIEVEMENT">{t("types.eventAchievement")}</MenuItem>
              <MenuItem value="PARTICIPATION">{t("types.participation")}</MenuItem>
              <MenuItem value="VOLUNTEER">{t("types.volunteer")}</MenuItem>
            </TextField>

            <TwoCol style={{ marginTop: "12px" }}>
              <TextField
                label={t("title")}
                value={data.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
              <TextField
                select
                label={t("designId")}
                value={data.designId}
                onChange={(e) => updateField("designId", e.target.value)}
                required
              >
                {CERTIFICATE_DESIGNS.map((design) => (
                  <MenuItem key={design.id} value={design.id}>
                    {design.label}
                  </MenuItem>
                ))}
              </TextField>
            </TwoCol>

            <TextField
              label={t("description")}
              value={data.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              multiline
              minRows={2}
              fullWidth
              style={{ marginTop: "12px" }}
            />
          </Section>

          {/* Recipient */}
          <Section>
            <SectionTitle>{t("recipient")}</SectionTitle>
            <TwoCol>
              <Autocomplete
                freeSolo
                fullWidth
                options={recipientOptions}
                open={recipientOpen}
                onOpen={() => setRecipientOpen(true)}
                onClose={() => setRecipientOpen(false)}
                getOptionLabel={(option) =>
                  typeof option === "string"
                    ? option
                    : option.displayName || option.name || option._id
                }
                inputValue={recipientQuery}
                onInputChange={(_e, newValue) => {
                  setRecipientQuery(newValue);
                }}
                onChange={(_e, newValue) => {
                  if (typeof newValue === "string") {
                    // Manual text entry - set as name if name is empty
                    if (!data.recipient.name) {
                      updateRecipient("name", newValue);
                    }
                    updateRecipient("userId", "");
                  } else if (newValue) {
                    // Selected a user - auto-fill name if empty, set userId
                    if (!data.recipient.name) {
                      updateRecipient("name", newValue.displayName || newValue.name);
                    }
                    updateRecipient("userId", newValue._id);
                    setRecipientQuery(newValue.displayName || newValue.name);
                  }
                }}
                loading={recipientLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("linkToUser")}
                    placeholder={t("searchUser")}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {recipientLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
              <TextField
                label={t("recipientName")}
                value={data.recipient.name}
                onChange={(e) => updateRecipient("name", e.target.value)}
                placeholder={t("printedName")}
                required
              />
            </TwoCol>
            {data.recipient.userId && (
              <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#6b7280" }}>
                {t("linkedToUser")}: {data.recipient.userId}
              </div>
            )}
          </Section>

          {/* Period */}
          <Section>
            <SectionTitle>{t("period")}</SectionTitle>
            <TwoCol>
              <TextField
                label={t("startDate")}
                type="date"
                value={data.period?.startDate || ""}
                onChange={(e) => updatePeriod("startDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t("endDate")}
                type="date"
                value={data.period?.endDate || ""}
                onChange={(e) => updatePeriod("endDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </TwoCol>
          </Section>

          {/* Type-specific metadata */}
          {renderTypeSpecificFields()}

          {/* Signatures */}
          <Section>
            <SectionTitle>{t("signatures")}</SectionTitle>
            {data.signatures.map((sig, idx) => (
              <SignatureRow key={idx}>
                <SignatureFields>
                  <TextField
                    size="small"
                    label={t("signatureName")}
                    value={sig.name || ""}
                    onChange={(e) => updateSignature(idx, "name", e.target.value)}
                  />
                  <TextField
                    size="small"
                    label={t("signatureRole")}
                    value={sig.role || ""}
                    onChange={(e) => updateSignature(idx, "role", e.target.value)}
                  />
                  <TextField
                    size="small"
                    label={t("signatureImageUrl")}
                    value={sig.imageUrl || ""}
                    onChange={(e) => updateSignature(idx, "imageUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </SignatureFields>
                <DeleteButton iconSize={20} onClick={() => removeSignature(idx)} />
              </SignatureRow>
            ))}
            <AddButton iconSize={20} onClick={addSignature}>
              {t("addSignature")}
            </AddButton>
          </Section>

          {/* Mobile preview - before actions */}
          <MobilePreview>{previewComponent}</MobilePreview>

          {/* Actions */}
          <Actions>
            <SaveButton onClick={() => onSubmit(data)}>{t("save")}</SaveButton>
            {onCancel && <CancelButton onClick={onCancel}>{t("cancel")}</CancelButton>}
          </Actions>
        </Form>
      </FormColumn>

      {/* Desktop preview - side column */}
      <DesktopPreview>
        <PreviewColumn>{previewComponent}</PreviewColumn>
      </DesktopPreview>
    </PageLayout>
  );
}
