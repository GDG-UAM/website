"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  SaveButton,
  CancelButton,
  AddButton,
  DeleteButton,
  EditButton
} from "@/components/Buttons";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useTranslations } from "next-intl";
import { CarouselEditor } from "./CarouselEditor";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
  width: 100%;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const EntryBox = styled.div`
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
`;

const ScrollContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 500px;
  overflow-y: auto;

  /* Subtle scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #d0d0d0;
  }
`;

const ListItem = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: transparent;

  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 20px;
`;

const ListInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
`;

const ScheduleInputs = styled(ListInputs)`
  grid-template-columns: 135px 135px 1fr;

  @media (max-width: 600px) {
    grid-template-columns: 1fr 1fr;
    & > :last-child {
      grid-column: span 2;
    }
  }
`;

export type CarouselElementType = "container" | "text" | "qr" | "image" | "spacer";

export interface CarouselElement {
  id: string;
  type: CarouselElementType;
  props: {
    // Text props
    content?: string;
    variant?: "h1" | "h2" | "h3" | "body";
    color?: string;
    align?: "left" | "center" | "right";
    fontSize?: string;
    fontWeight?: string;

    // Container props
    direction?: "row" | "column";
    gap?: number;
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
    flex?: number;
    padding?: string;

    // QR props
    value?: string;
    size?: number;
    cornerSize?: number;
    cornerColor?: string;
    logoUrl?: string;
    logoSize?: number;

    // Image props
    url?: string;
    alt?: string;
    height?: string;
    width?: string;
    objectFit?: "contain" | "cover";

    // Spacer props
    grow?: number;
    heightPx?: number;
    widthPx?: number;
  };
  children?: CarouselElement[];
}

export interface CarouselSlide {
  id: string;
  duration: number;
  root: CarouselElement;
  label?: string; // Keep label for administrative naming
}

export interface IntermissionData {
  organizerLogoUrl?: string;
  schedule: {
    startTime: string;
    endTime?: string;
    title: string;
  }[];
  carousel: CarouselSlide[];
  sponsors: {
    name: string;
    logoUrl: string;
    tier: number;
  }[];
}

export function IntermissionForm({
  initial,
  onCancel,
  onSubmit,
  submitting
}: {
  initial?: Partial<IntermissionData>;
  onCancel?: () => void;
  onSubmit: (data: IntermissionData) => Promise<void> | void;
  submitting?: boolean;
}) {
  const t = useTranslations("admin.hackathons");
  const ti = useTranslations("admin.hackathons.intermission");

  const [data, setData] = useState<IntermissionData>({
    organizerLogoUrl: initial?.organizerLogoUrl || "",
    schedule: initial?.schedule || [],
    carousel: initial?.carousel || [],
    sponsors: initial?.sponsors || []
  });

  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initial) {
      setData({
        organizerLogoUrl: initial.organizerLogoUrl || "",
        schedule: initial.schedule || [],
        carousel: initial.carousel || [],
        sponsors: initial.sponsors || []
      });
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  // Schedule management
  const addScheduleItem = () => {
    const lastItem = data.schedule[data.schedule.length - 1];
    setData({
      ...data,
      schedule: [
        ...data.schedule,
        {
          startTime: lastItem?.endTime || "09:00",
          endTime: "",
          title: ""
        }
      ]
    });
  };

  const removeScheduleItem = (index: number) => {
    const newSchedule = [...data.schedule];
    newSchedule.splice(index, 1);
    setData({ ...data, schedule: newSchedule });
  };

  const updateScheduleItem = (index: number, field: string, value: string) => {
    const newSchedule = [...data.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setData({ ...data, schedule: newSchedule });
  };

  // Carousel management
  const addCarouselItem = () => {
    const newSlide: CarouselSlide = {
      id: Math.random().toString(36).substr(2, 9),
      duration: 30,
      label: `Slide ${data.carousel.length + 1}`,
      root: {
        id: "root",
        type: "container",
        props: { direction: "column", gap: 20, alignItems: "center", justifyContent: "center" },
        children: [
          {
            id: Math.random().toString(36).substr(2, 9),
            type: "text",
            props: { content: "New Slide", variant: "h2", align: "center" }
          }
        ]
      }
    };
    setData({
      ...data,
      carousel: [...data.carousel, newSlide]
    });
    setEditingSlideIndex(data.carousel.length);
  };

  const removeCarouselItem = (index: number) => {
    const newCarousel = [...data.carousel];
    newCarousel.splice(index, 1);
    setData({ ...data, carousel: newCarousel });
  };

  const updateCarouselSlide = (index: number, slide: CarouselSlide) => {
    const newCarousel = [...data.carousel];
    newCarousel[index] = slide;
    setData({ ...data, carousel: newCarousel });
  };

  // Sponsor management
  const addSponsor = () => {
    setData({
      ...data,
      sponsors: [...data.sponsors, { name: "", logoUrl: "", tier: 2 }]
    });
  };

  const removeSponsor = (index: number) => {
    const newSponsors = [...data.sponsors];
    newSponsors.splice(index, 1);
    setData({ ...data, sponsors: newSponsors });
  };

  const updateSponsor = (index: number, field: string, value: string | number) => {
    const newSponsors = [...data.sponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    setData({ ...data, sponsors: newSponsors });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Section>
        <SectionTitle>{ti("sections.general")}</SectionTitle>
        <TextField
          label={ti("fields.organizerLogo")}
          value={data.organizerLogoUrl}
          onChange={(e) => setData({ ...data, organizerLogoUrl: e.target.value })}
          fullWidth
          disabled={submitting}
        />
      </Section>

      <Section>
        <Row>
          <SectionTitle>{ti("sections.schedule")}</SectionTitle>
          <AddButton onClick={addScheduleItem} disabled={submitting} iconSize={20}>
            {ti("actions.addEntry")}
          </AddButton>
        </Row>
        <EntryBox>
          <ScrollContainer>
            {data.schedule.map((item, index) => (
              <ListItem key={index}>
                <ScheduleInputs>
                  <TextField
                    label={ti("fields.startTime")}
                    type="time"
                    value={item.startTime}
                    onChange={(e) => updateScheduleItem(index, "startTime", e.target.value)}
                    size="small"
                  />
                  <TextField
                    label={ti("fields.endTime")}
                    type="time"
                    value={item.endTime}
                    onChange={(e) => updateScheduleItem(index, "endTime", e.target.value)}
                    size="small"
                  />
                  <TextField
                    label={ti("fields.activityTitle")}
                    value={item.title}
                    onChange={(e) => updateScheduleItem(index, "title", e.target.value)}
                    size="small"
                  />
                </ScheduleInputs>
                <DeleteButton onClick={() => removeScheduleItem(index)} iconSize={20} />
              </ListItem>
            ))}
            {data.schedule.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#888" }}>
                {ti("empty.schedule")}
              </div>
            )}
          </ScrollContainer>
        </EntryBox>
      </Section>

      <Section>
        <Row>
          <SectionTitle>{ti("sections.carousel")}</SectionTitle>
          <AddButton onClick={addCarouselItem} disabled={submitting} iconSize={20}>
            {ti("actions.addItem")}
          </AddButton>
        </Row>
        <EntryBox>
          <ScrollContainer>
            {data.carousel.map((item, index) => (
              <ListItem key={index}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.label || `Slide ${index + 1}`}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      {item.duration}s • {item.root.children?.length || 0} elements
                    </div>
                  </div>
                  <EditButton onClick={() => setEditingSlideIndex(index)} iconSize={20} />
                </div>
                <DeleteButton onClick={() => removeCarouselItem(index)} iconSize={20} />
              </ListItem>
            ))}
            {data.carousel.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#888" }}>
                {ti("empty.carousel")}
              </div>
            )}
          </ScrollContainer>
        </EntryBox>

        <Dialog
          open={editingSlideIndex !== null}
          onClose={() => setEditingSlideIndex(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Edit Slide Layout</DialogTitle>
          <DialogContent dividers>
            {editingSlideIndex !== null && (
              <CarouselEditor
                slide={data.carousel[editingSlideIndex]}
                onChange={(updatedSlide) => updateCarouselSlide(editingSlideIndex, updatedSlide)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <SaveButton onClick={() => setEditingSlideIndex(null)}>Done</SaveButton>
          </DialogActions>
        </Dialog>
      </Section>

      <Section>
        <Row>
          <SectionTitle>{ti("sections.sponsors")}</SectionTitle>
          <AddButton onClick={addSponsor} disabled={submitting} iconSize={20}>
            {ti("actions.addSponsor")}
          </AddButton>
        </Row>
        <EntryBox>
          <ScrollContainer>
            {data.sponsors.map((item, index) => (
              <ListItem key={index}>
                <ListInputs>
                  <TextField
                    label={ti("fields.sponsorName")}
                    value={item.name}
                    onChange={(e) => updateSponsor(index, "name", e.target.value)}
                    size="small"
                  />
                  <TextField
                    label={ti("fields.sponsorLogo")}
                    value={item.logoUrl}
                    onChange={(e) => updateSponsor(index, "logoUrl", e.target.value)}
                    size="small"
                  />
                  <FormControl size="small">
                    <InputLabel>{ti("fields.sponsorTier")}</InputLabel>
                    <Select
                      value={item.tier}
                      label={ti("fields.sponsorTier")}
                      onChange={(e) => updateSponsor(index, "tier", Number(e.target.value))}
                      size="small"
                    >
                      <MenuItem value={0}>{ti("tiers.platinum")}</MenuItem>
                      <MenuItem value={1}>{ti("tiers.gold")}</MenuItem>
                      <MenuItem value={2}>{ti("tiers.silver")}</MenuItem>
                    </Select>
                  </FormControl>
                </ListInputs>
                <DeleteButton onClick={() => removeSponsor(index)} iconSize={20} />
              </ListItem>
            ))}
            {data.sponsors.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#888" }}>
                {ti("empty.sponsors")}
              </div>
            )}
          </ScrollContainer>
        </EntryBox>
      </Section>

      <Actions>
        <SaveButton onClick={submitForm} disabled={submitting}>
          {t("form.save")}
        </SaveButton>
        {onCancel && (
          <CancelButton onClick={onCancel} disabled={submitting}>
            {t("form.cancel")}
          </CancelButton>
        )}
      </Actions>
    </Form>
  );

  function submitForm() {
    const form = document.querySelector("form");
    form?.requestSubmit();
  }
}
