import sanitizeHtml from "sanitize-html";
import { marked, MarkedExtension, type Token } from "marked";
import hljs from "highlight.js";
import { markedHighlight } from "marked-highlight";

// Configure marked for GitHub-flavored markdown features
marked.setOptions({
  gfm: true,
  breaks: false
});

// Syntax highlighting for fenced code blocks
marked.use(
  markedHighlight({
    langPrefix: "language-",
    highlight(code: string, lang?: string) {
      try {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      } catch {
        return code;
      }
    }
  }) as MarkedExtension
);

// --- Inline extensions: sub (~text~), sup (^text^), mark (==text==), footnote refs ([^id]) ---
type InlineToken = { type: string; raw: string; text?: string; id?: string };

let currentFootnotes: Map<string, string> | null = null;
let usedFootnoteOrder: string[] = [];

function pushUsedFootnote(id: string) {
  if (!usedFootnoteOrder.includes(id)) usedFootnoteOrder.push(id);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Helper to extract attribute value from a tag
function extractAttr(attrs: string, name: string): string {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s"'>]+))`).exec(attrs);
  return match ? (match[1] || match[2] || match[3] || "").trim() : "";
}

// Helper to render user mention HTML
function renderUserMention(id: string): string {
  const safeId = escapeHtml(id);
  return `<usermention data-id="${safeId}" aria-label="Mention @user"></usermention>`;
}

// Helper to render audio player HTML
function renderAudioPlayer(url: string, bars: string, mobileBars: string): string {
  const safeUrl = escapeHtml(url);
  const safeBars = escapeHtml(bars);
  const safeMobileBars = escapeHtml(mobileBars);
  return `<audioplayer data-url="${safeUrl}" data-bars="${safeBars}" data-bars-mobile="${safeMobileBars}"></audioplayer>`;
}

// Helper to render see more button HTML
function renderSeeMoreButton(href: string, text?: string, label?: string): string {
  const safeHref = escapeHtml(href);
  let finalText: string | undefined = undefined;
  if (text && text.trim()) {
    finalText = escapeHtml(text.trim());
  }
  let finalLabel: string | undefined = undefined;
  if (label && label.trim()) {
    finalLabel = escapeHtml(label.trim());
  }
  let ret = `<seemorebutton data-href="${safeHref}"`;
  if (finalText) {
    ret += ` data-text="${finalText}"`;
  }
  if (finalLabel) {
    ret += ` data-label="${finalLabel}"`;
  }
  ret += `></seemorebutton>`;
  return ret;
}

// Helper to render iframe embed HTML
function renderIframeEmbed(
  url: string,
  height?: string,
  title?: string,
  showTitleBar?: string
): string {
  const safeUrl = escapeHtml(url);
  const safeHeight = height ? escapeHtml(height) : "450";
  const safeShowTitleBar = showTitleBar === "false" ? "false" : "true";
  let ret = `<embedweb data-url="${safeUrl}" data-height="${safeHeight}" data-show-title-bar="${safeShowTitleBar}"`;
  if (title && title.trim()) {
    const safeTitle = escapeHtml(title.trim());
    ret += ` data-title="${safeTitle}"`;
  }
  ret += `></embedweb>`;
  return ret;
}

marked.use({
  extensions: [
    // inline user mention: <user data-id="..." />
    {
      name: "user_mention_inline",
      level: "inline",
      start(src: string) {
        return src.indexOf("<user");
      },
      tokenizer(src: string) {
        const cap = /^<user\b([^>]*?)(?:\s*\/>|>(?:\s*<\/user\s*>))/.exec(src);
        if (!cap) return undefined;
        const id = extractAttr(cap[1] || "", "data-id");
        return { type: "user_mention_inline", raw: cap[0], id } as InlineToken;
      },
      renderer(token: InlineToken) {
        return renderUserMention(token.id || "");
      }
    },
    // block user mention (when on its own line)
    // {
    //   name: "user_mention_block",
    //   level: "block",
    //   start(src: string) {
    //     return src.indexOf("<user");
    //   },
    //   tokenizer(src: string) {
    //     const cap = /^<user\b([^>]*?)(?:\s*\/>|>(?:\s*<\/user\s*>))(?:\s*\n)?/.exec(src);
    //     if (!cap) return undefined;
    //     const id = extractAttr(cap[1] || "", "data-id");
    //     return { type: "user_mention_block", raw: cap[0], id } as Token & { id: string };
    //   },
    //   renderer(token: Token & { id?: string }) {
    //     return renderUserMention(token.id || "");
    //   }
    // },
    // inline audio player: <audioplayer url="..." bars="..." />
    {
      name: "audio_player_inline",
      level: "inline",
      start(src: string) {
        return src.indexOf("<audioplayer");
      },
      tokenizer(src: string) {
        const cap = /^<audioplayer\b([^>]*?)(?:\s*\/>|>(?:\s*<\/audioplayer\s*>))/.exec(src);
        if (!cap) return undefined;
        const attrs = cap[1] || "";
        const url = extractAttr(attrs, "url");
        const bars = extractAttr(attrs, "bars") || "100";
        const mobileBars = extractAttr(attrs, "bars-mobile") || "50";
        return {
          type: "audio_player_inline",
          raw: cap[0],
          url,
          bars,
          mobileBars
        } as InlineToken & {
          url: string;
          bars: string;
          mobileBars: string;
        };
      },
      renderer(token: InlineToken & { url?: string; bars?: string; mobileBars?: string }) {
        return renderAudioPlayer(token.url || "", token.bars || "100", token.mobileBars || "50");
      }
    },
    // block audio player (when on its own line)
    {
      name: "audio_player_block",
      level: "block",
      start(src: string) {
        return src.indexOf("<audioplayer");
      },
      tokenizer(src: string) {
        const cap = /^<audioplayer\b([^>]*?)(?:\s*\/>|>(?:\s*<\/audioplayer\s*>))(?:\s*\n)?/.exec(
          src
        );
        if (!cap) return undefined;
        const attrs = cap[1] || "";
        const url = extractAttr(attrs, "url");
        const bars = extractAttr(attrs, "bars") || "100";
        const mobileBars = extractAttr(attrs, "bars-mobile") || "50";
        return { type: "audio_player_block", raw: cap[0], url, bars, mobileBars } as Token & {
          url: string;
          bars: string;
          mobileBars: string;
        };
      },
      renderer(token: Token & { url?: string; bars?: string; mobileBars?: string }) {
        return renderAudioPlayer(token.url || "", token.bars || "100", token.mobileBars || "50");
      }
    },
    // block see more button: <seemorebutton href="..." label="..." />
    {
      name: "see_more_button_block",
      level: "block",
      start(src: string) {
        return src.indexOf("<seemorebutton");
      },
      tokenizer(src: string) {
        const cap =
          /^<seemorebutton\b([^>]*?)(?:\s*\/>|>(?:\s*<\/seemorebutton\s*>))(?:\s*\n)?/.exec(src);
        if (!cap) return undefined;
        const attrs = cap[1] || "";
        const href = extractAttr(attrs, "href");
        const text = extractAttr(attrs, "text");
        const label = extractAttr(attrs, "label");
        return { type: "see_more_button_block", raw: cap[0], href, text, label } as Token & {
          href: string;
          text?: string;
          label?: string;
        };
      },
      renderer(token: Token & { href?: string; text?: string; label?: string }) {
        return renderSeeMoreButton(token.href || "", token.text, token.label);
      }
    },
    // block iframe embed: <embedweb url="..." height="..." title="..." showTitleBar="..." />
    {
      name: "embed_web_block",
      level: "block",
      start(src: string) {
        return src.indexOf("<embedweb");
      },
      tokenizer(src: string) {
        const cap = /^<embedweb\b([^>]*?)(?:\s*\/>|>(?:\s*<\/embedweb\s*>))(?:\s*\n)?/.exec(src);
        if (!cap) return undefined;
        const attrs = cap[1] || "";
        const url = extractAttr(attrs, "url");
        const height = extractAttr(attrs, "height");
        const title = extractAttr(attrs, "title");
        const showTitleBar = extractAttr(attrs, "showTitleBar");
        return {
          type: "embed_web_block",
          raw: cap[0],
          url,
          height,
          title,
          showTitleBar
        } as Token & {
          url: string;
          height?: string;
          title?: string;
          showTitleBar?: string;
        };
      },
      renderer(
        token: Token & { url?: string; height?: string; title?: string; showTitleBar?: string }
      ) {
        return renderIframeEmbed(token.url || "", token.height, token.title, token.showTitleBar);
      }
    },
    // subscript: ~text~ (avoid ~~ which is strikethrough)
    {
      name: "sub",
      level: "inline",
      start(src: string) {
        return src.indexOf("~");
      },
      tokenizer(src: string) {
        const cap = /^~(?!~)(.+?)~/.exec(src);
        if (cap) {
          return { type: "sub", raw: cap[0], text: cap[1] } as InlineToken;
        }
        return undefined;
      },
      renderer(token: InlineToken) {
        return `<sub>${escapeHtml(token.text || "")}</sub>`;
      }
    },
    // superscript: ^text^
    {
      name: "sup",
      level: "inline",
      start(src: string) {
        return src.indexOf("^");
      },
      tokenizer(src: string) {
        const cap = /^\^(?!\^)(.+?)\^/.exec(src);
        if (cap) {
          return { type: "sup", raw: cap[0], text: cap[1] } as InlineToken;
        }
        return undefined;
      },
      renderer(token: InlineToken) {
        return `<sup>${escapeHtml(token.text || "")}</sup>`;
      }
    },
    // mark: ==text==
    {
      name: "mark",
      level: "inline",
      start(src: string) {
        return src.indexOf("==");
      },
      tokenizer(src: string) {
        const cap = /^==(.+?)==/.exec(src);
        if (cap) {
          return { type: "mark", raw: cap[0], text: cap[1] } as InlineToken;
        }
        return undefined;
      },
      renderer(token: InlineToken) {
        return `<mark>${escapeHtml(token.text || "")}</mark>`;
      }
    },
    // footnote reference: [^id]
    {
      name: "footnote_ref",
      level: "inline",
      start(src: string) {
        return src.indexOf("[^");
      },
      tokenizer(src: string) {
        const cap = /^\[\^([^\]]+)\]/.exec(src);
        if (cap) {
          const id = cap[1];
          if (currentFootnotes && currentFootnotes.has(id)) {
            pushUsedFootnote(id);
            return { type: "footnote_ref", raw: cap[0], id } as InlineToken;
          }
        }
        return undefined;
      },
      renderer(token: InlineToken) {
        const id = token.id || "";
        const idx = usedFootnoteOrder.indexOf(id) + 1;
        const num = idx > 0 ? String(idx) : "";
        return `<sup class="footnote-ref"><a href="#fn-${escapeHtml(id)}" id="fnref-${escapeHtml(id)}">${num}</a></sup>`;
      }
    }
  ]
});

