"use client";
import { api } from "@/lib/eden";

import { useState, useMemo } from "react";
import styled from "styled-components";
import { blurHashToDataURL } from "@/lib/utils/blurhashClient";

const Container = styled.div`
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const Input = styled.input`
  flex: 1;
  min-width: 300px;
  padding: 12px 16px;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: var(--google-blue);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: var(--google-blue);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background: var(--color-gray-400);
    cursor: not-allowed;
  }
`;

const ResultCard = styled.div`
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  overflow: hidden;
  background: white;
  margin-top: 24px;
`;

const CardHeader = styled.div`
  padding: 12px 16px;
  background: var(--color-gray-100);
  font-weight: 600;
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 16px;
`;

const HoverImageContainer = styled.div`
  position: relative;
  width: 100%;
  max-height: 500px;
  background: var(--color-gray-100);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  .blur-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  .original-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  &:hover .original-image {
    opacity: 0;
  }
`;

const ErrorMessage = styled.div`
  color: var(--button-danger-bg);
  padding: 12px;
  background: color-mix(in srgb, var(--button-danger-bg) 10%, transparent);
  border-radius: 8px;
  margin-top: 16px;
`;

const InfoBox = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: var(--color-gray-50);
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
`;

const Label = styled.span`
  font-weight: 600;
  color: var(--color-gray-600);
`;

const HoverHint = styled.span`
  font-size: 0.85rem;
  color: var(--color-gray-500);
  font-weight: normal;
`;

const BlurPreviewRow = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const BlurPreviewBox = styled.div`
  flex: 0 0 200px;

  img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    image-rendering: pixelated;
    border: 1px solid var(--color-gray-200);
  }

  @media (max-width: 600px) {
    flex: 1;
    width: 100%;
    max-width: 200px;
  }
`;

const DataURLBox = styled.div`
  flex: 1;
  background: var(--color-gray-100);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.75rem;
  max-height: 150px;
  overflow: auto;
  word-break: break-all;
  font-family: monospace;
`;

export default function BlurHashTestPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    originalUrl: string;
    blurHash: string | null;
    width: number | null;
    height: number | null;
    processingTime: number;
  } | null>(null);

  // Decode BlurHash to data URL on the client
  const blurDataURL = useMemo(() => {
    if (!result?.blurHash || !result.width || !result.height) return null;
    return blurHashToDataURL(result.blurHash, result.width, result.height);
  }, [result?.blurHash, result?.width, result?.height]);

  const handleTest = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error } = await api.admin.tests.blurhash.post({ url: url.trim() });

      if (error) {
        setError(
          // @ts-expect-error value.error may not exist
          typeof error === "string" ? error : error?.value?.error || "Failed to generate BlurHash"
        );
        return;
      }

      if (data) {
        setResult({
          originalUrl: url.trim(),
          blurHash: data.blurHash,
          width: data.width,
          height: data.height,
          processingTime: data.processingTime
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Compute aspect ratio for the image container
  const aspectRatio =
    result?.width && result?.height ? `${result.width} / ${result.height}` : "16 / 9";

  return (
    <Container>
      <Title>BlurHash Test Tool</Title>
      <p style={{ marginBottom: 16, color: "var(--color-gray-600)" }}>
        Enter an image URL to test BlurHash generation. Hover over the result image to toggle
        between the original and the BlurHash placeholder.
      </p>

      <InputRow>
        <Input
          type="url"
          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTest()}
        />
        <Button onClick={handleTest} disabled={loading || !url.trim()}>
          {loading ? "Generating..." : "Generate BlurHash"}
        </Button>
      </InputRow>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {result && (
        <>
          <InfoBox>
            <div>
              <Label>Processing Time:</Label> {result.processingTime}ms
            </div>
            {result.width && result.height && (
              <div style={{ marginTop: 8 }}>
                <Label>Original Dimensions:</Label> {result.width} × {result.height}px
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Label>BlurHash:</Label>{" "}
              {result.blurHash ? (
                <span style={{ color: "green" }}>
                  <code
                    style={{
                      background: "var(--color-gray-100)",
                      padding: "2px 6px",
                      borderRadius: 4
                    }}
                  >
                    {result.blurHash}
                  </code>{" "}
                  ({result.blurHash.length} chars)
                </span>
              ) : (
                <span style={{ color: "red" }}>Failed to generate</span>
              )}
            </div>
            {blurDataURL && (
              <div style={{ marginTop: 8 }}>
                <Label>Decoded Data URL:</Label>{" "}
                <span style={{ color: "var(--color-gray-500)" }}>
                  {blurDataURL.length} chars (decoded on client)
                </span>
              </div>
            )}
          </InfoBox>

          <ResultCard>
            <CardHeader>
              <span>Image Comparison</span>
              <HoverHint>Hover to see BlurHash placeholder</HoverHint>
            </CardHeader>
            <CardBody>
              <HoverImageContainer style={{ aspectRatio }}>
                {blurDataURL && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={blurDataURL} alt="BlurHash placeholder" className="blur-image" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.originalUrl} alt="Original" className="original-image" />
              </HoverImageContainer>

              {blurDataURL && (
                <BlurPreviewRow>
                  <BlurPreviewBox>
                    <Label style={{ display: "block", marginBottom: 8 }}>
                      BlurHash Preview (scaled up):
                    </Label>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={blurDataURL} alt="BlurHash preview" />
                  </BlurPreviewBox>
                  <DataURLBox>
                    <Label style={{ display: "block", marginBottom: 8 }}>Raw BlurHash:</Label>
                    <code>{result.blurHash}</code>
                  </DataURLBox>
                </BlurPreviewRow>
              )}

              <InfoBox>
                <Label>Original URL:</Label> {result.originalUrl}
              </InfoBox>
            </CardBody>
          </ResultCard>
        </>
      )}
    </Container>
  );
}
