"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import Accordion from "@/components/Accordion";

const Wrapper = styled.div`
  background: transparent;
  border-radius: 12px;
  margin-top: 24px;
  gap: 12px;
  display: flex;
  flex-direction: column;
`;

type FaqItem = {
  id: string;
  question: string | React.ReactNode;
  answer: React.ReactNode;
};

const FAQ: React.FC<{ items: FaqItem[]; defaultOpenId?: string | null }> = ({
  items,
  defaultOpenId = null
}) => {
  const initial = useMemo(() => defaultOpenId, [defaultOpenId]);
  const [openId, setOpenId] = useState<string | null>(initial);

  return (
    <Wrapper>
      {items.map((it) => (
        <Accordion
          key={it.id}
          id={it.id}
          title={it.question}
          open={openId === it.id}
          onOpenChange={(open) => setOpenId(open ? it.id : null)}
        >
          {it.answer}
        </Accordion>
      ))}
    </Wrapper>
  );
};

export default FAQ;