// --- Custom Marked extension: :::type [Title]\n...\n::: → callout block ---
type CalloutToken = {
  type: "callout";
  raw: string;
  calloutType: string;
  title?: string;
  text: string;
  tokens?: Token[];
};

marked.use({
  extensions: [
    {
      name: "callout",
      level: "block",
      start(src: string) {
        const m = src.match(/^:::/m);
        return m ? m.index : undefined;
      },
      tokenizer(src: string) {
        const cap = /^:::(\w+)(?:[ \t]+([^\n]+))?\n([\s\S]*?)\n:::(?:\s*\n)?/.exec(src);
        if (cap) {
          const [, t, title, body] = cap;
          const token: CalloutToken = {
            type: "callout",
            raw: cap[0],
            calloutType: t.toLowerCase(),
            title: title?.trim(),
            text: body || ""
          };
          // Parse inner markdown of the body
          const self = this as unknown as { lexer?: { blockTokens?: (s: string) => Token[] } };
          if (self.lexer && typeof self.lexer.blockTokens === "function") {
            token.tokens = self.lexer.blockTokens!(token.text);
          }
          return token;
        }
        return undefined;
      },
      renderer(token: CalloutToken) {
        const titleHtml = token.title
          ? `<div class="callout-title">${escapeHtml(token.title)}</div>`
          : "";
        const self = this as unknown as { parser?: { parse?: (toks: Token[]) => string } };
        const inner =
          token.tokens && self.parser && typeof self.parser.parse === "function"
            ? self.parser.parse(token.tokens)
            : escapeHtml(token.text);
        const typeClass = `callout-${escapeHtml(token.calloutType || "note")}`;
        return (
          `<div class="callout ${typeClass}" data-type="${escapeHtml(token.calloutType || "note")}">` +
          `${titleHtml}<div class="callout-content">${inner}</div></div>`
        );
      }
    }
  ]
});

