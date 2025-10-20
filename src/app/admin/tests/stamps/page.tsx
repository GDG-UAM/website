"use client";

import { useState, useCallback } from "react";
import Slider from "@mui/material/Slider";
import Stamp from "@/components/passport/Stamp";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  max-width: 40rem;
  margin: 0 auto;
`;

const SeedValue = styled.span`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace; /* font-mono */
`;

export default function AdminStampsPage() {
  const [seed, setSeed] = useState<number>(42);

  const handleSeedChange = useCallback((_: Event, value: number | number[]) => {
    setSeed(Array.isArray(value) ? value[0] : value);
  }, []);

  return (
    <Wrapper>
      <label htmlFor="seed-slider">
        Seed: <SeedValue>{seed}</SeedValue>
      </label>
      <Slider
        id="seed-slider"
        value={seed}
        min={0}
        max={500}
        step={1}
        onChange={handleSeedChange}
        aria-label="Stamp seed"
      />
      <Stamp seed={seed} width={550} height={550} viewBox="0 0 512 512">
        <path d="M452.295,0.495L185.162,67.278c-7.228,1.808-12.641,8.585-12.641,16.196c0,162.23,0,137.989,0,308.442    c-13.971-8.424-31.284-13.482-50.087-13.482c-46.033,0-83.479,29.957-83.479,66.783S76.401,512,122.434,512    c46.033,0,83.479-29.957,83.479-66.783V196.685l233.742-58.435v153.493c-13.972-8.425-31.285-13.484-50.088-13.484    c-46.033,0-83.479,29.957-83.479,66.783c0,36.827,37.447,66.783,83.479,66.783c46.033,0,83.479-29.957,83.479-66.783    c0-114.01,0-214.274,0-328.351C473.046,6.018,462.925-2.127,452.295,0.495z" />
      </Stamp>
    </Wrapper>
  );
}
