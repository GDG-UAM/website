"use client";

import React from "react";
import styled from "styled-components";
import { renderMarkdown } from "@/lib/markdown";
import UserMention from "@/components/markdown/components/UserMention";
import AudioVisualizer from "@/components/audio/AudioPlayerVisualizer";
import { OpenLinkButton } from "@/components/Buttons";
import parse, { type DOMNode, type Element } from "html-react-parser";
import { useTranslations } from "next-intl";

type RenderMarkdownProps = {
  markdown?: string;
  html?: string;
  className?: string;
  style?: React.CSSProperties;
};

const Wrapper = styled.div`
  /* Base */
  line-height: 1.7;
  color: var(--markdown-base-text);

  & > *:first-child {
    margin-top: 0;
  }
  & > *:last-child {
    margin-bottom: 0;
  }

  /* Headings */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--markdown-heading-text);
    line-height: 1.25;
    margin: 1.25em 0 0.5em;
    font-weight: 700;
  }
  h1 {
    font-size: 2rem;
  }
  h2 {
    font-size: 1.6rem;
    border-bottom: 1px solid var(--markdown-h2-border);
    padding-bottom: 0.25em;
  }
  h3 {
    font-size: 1.3rem;
  }
  h4 {
    font-size: 1.1rem;
  }

  /* Paragraphs */
  p {
    margin: 0.8em 0;
  }

  /* Links */
  a {
    color: var(--markdown-link, var(--google-blue));
    text-decoration: none;
    border-bottom: 1px solid
      color-mix(in oklab, var(--markdown-link, var(--google-blue)), transparent 65%);
    transition: border-bottom-color 0.2s ease-in-out;
  }
  a:hover,
  a:focus {
    border-bottom-color: var(--blue);
  }

  /* Lists */
  ul,
  ol {
    margin: 0.8em 0;
  }
  li {
    margin: 0.25em 0;
  }

  /* Code */
  code {
    background: var(--markdown-inline-code-bg);
    border: 1px solid var(--markdown-inline-code-border);
    padding: 0.15em 0.35em;
    border-radius: 4px;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
      monospace;
    font-size: 0.92em;
  }
  pre {
    background: var(--markdown-code-bg);
    color: var(--markdown-code-text);
    border-radius: 8px;
    padding: 12px 14px;
    overflow: auto;
    border: 1px solid var(--markdown-code-border);
  }
  pre code {
    background: transparent;
    border: 0;
    padding: 0;
    color: inherit;
    font-size: 0.95em;
  }

  /* highlight.js basic theme tweaks */
  code[class*="language-"],
  pre[class*="language-"] {
    color: var(--markdown-code-text);
    background: var(--markdown-code-bg);
  }
  .hljs-comment,
  .hljs-quote {
    color: var(--markdown-hl-comment);
  }
  .hljs-keyword,
  .hljs-selector-tag {
    color: var(--markdown-hl-keyword);
  }
  .hljs-literal,
  .hljs-symbol,
  .hljs-name {
    color: var(--markdown-hl-literal);
  }
  .hljs-number,
  .hljs-attr {
    color: var(--markdown-hl-number);
  }
  .hljs-string,
  .hljs-bullet {
    color: var(--markdown-hl-string);
  }
  .hljs-title,
  .hljs-section {
    color: var(--markdown-hl-title);
  }
  .hljs-built_in {
    color: var(--markdown-hl-built-in);
  }
  .hljs-attribute {
    color: var(--markdown-hl-attribute);
  }
  .hljs-params,
  .hljs-class .hljs-title {
    color: var(--markdown-hl-params);
  }

  /* Blockquote */
  blockquote {
    margin: 1em 0;
    padding: 0 1em;
    border-left: 4px solid var(--markdown-blockquote-border);
    background: var(--markdown-blockquote-bg);
    color: var(--markdown-blockquote-text);
  }

  /* Tables */
  table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
  }
  th,
  td {
    border: 1px solid var(--markdown-table-border);
    padding: 8px 10px;
    text-align: left;
  }
  thead th {
    background: var(--markdown-thead-bg);
    font-weight: 600;
  }

  /* HR */
  hr {
    border: 0;
    border-top: 1px solid var(--markdown-hr-border);
    margin: 1.5em 0;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }

  /* Custom callouts created by our Markdown extension */
  .callout {
    border: 1px solid var(--markdown-callout-border);
    border-left: 4px solid var(--markdown-callout-left);
    background: var(--markdown-callout-bg);
    border-radius: 8px;
    padding: 10px 12px;
    margin: 1em 0;
  }
  .callout-title {
    font-weight: 700;
    margin-bottom: 6px;
  }
  .callout-content > :first-child {
    margin-top: 0;
  }
  .callout-content > :last-child {
    margin-bottom: 0;
  }

  .callout-note {
    border-left-color: var(--markdown-callout-note-left);
    background: var(--markdown-callout-note-bg);
  }
  .callout-tip {
    border-left-color: var(--markdown-callout-tip-left);
    background: var(--markdown-callout-tip-bg);
  }
  .callout-warning {
    border-left-color: var(--markdown-callout-warning-left);
    background: var(--markdown-callout-warning-bg);
  }
  .callout-danger {
    border-left-color: var(--markdown-callout-danger-left);
    background: var(--markdown-callout-danger-bg);
  }

  /* Audio player embedded in markdown */
  audioplayer {
    display: block;
    margin: 1em 0;
  }

  /* See more button embedded in markdown */
  seemorebutton {
    display: block;
    margin: 1em 0;
  }
`;