// Extract footnote definitions of the form:
// [^id]: text\n  continued lines (indented)
function extractFootnotes(markdown: string): { cleaned: string; defs: Map<string, string> } {
  const lines = markdown.split(/\r?\n/);
  const defs = new Map<string, string>();
  const keep: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^\[\^([^\]]+)\]:\s*(.*)$/.exec(line);
    if (m) {
      const id = m[1];
      let body = m[2] || "";
      // collect indented continuation lines
      let j = i + 1;
      while (j < lines.length) {
        const cont = /^(?:\s{2,}|\t)+(.*)$/.exec(lines[j]);
        if (!cont) break;
        body += "\n" + cont[1];
        j++;
      }
      defs.set(id, body.trim());
      i = j - 1; // skip consumed lines
    } else {
      keep.push(line);
    }
  }
  return { cleaned: keep.join("\n"), defs };
}

// A safe baseline policy for HTML produced from Markdown
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
    "code",
    "blockquote",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "sup",
    "sub",
    "mark",
    "section",
    // ensure strikethrough and callout wrapper elements are preserved
    "del",
    "div",
    // custom inline user mention tags
    "user",
    "usermention",
    // custom inline audio player tag
    "audioplayer",
    // custom see more button tag
    "seemorebutton",
    // custom iframe embed tag
    "embedweb"
  ]),
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["class"],
    "*": [
      "id",
      "class",
      "title",
      "aria-label",
      "aria-description",
      "data-type",
      // allow data-id for <user data-id="..."/>
      "data-id",
      // allow data-url, data-bars and data-bars-mobile for <audioplayer />
      "data-url",
      "data-bars",
      "data-bars-mobile",
      // allow data-href, data-text and data-label for <seemorebutton />
      "data-href",
      "data-text",
      "data-label",
      // allow data-url, data-height, data-title and data-show-title-bar for <embedweb />
      "data-height",
      "data-title",
      "data-show-title-bar"
    ]
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    // Transform custom <user data-id="..."/> tags into visible inline mentions
    user(attribs) {
      const display = "@user"; // neutral fallback; real name is hydrated client-side
      return {
        tagName: "usermention",
        attribs: attribs,
        text: display
      };
    }
  }
};

type MarkdownResult = {
  html: string;
};

export async function renderMarkdown(markdown: string): Promise<MarkdownResult> {
  // Preprocess footnotes
  const { cleaned, defs } = extractFootnotes(markdown || "");
  currentFootnotes = defs;
  usedFootnoteOrder = [];
  const rawHtml = await marked.parse(cleaned);
  // Append footnotes section if any were used
  let combined = typeof rawHtml === "string" ? rawHtml : String(rawHtml);
  if (usedFootnoteOrder.length > 0) {
    const items: string[] = [];
    for (const id of usedFootnoteOrder) {
      const contentMd = defs.get(id) || "";
      const rendered = await marked.parse(contentMd);
      const inner = typeof rendered === "string" ? rendered : String(rendered);
      items.push(
        `<li id="fn-${escapeHtml(id)}">${inner}<a href="#fnref-${escapeHtml(id)}" class="footnote-backref">↩</a></li>`
      );
    }
    combined += `\n<section class="footnotes"><hr/><ol>${items.join("\n")}</ol></section>`;
  }
  // Clear current state
  currentFootnotes = null;
  const html = sanitizeHtml(combined, sanitizeOptions);
  return { html };
}
