"use client";

type TranslatorInstance = {
  destroy(): void;
  translate: (text: string) => Promise<string>;
  // Optional streaming support; not all implementations provide this
  translateStreaming?: (
    text: string
  ) => Promise<ReadableStream | AsyncIterable<string> | undefined>;
};

type TranslatorCreateOptions = {
  sourceLanguage?: string;
  targetLanguage: string;
  // Some implementations expose progress for model downloads
  onProgress?: (ev: { progress?: number }) => void;
  onDownloadProgress?: (ev: { progress?: number }) => void;
};

type TranslatorAPI = {
  availability?: (opts: {
    sourceLanguage?: string;
    targetLanguage: string;
  }) => Promise<"available" | "downloadable" | "downloading" | "unavailable">;
  create: (opts: TranslatorCreateOptions) => Promise<TranslatorInstance>;
};

declare global {
  interface Window {
    Translator?: TranslatorAPI;
  }
}

const EXCLUDED_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "code",
  "pre",
  "iframe",
  "canvas",
  "svg",
  "head",
  "fieldset"
]);
const EXCLUDED_SELECTOR = Array.from(EXCLUDED_TAGS).join(",");
const EXCLUDED_CLASS_NAMES = new Set<string>(["notranslate", "MuiTooltip-popper"]);
const EXCLUDED_CLASS_SELECTOR = Array.from(EXCLUDED_CLASS_NAMES)
  .map((c) => `.${c}`)
  .join(",");
const ATTRS_TO_TRANSLATE = [
  "title",
  "aria-label",
  "aria-description",
  "alt",
  "placeholder"
] as const;
const COUNT_ATTRS_IN_PROGRESS = false;
const DATA_SKIP = "data-no-ai-translate";
const DATA_ATTRS_LANG = "data-ai-attrs-lang";
const STREAM_THRESHOLD = 150;
type AiProgress = {
  phase?: "downloading" | "translating" | "error" | null;
  value?: number;
  message?: string;
};

class AiTranslateManager {
  private translator: TranslatorInstance | null = null;
  private active = false;
  private sourceLang: string | undefined;
  private targetLang = "en";
  private observer: MutationObserver | null = null;

  private strCache = new Map<string, string>();
  private originalText = new WeakMap<Text, string>();
  private originalTextNodes = new Set<Text>();
  private originalAttrs = new WeakMap<Element, Record<string, string>>();
  private originalAttrElems = new Set<Element>();
  private nodeLang = new WeakMap<Text, string>();
  private currentProgress = 0;
  private readonly MAX_CONCURRENCY = 3; // limit parallel requests to avoid quota bursts

  // Returns true if the element is itself excluded or inside an excluded ancestor
  private isInsideExcluded(el: Element | null): boolean {
    if (!el) return false;
    try {
      // closest is fast and concise; include both tag and class-based exclusions
      const combined = EXCLUDED_CLASS_SELECTOR
        ? `${EXCLUDED_SELECTOR},${EXCLUDED_CLASS_SELECTOR}`
        : EXCLUDED_SELECTOR;
      return !!el.closest(combined);
    } catch {
      for (let p: Element | null = el; p; p = p.parentElement) {
        if (EXCLUDED_TAGS.has(p.tagName.toLowerCase())) return true;
        // Check forbidden class names on this ancestor
        if (p.classList && p.classList.length) {
          for (const cls of EXCLUDED_CLASS_NAMES) {
            if (p.classList.contains(cls)) return true;
          }
        }
      }
      return false;
    }
  }

  private resetMismatchedMarkers() {
    // Remove data-ai-lang markers that don't match the current target language
    try {
      const nodes = document.querySelectorAll<HTMLElement>("[data-ai-lang]");
      nodes.forEach((el) => {
        const v = el.getAttribute("data-ai-lang");
        if (v && v !== this.targetLang) {
          el.removeAttribute("data-ai-lang");
        }
      });
      // Remove attribute-scope markers that don't match
      const attrNodes = document.querySelectorAll<HTMLElement>(`[${DATA_ATTRS_LANG}]`);
      attrNodes.forEach((el) => {
        const v = el.getAttribute(DATA_ATTRS_LANG);
        if (v && v !== this.targetLang) {
          el.removeAttribute(DATA_ATTRS_LANG);
        }
      });
      // Clearing nodeLang mapping ensures we don't skip based on stale per-node marks
      this.nodeLang = new WeakMap();
    } catch {
      // ignore
    }
  }