export function RenderMarkdown({ markdown, html, className, style }: RenderMarkdownProps) {
  const [resolvedHtml, setResolvedHtml] = React.useState<string>(html || "");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations("markdown.components");

  // Resolve markdown -> sanitized HTML
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (html !== undefined && html !== null) {
        if (!cancelled) setResolvedHtml(String(html));
        return;
      }
      if (typeof markdown === "string") {
        try {
          const res = await renderMarkdown(markdown);
          if (!cancelled) setResolvedHtml(res.html);
        } catch {
          if (!cancelled) setResolvedHtml("");
        }
      } else {
        if (!cancelled) setResolvedHtml("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markdown, html]);

  // Parse sanitized HTML into React and replace <usermention> with <UserMention/>
  const reactTree = React.useMemo(() => {
    if (!resolvedHtml) return null;
    const isTag = (node: DOMNode): node is Element => {
      return (node as Element).type === "tag";
    };
    return parse(resolvedHtml, {
      replace(node) {
        if (isTag(node) && node.name === "usermention") {
          const id = (node.attribs && node.attribs["data-id"]) || null;
          return <UserMention userId={id} />;
        }
        if (isTag(node) && node.name === "audioplayer") {
          const url = (node.attribs && node.attribs["data-url"]) || "";
          const barsStr = (node.attribs && node.attribs["data-bars"]) || "100";
          const mobileBarsStr = (node.attribs && node.attribs["data-bars-mobile"]) || "50";
          const bars = parseInt(barsStr, 10) || 100;
          const mobileBars = parseInt(mobileBarsStr, 10) || 50;
          return <AudioVisualizer audioUrl={url} bars={bars} mobileBars={mobileBars} />;
        }
        if (isTag(node) && node.name === "seemorebutton") {
          console.log("Rendering seemorebutton", node);
          const href = (node.attribs && node.attribs["data-href"]) || "";
          const text = (node.attribs && node.attribs["data-text"]) || t("seeMoreButton");
          const label = (node.attribs && node.attribs["data-label"]) || t("seeMoreButton");
          return (
            <OpenLinkButton
              href={href}
              ariaLabel={label}
              slim
              color="default"
              disabled={!href}
              style={{ marginBottom: 16 }}
            >
              {text}
            </OpenLinkButton>
          );
        }
        return undefined;
      }
    });
  }, [resolvedHtml, t]);

  return (
    <Wrapper ref={containerRef} className={className} style={style}>
      {reactTree}
    </Wrapper>
  );
}

export default RenderMarkdown;
