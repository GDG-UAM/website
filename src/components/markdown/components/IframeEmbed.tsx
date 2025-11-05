"use client";

import React, { useState } from "react";
import styled from "styled-components";
import Tooltip from "@mui/material/Tooltip";

type IframeEmbedProps = {
  url: string;
  height?: string;
  title?: string;
  showTitleBar?: boolean;
};

const Container = styled.div`
  width: 100%;
  margin: 1em 0;
  border: 1px solid var(--markdown-table-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-white, #fff);
`;

const TitleBar = styled.div`
  padding: 8px 12px;
  background: var(--markdown-thead-bg, #f9fafb);
  border-bottom: 1px solid var(--markdown-table-border, #e5e7eb);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--markdown-base-text, #374151);

  @media (min-width: 768px) {
    flex-wrap: nowrap;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  order: 1;

  @media (min-width: 768px) {
    flex: 0 0 auto;
    order: 1;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const Favicon = styled.img`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
`;

const FaviconPlaceholder = styled.div`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: var(--markdown-inline-code-border, #d1d5db);
  border-radius: 2px;
`;

const TitleText = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const URLBar = styled.a`
  flex: 1;
  min-width: 0;
  width: 100%;
  flex-basis: 100%;
  padding: 4px 12px;
  background: var(--color-white, #fff);
  border: 1px solid var(--markdown-table-border, #e5e7eb);
  border-bottom: 1px solid var(--markdown-table-border, #e5e7eb) !important;
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--markdown-base-text, #6b7280);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.2s;
  order: 3;

  &:hover {
    background: var(--markdown-callout-bg, #f9fafb);
    border-color: var(--markdown-inline-code-border, #d1d5db);
  }

  @media (min-width: 768px) {
    width: auto;
    flex-basis: auto;
    order: 2;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
  margin-left: 0;
  border-radius: 4px;
  transition: background 0.2s;
  order: 2;
  flex-shrink: 0;

  &:hover {
    background: var(--markdown-callout-bg, #e5e7eb);
  }

  @media (min-width: 768px) {
    order: 3;
  }
`;

const BrowserButton = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.1);
  }
`;

const MinimizeButton = styled(BrowserButton)`
  background: var(--google-yellow);
`;

const MaximizeButton = styled(BrowserButton)`
  background: var(--google-green);
`;

const CloseButton = styled(BrowserButton)`
  background: var(--google-red);
`;

const IframeWrapper = styled.div<{ $collapsed: boolean; $height: string }>`
  position: relative;
  width: 100%;
  overflow: hidden;
  max-height: ${({ $collapsed, $height }) => ($collapsed ? "0" : `${$height}px`)};
  transition: max-height 0.3s ease-in-out;
`;

const StyledIframe = styled.iframe`
  width: 100%;
  border: none;
  display: block;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--markdown-callout-bg, #f9fafb);
  color: var(--markdown-base-text, #6b7280);
  font-size: 0.9rem;
`;

export default function IframeEmbed({
  url,
  height = "450",
  title,
  showTitleBar = true
}: IframeEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

  // Check if URL is valid
  const hasValidUrl = url && url.trim().length > 0;

  // Extract domain and favicon URL
  const { hostname, faviconUrl } = React.useMemo(() => {
    if (!hasValidUrl) {
      return { hostname: "No URL provided", faviconUrl: null };
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, "");
      const origin = urlObj.origin;

      return {
        hostname,
        faviconUrl: `${origin}/favicon.ico`
      };
    } catch {
      return { hostname: url, faviconUrl: null };
    }
  }, [url, hasValidUrl]);

  // Fetch page title if no custom title is provided
  React.useEffect(() => {
    if (!hasValidUrl || title) {
      return;
    }

    const fetchTitle = async () => {
      try {
        const response = await fetch(`/api/fetch-page-title?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.title) {
            setFetchedTitle(data.title);
          }
        }
      } catch (err) {
        // Silently fail, will use hostname as fallback
        console.error("Failed to fetch page title:", err);
      }
    };

    fetchTitle();
  }, [url, title, hasValidUrl]);

  const displayTitle = title || fetchedTitle || hostname;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleURLClick = (e: React.MouseEvent) => {
    // Allow default link behavior (open in new tab)
    e.stopPropagation();
  };

  return (
    <Container>
      {showTitleBar && (
        <TitleBar>
          <TopRow>
            <LeftSection>
              {faviconUrl ? (
                <Favicon
                  src={faviconUrl}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <FaviconPlaceholder />
              )}
              <TitleText>{displayTitle}</TitleText>
            </LeftSection>
          </TopRow>
          <URLBar
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleURLClick}
            title={url}
          >
            {url}
          </URLBar>
          <Tooltip title={collapsed ? "Expand" : "Collapse"} arrow>
            <RightSection onClick={toggleCollapse}>
              <MinimizeButton aria-label="Minimize" />
              <MaximizeButton aria-label="Maximize" />
              <CloseButton aria-label="Close" />
            </RightSection>
          </Tooltip>
        </TitleBar>
      )}
      <IframeWrapper $collapsed={collapsed} $height={height}>
        {!hasValidUrl ? (
          <LoadingOverlay>No URL provided</LoadingOverlay>
        ) : (
          <>
            {loading && !error && <LoadingOverlay>Loading embedded content...</LoadingOverlay>}
            {error && <LoadingOverlay>Failed to load embedded content</LoadingOverlay>}
            <StyledIframe
              src={url}
              height={height}
              title={displayTitle}
              onLoad={handleLoad}
              onError={handleError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </>
        )}
      </IframeWrapper>
    </Container>
  );
}