  // Detect the dominant casing pattern of the original text
  private detectCasePattern(text: string): "lower" | "upper" | "capitalized" | "title" | "none" {
    const key = text.trim();
    // Quick exits
    const hasLetter = /\p{L}/u.test(key);
    if (!hasLetter) return "none";
    if (key === key.toUpperCase()) return "upper";
    if (key === key.toLowerCase()) return "lower";
    // Sentence capitalized: first letter uppercase, rest lowercase
    const firstAlphaIdx = key.search(/\p{L}/u);
    if (firstAlphaIdx >= 0) {
      const first = key[firstAlphaIdx];
      const rest = key.slice(firstAlphaIdx + 1);
      if (first === first.toUpperCase() && rest === rest.toLowerCase()) return "capitalized";
    }
    // Title case: each word starts uppercase and remaining letters lowercase
    const words = (key.match(/\p{L}[\p{L}\p{M}]*/gu) || []) as string[];
    if (
      words.length > 0 &&
      words.every(
        (w: string) =>
          w.length > 0 &&
          w.charAt(0) === w.charAt(0).toUpperCase() &&
          w.slice(1) === w.slice(1).toLowerCase()
      )
    ) {
      return "title";
    }
    return "none";
  }

  // Adapt the translated string to match the detected pattern
  private applyCasePattern(
    translated: string,
    pattern: ReturnType<AiTranslateManager["detectCasePattern"]>
  ): string {
    switch (pattern) {
      case "upper":
        return translated.toUpperCase();
      case "lower":
        return translated.toLowerCase();
      case "capitalized": {
        // Lowercase everything, then uppercase first letter
        const lower = translated.toLowerCase();
        const idx = lower.search(/\p{L}/u);
        if (idx < 0) return lower;
        return lower.slice(0, idx) + lower[idx].toUpperCase() + lower.slice(idx + 1);
      }
      case "title": {
        // Title-case each word (letters sequences), preserve separators
        return translated.replace(
          /\p{L}[\p{L}\p{M}]*/gu,
          (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()
        );
      }
      default:
        return translated;
    }
  }

  // Context-aware cache keys
  private makeCacheKey(
    text: string,
    ctx?: { scope?: "text" | "attr" | "ui"; attrName?: string; elementTag?: string; hint?: string }
  ) {
    // Include source/target languages to avoid cross-language collisions
    return JSON.stringify({
      t: text,
      src: this.sourceLang || null,
      tgt: this.targetLang,
      ctx: ctx || null
    });
  }
  private getCached(
    text: string,
    ctx?: { scope?: "text" | "attr" | "ui"; attrName?: string; elementTag?: string; hint?: string }
  ) {
    return this.strCache.get(this.makeCacheKey(text, ctx));
  }
  private setCached(
    text: string,
    value: string,
    ctx?: { scope?: "text" | "attr" | "ui"; attrName?: string; elementTag?: string; hint?: string }
  ) {
    this.strCache.set(this.makeCacheKey(text, ctx), value);
  }

  isSupported() {
    return typeof window !== "undefined" && !!window.Translator;
  }

  isActive() {
    return this.active;
  }

  getTargetLanguage() {
    return this.targetLang;
  }

  async translateString(text: string, ctx?: { scope?: "text" | "attr" | "ui"; hint?: string }) {
    if (!this.translator) return text;
    const key = text.trim();
    if (!key) return text;
    let translated = this.getCached(key, { scope: ctx?.scope ?? "ui", hint: ctx?.hint });
    if (translated === undefined) {
      translated = await this.translator.translate(key);
      this.setCached(key, translated, { scope: ctx?.scope ?? "ui", hint: ctx?.hint });
    }
    // Apply casing pattern from original
    const pattern = this.detectCasePattern(key);
    return this.applyCasePattern(translated, pattern);
  }

  async enable(opts: {
    targetLang: string;
    sourceLang?: string;
    onProgress?: (p: AiProgress) => void;
    initialSilent?: boolean;
    save?: boolean;
  }) {
    if (!this.isSupported()) throw new Error("AI translation not supported in this browser.");
    try {
      this.translator?.destroy();
    } catch {}
    this.targetLang = opts.targetLang;
    this.sourceLang = opts.sourceLang;
    // Check availability first; if already available, skip downloading state
    let availability: "available" | "downloadable" | "downloading" | "unavailable" | undefined;
    try {
      availability = await window.Translator?.availability?.({
        sourceLanguage: this.sourceLang,
        targetLanguage: this.targetLang
      });
    } catch {
      availability = undefined;
    }

    if (availability === "unavailable") {
      throw new Error("Selected language pair is unavailable for AI translation.");
    }

    if (availability === "available") {
      // Create without progress hooks; go straight to translating
      this.translator = await window.Translator!.create({
        sourceLanguage: this.sourceLang,
        targetLanguage: this.targetLang
      });
      this.currentProgress = 0;
      if (opts?.save) {
        try {
          localStorage.setItem("ai-target-lang", this.targetLang);
        } catch {}
      }
      if (!opts.initialSilent) opts.onProgress?.({ phase: "translating", value: 0 });
      this.active = true;
      this.resetMismatchedMarkers();
      await this.translateDocument(opts.initialSilent ? undefined : opts.onProgress);
      if (opts.targetLang !== this.targetLang) return; // Language changed, avoid sending irrelevant signals
      // If silent, fire only a final completion update
      if (opts.initialSilent) opts.onProgress?.({ phase: null, value: 100 });
      document.dispatchEvent(
        new CustomEvent("ai-translation-done", { detail: { targetLang: this.targetLang } })
      );
      this.startObserving();
      return;
    }

    // Otherwise, show downloading and wait until ready
    if (!opts.initialSilent) opts.onProgress?.({ phase: "downloading" });
    let progressSupported = true;
    let resolveDownload!: () => void;
    const downloadReady = new Promise<void>((res) => (resolveDownload = res));
    const createOpts: TranslatorCreateOptions = {
      sourceLanguage: this.sourceLang,
      targetLanguage: this.targetLang,
      onProgress: () => {
        if (!opts.initialSilent) opts.onProgress?.({ phase: "downloading" });
      },
      onDownloadProgress: (ev?: { progress?: number }) => {
        if (!opts.initialSilent) opts.onProgress?.({ phase: "downloading" });
        if (typeof ev?.progress === "number" && ev.progress >= 1) resolveDownload();
      }
    };
    try {
      this.translator = await window.Translator!.create(createOpts);
    } catch {
      progressSupported = false;
      this.translator = await window.Translator!.create({
        sourceLanguage: this.sourceLang,
        targetLanguage: this.targetLang
      });
    }
    try {
      if (progressSupported) {
        await Promise.race([downloadReady, this.sleep(20000)]);
      } else {
        await this.waitUntilReadyProbe(15000);
      }
    } catch {}
    this.currentProgress = 0;
    if (opts?.save) {
      try {
        localStorage.setItem("ai-target-lang", this.targetLang);
      } catch {}
    }
    if (!opts.initialSilent) opts.onProgress?.({ phase: "translating", value: 0 });
    this.active = true;
    this.resetMismatchedMarkers();
    await this.translateDocument(opts.initialSilent ? undefined : opts.onProgress);
    if (opts.targetLang !== this.targetLang) return; // Language changed, avoid sending irrelevant signals
    if (opts.initialSilent) opts.onProgress?.({ phase: null, value: 100 });
    document.dispatchEvent(
      new CustomEvent("ai-translation-done", { detail: { targetLang: this.targetLang } })
    );
    this.startObserving();
  }

  // Fallback readiness probe when download progress callbacks aren't available.
  private async waitUntilReadyProbe(timeoutMs = 15000) {
    const start = Date.now();
    const probeText = "ok";
    while (Date.now() - start < timeoutMs) {
      try {
        // Attempt a tiny translate call; success implies the model is usable
        await (this.translator as TranslatorInstance).translate(probeText);
        return;
      } catch {
        // Keep waiting while the model downloads/initializes
      }
      await this.sleep(250);
    }
  }

  disable() {
    this.stopObserving();
    this.restoreDocument();
    this.translator?.destroy();
    this.translator = null;
    this.active = false;
    this.nodeLang = new WeakMap();
  }

  // Re-run translation on the current document without creating a new translator.
  // Safe to call on route changes; no user gesture required.
  async refresh(onProgress?: (p: AiProgress) => void) {
    if (!this.active) return;
    if (!this.translator) return; // still downloading/creating; skip
    // Don’t reset currentProgress; just report translating and proceed
    onProgress?.({ value: this.currentProgress });
    this.resetMismatchedMarkers();
    await this.translateDocument(onProgress);
  }

  private startObserving() {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver((mutations) => {
      if (!this.active) return;
      queueMicrotask(() => this.translateMutations(mutations));
    });
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS_TO_TRANSLATE as unknown as string[]
    });
  }

  private stopObserving() {
    this.observer?.disconnect();
    this.observer = null;
  }

  private async translateMutations(mutations: MutationRecord[]) {
    if (!this.translator) return;
    const nodesToTranslate: Text[] = [];
    const elemsForAttrs = new Set<Element>();

    for (const m of mutations) {
      if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
        const textNode = m.target as Text;
        // Skip if already translated (current text !== stored original)
        const orig = this.originalText.get(textNode);
        if (orig !== undefined && textNode.textContent !== orig) {
          continue;
        }
        if (this.shouldTranslateNode(textNode)) nodesToTranslate.push(textNode);
      } else if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) {
            const t = n as Text;
            if (this.shouldTranslateNode(t)) nodesToTranslate.push(t);
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            this.collectTextNodes(n as Element, nodesToTranslate);
            elemsForAttrs.add(n as Element);
            (n as Element).querySelectorAll("*").forEach((el) => elemsForAttrs.add(el));
          }
        });
      } else if (m.type === "attributes" && m.target instanceof Element) {
        elemsForAttrs.add(m.target);
      }
    }

    // For live mutations, don't spam progress; translate text first, then attributes to avoid marker interference
    await this.translateTextNodes(nodesToTranslate);
    await this.translateAttributes(Array.from(elemsForAttrs));
  }

  private shouldTranslateNode(t: Text) {
    const el = t.parentElement;
    if (!el) return false;
    if (el.closest(`[${DATA_SKIP}]`)) return false;
    // If element or any ancestor is within an excluded tag, skip translating this node
    if (this.isInsideExcluded(el)) return false;
    // If element is translating or already translated to this target, skip
    const elLang = el.getAttribute("data-ai-lang");
    if (elLang === "translating") return false;
    if (elLang && elLang === this.targetLang) return false;
    // If this text node is translating or already translated to this target, skip
    const nodeLang = this.nodeLang.get(t);
    if (nodeLang === "translating") return false;
    if (nodeLang && nodeLang === this.targetLang) return false;
    const text = t.textContent?.trim();
    return !!text;
  }

  private collectTextNodes(root: Element, out: Text[]) {
    if (root.closest(`[${DATA_SKIP}]`)) return;
    // If this subtree is inside any excluded tag, skip the whole branch
    if (this.isInsideExcluded(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const t = n as Text;
        return this.shouldTranslateNode(t) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    } as unknown as NodeFilter);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      out.push(node as Text);
    }
  }

  private async translateTextNodes(
    nodes: Text[],
    onProgress?: (p: AiProgress) => void,
    progressCtx?: { total: number; done: number }
  ) {
    if (!this.translator || nodes.length === 0) return;
    await this.processWithLimit(nodes, async (t) => {
      // Compute current text/weight up front so we can advance progress even if skipped now
      const current = t.textContent || "";
      // Ensure we capture the original as soon as we start editing/replacing this node
      let storedOriginal = this.originalText.get(t);
      if (!storedOriginal) {
        storedOriginal = current;
        this.originalText.set(t, storedOriginal);
        this.originalTextNodes.add(t);
      }
      const key = storedOriginal.trim();
      // Re-check at processing time in case DOM changed
      if (!this.shouldTranslateNode(t)) {
        if (progressCtx && onProgress && key) {
          const weight = key.length || 1;
          progressCtx.done += weight;
          let value = Math.min(
            100,
            Math.round((progressCtx.done / Math.max(1, progressCtx.total)) * 100)
          );
          if (value < this.currentProgress) value = this.currentProgress;
          this.currentProgress = value;
          onProgress({ value });
        }
        return;
      }
      if (!key) return;
      // Prepare whitespace handling
      const leading = storedOriginal.match(/^\s*/)?.[0] ?? "";
      const trailing = storedOriginal.match(/\s*$/)?.[0] ?? "";
      const cacheCtx = { scope: "text" as const, elementTag: t.parentElement?.tagName };
      const casePattern = this.detectCasePattern(key);
      // Use cached translation if present (even for long texts)
      const cached = this.getCached(key, cacheCtx);
      // Use streaming for long texts if available and not cached
      const supportsStream = typeof this.translator!.translateStreaming === "function";
      if (cached === undefined && key.length > STREAM_THRESHOLD && supportsStream) {
        // console.log("AI translate (stream)", { text: key.slice(0, STREAM_THRESHOLD - 3) + "...", len: key.length });
        // Mark this node/element as translating up-front to avoid re-translation churn during streaming updates
        this.nodeLang.set(t, "translating");
        const p = t.parentElement;
        const markElement =
          p && p.childNodes.length === 1 && p.firstChild === t && !p.hasAttribute(DATA_SKIP);
        if (markElement) p!.setAttribute("data-ai-lang", "translating");
        try {
          await this.streamTranslateIntoNode(t, storedOriginal, key, cacheCtx, casePattern);
          // Finalize markers to target after success
          this.nodeLang.set(t, this.targetLang);
          if (markElement) p!.setAttribute("data-ai-lang", this.targetLang);
        } catch (e) {
          // Clear translating markers on failure
          this.nodeLang.delete(t);
          const p2 = t.parentElement;
          if (p2 && p2.getAttribute("data-ai-lang") === "translating") {
            p2.removeAttribute("data-ai-lang");
          }
          throw e;
        }
      } else {
        let translated = cached;
        if (translated === undefined) {
          // console.log("AI translate", { text: key.slice(0, 120), len: key.length });
          // Mark as translating while we perform single-shot translate
          this.nodeLang.set(t, "translating");
          const p = t.parentElement;
          const markElement =
            p && p.childNodes.length === 1 && p.firstChild === t && !p.hasAttribute(DATA_SKIP);
          if (markElement) p!.setAttribute("data-ai-lang", "translating");
          try {
            translated = await this.translateWithRetry(key);
          } catch (e) {
            // Clear translating markers on failure
            this.nodeLang.delete(t);
            const p2 = t.parentElement;
            if (p2 && p2.getAttribute("data-ai-lang") === "translating") {
              p2.removeAttribute("data-ai-lang");
            }
            throw e;
          }
          // Cache RAW translated (unformatted) value
          this.setCached(key, translated, cacheCtx);
        }
        // Adapt casing to original pattern before setting content
        const adapted = this.applyCasePattern(translated, casePattern);
        t.textContent = `${leading}${adapted}${trailing}`;
        // Finalize markers to target
        this.nodeLang.set(t, this.targetLang);
        const p = t.parentElement;
        if (p && p.childNodes.length === 1 && p.firstChild === t && !p.hasAttribute(DATA_SKIP)) {
          p.setAttribute("data-ai-lang", this.targetLang);
        }
      }
      if (progressCtx && onProgress) {
        // weight by text length (trimmed)
        const weight = key.length || 1;
        progressCtx.done += weight;
        let value = Math.min(
          100,
          Math.round((progressCtx.done / Math.max(1, progressCtx.total)) * 100)
        );
        // clamp to monotonic progress
        if (value < this.currentProgress) value = this.currentProgress;
        this.currentProgress = value;
        onProgress({ value });
      }
    });
  }

  private async streamTranslateIntoNode(
    node: Text,
    originalSource: string,
    key: string,
    cacheCtx?: {
      scope?: "text" | "attr" | "ui";
      attrName?: string;
      elementTag?: string;
      hint?: string;
    },
    casePattern?: ReturnType<AiTranslateManager["detectCasePattern"]>
  ) {
    const leading = originalSource.match(/^\s*/)?.[0] ?? "";
    const trailing = originalSource.match(/\s*$/)?.[0] ?? "";
    try {
      const streamFn = this.translator!.translateStreaming?.bind(this.translator!);
      const stream = streamFn ? await this.streamWithRetry(key) : undefined;

      // ReadableStream case
      if (stream && typeof (stream as ReadableStream).getReader === "function") {
        const reader = (stream as ReadableStream).getReader();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += String(value);
          const adapted = this.applyCasePattern(acc, casePattern ?? this.detectCasePattern(key));
          node.textContent = `${leading}${adapted}${trailing}`;
        }
        this.setCached(key, acc, cacheCtx);
        return;
      }
    } catch {
      // ignore and fall back
    }
    // Fallback: sentence-chunked sequential translation
    const parts = key.split(/([.!?]+\s+)/);
    let acc = "";
    for (let i = 0; i < parts.length; i += 2) {
      const sentence = (parts[i] || "") + (parts[i + 1] || "");
      if (!sentence.trim()) continue;
      const translated = await this.translateWithRetry(sentence);
      acc += translated;
      const adapted = this.applyCasePattern(acc, casePattern ?? this.detectCasePattern(key));
      node.textContent = `${leading}${adapted}${trailing}`;
    }
    this.setCached(key, acc, cacheCtx);
    // Already marked at stream start
  }

  private async translateAttributes(
    elems: Element[],
    onProgress?: (p: AiProgress) => void,
    progressCtx?: { total: number; done: number }
  ) {
    if (!this.translator || elems.length === 0) return;
    await this.processWithLimit(elems, async (el) => {
      if (el.closest(`[${DATA_SKIP}]`)) return;
      if (this.isInsideExcluded(el)) return;
      // Skip if element already marked as translated to this target
      const attrsLang = el.getAttribute(DATA_ATTRS_LANG);
      if (attrsLang === this.targetLang || attrsLang === "translating") return;
      let elementWasMarkedTranslating = false;
      // Mark element as translating (attributes scope) while we process its attributes
      if (attrsLang !== "translating") {
        el.setAttribute(DATA_ATTRS_LANG, "translating");
        elementWasMarkedTranslating = true;
      }
      if (!this.originalAttrs.has(el)) {
        this.originalAttrs.set(el, {});
        this.originalAttrElems.add(el);
      }
      const store = this.originalAttrs.get(el)!;
      try {
        for (const attr of ATTRS_TO_TRANSLATE) {
          const val = el.getAttribute(attr);
          if (!val) continue;
          // Capture original attribute value once
          if (!store[attr]) store[attr] = val;
          const base = store[attr] ?? val;
          const key = base.trim();
          if (!key) continue;
          const cacheCtx = { scope: "attr" as const, attrName: attr, elementTag: el.tagName };
          let translated = this.getCached(key, cacheCtx);
          if (!translated) {
            // console.log("AI translate attr", { attr, text: key.slice(0, 120), len: key.length });
            translated = await this.translateWithRetry(key);
            this.setCached(key, translated, cacheCtx);
          }
          // Adapt attribute value casing to original
          const casePattern = this.detectCasePattern(key);
          const adapted = this.applyCasePattern(translated, casePattern);
          el.setAttribute(attr, adapted);
          if (progressCtx && onProgress) {
            const weight = key.length || 1;
            progressCtx.done += weight;
            let value = Math.min(
              100,
              Math.round((progressCtx.done / Math.max(1, progressCtx.total)) * 100)
            );
            if (value < this.currentProgress) value = this.currentProgress;
            this.currentProgress = value;
            onProgress({ value });
          }
        }
        // Finalize element ATTRS marker to target
        el.setAttribute(DATA_ATTRS_LANG, this.targetLang);
      } catch (e) {
        // On any failure, clear translating marker if we set it
        if (elementWasMarkedTranslating && el.getAttribute(DATA_ATTRS_LANG) === "translating") {
          el.removeAttribute(DATA_ATTRS_LANG);
        }
        throw e;
      }
    });
  }

  private async translateDocument(onProgress?: (p: AiProgress) => void) {
    if (!this.translator) return;
    const textNodes: Text[] = [];
    this.collectTextNodes(document.body, textNodes);
    // Compute total work as the sum of text lengths (nodes + attribute values)
    const attrElems = Array.from(document.body.querySelectorAll<HTMLElement>("*"));
    let totalChars = 0;
    // Text nodes length (prefer stored original)
    for (const t of textNodes) {
      const orig = this.originalText.get(t) ?? t.textContent ?? "";
      const key = orig.trim();
      totalChars += key.length;
    }
    // Attribute values length
    if (COUNT_ATTRS_IN_PROGRESS) {
      for (const el of attrElems) {
        if (el.closest(`[${DATA_SKIP}]`)) continue;
        if (EXCLUDED_TAGS.has(el.tagName.toLowerCase())) continue;
        for (const attr of ATTRS_TO_TRANSLATE) {
          const stored = this.originalAttrs.get(el)?.[attr];
          const v = stored ?? el.getAttribute(attr) ?? "";
          const trimmed = v.trim();
          if (trimmed) totalChars += trimmed.length;
        }
      }
    }
    // Do not translate the page title (per requirements)
    const progressCtx = { total: Math.max(totalChars, 1), done: 0 };

    await this.translateTextNodes(textNodes, onProgress, progressCtx);
    await this.translateAttributes(
      attrElems,
      onProgress,
      COUNT_ATTRS_IN_PROGRESS ? progressCtx : undefined
    );
    // Ensure the progress bar hits 100% at the end of the batch
    if (onProgress) {
      this.currentProgress = 100;
      onProgress({ phase: null, value: 100 });
    }
  }

  // Concurrency-limited runner to avoid bursts that trigger rate limits
  private async processWithLimit<T>(items: T[], worker: (item: T, index: number) => Promise<void>) {
    const limit = Math.max(1, this.MAX_CONCURRENCY);
    let index = 0;
    const run = async () => {
      while (true) {
        const i = index++;
        if (i >= items.length) break;
        try {
          await worker(items[i], i);
        } catch (e) {
          // Suppress noisy AbortErrors from cancelled sessions or translator switches
          const err = e as unknown;
          const msg = err instanceof Error ? err.message : String(err);
          const name =
            typeof err === "object" && err !== null && "name" in err
              ? String((err as { name?: unknown }).name)
              : undefined;
          const aborted = name === "AbortError" || /aborted/i.test(msg || "");
          if (!aborted) console.warn("AI translate item failed", e);
        }
        // brief pause to smooth out traffic
        await this.sleep(10);
      }
    };
    const workers = Array.from({ length: limit }, () => run());
    await Promise.all(workers);
  }

  private async translateWithRetry(text: string): Promise<string> {
    // Local translator: just call once and surface any error
    return await (this.translator as TranslatorInstance).translate(text);
  }

  private async streamWithRetry(
    key: string
  ): Promise<ReadableStream | AsyncIterable<string> | undefined> {
    const streamFn = (this.translator as TranslatorInstance).translateStreaming?.bind(
      this.translator
    );
    return streamFn ? await streamFn(key) : undefined;
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private restoreDocument() {
    // Restore text nodes
    for (const node of this.originalTextNodes) {
      const orig = this.originalText.get(node);
      if (typeof orig === "string") node.textContent = orig;
    }
    this.originalText = new WeakMap();
    this.originalTextNodes.clear();

    // Restore attributes
    for (const el of this.originalAttrElems) {
      const attrs = this.originalAttrs.get(el);
      if (attrs) {
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      }
    }
    this.originalAttrs = new WeakMap();
    this.originalAttrElems.clear();
  }
}

export const aiTranslateManager = new AiTranslateManager();
