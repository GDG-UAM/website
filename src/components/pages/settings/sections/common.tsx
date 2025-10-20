"use client";
import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import styled from "styled-components";

export const Section: React.FC<{ title: string; children: React.ReactNode; mb?: number }> = ({
  title,
  children,
  mb = 4
}) => (
  <Box mb={mb} component="section">
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Stack spacing={2}>{children}</Stack>
  </Box>
);

export const DEBOUNCE_COMMIT_MS = 1000;

export const LabelGroupContainer = styled.div`
  & > label {
    margin: 0;
  }
`;
