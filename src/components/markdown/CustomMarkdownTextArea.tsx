"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import UserMention from "./components/UserMention";
import { NextButton, BackButton, AcceptButton } from "@/components/Buttons";

// Configuration
const MENTION_TRIGGER = "@";
const COMPONENT_TRIGGER = "/";

// Component registry - easy to extend with new components
type ComponentConfig = {
  id: string;
  label: string;
  color: string; // background color for the component
  props: Array<{
    name: string;
    label: string;
    type: "text" | "number";
    required?: boolean;
    default?: string | number;
    placeHolderOnly?: boolean;
  }>;
  render: (props: Record<string, string>, raw: string) => React.ReactNode;
};

const COMPONENT_REGISTRY: ComponentConfig[] = [
  {
    id: "audioplayer",
    label: "Audio Player",
    color: "#e0e7ff", // indigo-100
    props: [
      { name: "url", label: "Audio URL", type: "text", required: true },
      { name: "bars", label: "Number of bars", type: "number", default: 100 },
      { name: "mobileBars", label: "Number of mobile bars", type: "number", default: 50 }
    ],
    render: (props) => (
      <span style={{ color: "#4338ca", fontWeight: 600 }}>
        🎵 Audio: {props.url?.split("/").pop() || "audio file"} ({props.bars || 100} bars, mobile:{" "}
        {props.mobileBars || 50})
      </span>
    )
  },
  {
    id: "seemorebutton",
    label: "See More Button",
    color: "#ffe0f7",
    props: [
      { name: "href", label: "Redirect URL", type: "text", required: true },
      {
        name: "text",
        label: "Button Text",
        type: "text",
        required: false,
        default: '"See More" in this language',
        placeHolderOnly: true
      },
      {
        name: "label",
        label: "Aria Label",
        type: "text",
        required: false,
        default: "Use the default label for this language",
        placeHolderOnly: true
      }
    ],
    render: (props) => (
      <span style={{ color: "#4338ca", fontWeight: 600 }}>
        🔗 {props.text || "Default text"}:{" "}
        {(() => {
          try {
            const url = new URL(props.href || "");
            const domain = url.hostname;
            const hasPath = url.pathname && url.pathname !== "/";
            return hasPath ? `${domain}/...` : domain;
          } catch {
            return props.href || "Invalid URL";
          }
        })()}{" "}
        ({props.label || "Default aria label"})
      </span>
    )
  }
];

const Wrapper = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
`;

// Surface for overlayed rendering
const Surface = styled.div`
  position: relative;
`;

// Display transformed content above the invisible textarea
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  color: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  pointer-events: none;
  overflow: auto;
  box-sizing: border-box;
  max-height: 100%;
  -webkit-overflow-scrolling: touch;
  width: 875.5px;
  padding-right: 0;
  padding-bottom: 17px;

  /* hide native scrollbars (visual only) so the textarea scroll remains the interactive one */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* WebKit */
  }
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const TextArea = styled.textarea`
  width: 874px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: transparent; /* show text via Overlay */
  caret-color: #111827; /* dark gray caret */
  resize: vertical; /* only vertical */
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: #90caf9; /* MUI-like primary */
    box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.3);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  left: 0;
  min-width: 320px;
  max-width: 400px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  padding: 8px;
`;
const Search = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  box-sizing: border-box;
`;

const Item = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  outline: none;
  width: 100%;
  text-align: left;
  background: ${({ $active }) => ($active ? "#f3f4f6" : "transparent")};
  border: none;
  cursor: pointer;
  border-radius: 6px;
  color: var(--foreground);
`;

const Avatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 999px;
  object-fit: cover;
`;

const Empty = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const PropInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  box-sizing: border-box;
`;

const PropLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #374151;
`;

const SubmitButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
`;

type UserLite = { _id: string; name: string; displayName?: string; image?: string };

type DropdownMode = "mention" | "component" | "componentProps" | null;

type ComponentPropsState = {
  componentId: string;
  propsCollected: Record<string, string | undefined>;
  currentPropIndex: number;
  isEditing?: boolean;
  editStartIndex?: number;
  editEndIndex?: number;
};

export default function CustomMarkdownTextArea({
  value,
  onChange,
  label,
  minRows = 10,
  placeholder
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  minRows?: number;
  placeholder?: string;
}) {
  const [dropdownMode, setDropdownMode] = useState<DropdownMode>(null);
  const [q, setQ] = useState("");
  const [list, setList] = useState<UserLite[]>([]);
  const [active, setActive] = useState(0);
  const [componentPropsState, setComponentPropsState] = useState<ComponentPropsState | null>(null);
  const [currentPropValue, setCurrentPropValue] = useState("");
  const [mentionEditState, setMentionEditState] = useState<{
    isEditing: boolean;
    editStartIndex: number;
    editEndIndex: number;
  } | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!q) return COMPONENT_REGISTRY;
    return COMPONENT_REGISTRY.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  // Regex helper - matches both user mentions and component embeds
  const allEmbedsRegex = useMemo(() => {
    const componentIds = COMPONENT_REGISTRY.map((c) => c.id).join("|");
    return new RegExp(`<(user|${componentIds})\\b[^>]*?/?>`, "g");
  }, []);

  const extractId = (tag: string) => {
    const m = /data-id\s*=\s*"([^"]+)"/.exec(tag);
    return m ? m[1] : null;
  };

  // Parse component props from tag
  const extractComponentProps = (tag: string): Record<string, string> => {
    const props: Record<string, string> = {};
    const propRegex = /(\w+)\s*=\s*"([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = propRegex.exec(tag))) {
      props[m[1]] = m[2];
    }
    return props;
  };

  type SegText = { type: "text"; text: string };
  type SegMention = {
    type: "mention";
    id: string | null;
    raw: string;
    start: number;
    end: number;
  };
  type SegComponent = {
    type: "component";
    componentType: string;
    props: Record<string, string>;
    raw: string;
    start: number;
    end: number;
  };
  type Segment = SegText | SegMention | SegComponent;

  const segments = useMemo<Segment[]>(() => {
    const segs: Segment[] = [];
    if (!value) return segs;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    const rx = new RegExp(allEmbedsRegex.source, allEmbedsRegex.flags);
    while ((m = rx.exec(value))) {
      if (m.index > lastIndex) segs.push({ type: "text", text: value.slice(lastIndex, m.index) });

      const tagType = m[1];
      if (tagType === "user") {
        segs.push({
          type: "mention",
          id: extractId(m[0]),
          raw: m[0],
          start: m.index,
          end: m.index + m[0].length
        });
      } else {
        // It's a component
        segs.push({
          type: "component",
          componentType: tagType,
          props: extractComponentProps(m[0]),
          raw: m[0],
          start: m.index,
          end: m.index + m[0].length
        });
      }
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < value.length) segs.push({ type: "text", text: value.slice(lastIndex) });
    return segs;
  }, [value, allEmbedsRegex]);

  // Detect triggers: @ for mentions, > for components
  const onKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const pos = target.selectionStart || 0;
    const prev = target.value.slice(0, pos);
    const lastChar = prev.slice(-1);

    if (lastChar === MENTION_TRIGGER) {
      setDropdownMode("mention");
      setQ("");
      setActive(0);
      return;
    }

    if (lastChar === COMPONENT_TRIGGER) {
      setDropdownMode("component");
      setQ("");
      setActive(0);
      return;
    }

    // If dropdown is open for mentions, update search query with text after @
    if (dropdownMode === "mention") {
      const triggerIndex = prev.lastIndexOf(MENTION_TRIGGER);
      if (triggerIndex !== -1) {
        const textAfterTrigger = prev.slice(triggerIndex + 1);
        setQ(textAfterTrigger);
      }
    }

    // If dropdown is open for components, update search query with text after >
    if (dropdownMode === "component") {
      const triggerIndex = prev.lastIndexOf(COMPONENT_TRIGGER);
      if (triggerIndex !== -1) {
        const textAfterTrigger = prev.slice(triggerIndex + 1);
        setQ(textAfterTrigger);
      }
    }
  };

  const close = () => {
    setDropdownMode(null);
    setQ("");
    setList([]);
    setActive(0);
    setComponentPropsState(null);
    setCurrentPropValue("");
    setMentionEditState(null);
  };

  // basic key handling when open
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (dropdownMode === "mention" || dropdownMode === "component") {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        const maxIndex =
          dropdownMode === "mention" ? list.length - 1 : filteredComponents.length - 1;
        setActive((i) => Math.min(i + 1, Math.max(0, maxIndex)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (dropdownMode === "mention" && list[active]) {
          pickUser(list[active]);
        } else if (dropdownMode === "component" && filteredComponents[active]) {
          pickComponent(filteredComponents[active]);
        }
      }
      return;
    }

    // --- new logic for moving across mentions/components ---
    const ta = e.currentTarget;
    const pos = ta.selectionStart ?? 0;

    // Collect embed token ranges
    const rx = new RegExp(allEmbedsRegex.source, allEmbedsRegex.flags);
    const tokens: Array<{ s: number; e: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = rx.exec(value))) tokens.push({ s: m.index, e: m.index + m[0].length });

    if (e.key === "ArrowRight") {
      const hit = tokens.find((t) => pos === t.s); // caret at start of embed
      if (hit) {
        e.preventDefault();
        const newPos = hit.e;
        requestAnimationFrame(() => ta.setSelectionRange(newPos, newPos));
      }
    } else if (e.key === "ArrowLeft") {
      const hit = tokens.find((t) => pos === t.e); // caret at end of embed
      if (hit) {
        e.preventDefault();
        const newPos = hit.s;
        requestAnimationFrame(() => ta.setSelectionRange(newPos, newPos));
      }
    }
  };

  const sanitizeEmbeds = (prev: string, next: string, embedRegex: RegExp) => {
    if (prev === next) return next;

    // --- 1) Longest common prefix (L) ---
    let L = 0;
    const plen = prev.length;
    const nlen = next.length;
    while (L < plen && L < nlen && prev.charCodeAt(L) === next.charCodeAt(L)) L++;

    // --- 2) Longest common suffix (R), without crossing the prefix ---
    let R = 0;
    const maxR = Math.min(plen - L, nlen - L);
    while (R < maxR && prev.charCodeAt(plen - 1 - R) === next.charCodeAt(nlen - 1 - R)) {
      R++;
    }

    const prevChangedStart = L;
    const prevChangedEnd = plen - R; // half-open [start, end)

    // --- 3) Collect embed token ranges from prev ---
    const flags = embedRegex.flags.includes("g") ? embedRegex.flags : embedRegex.flags + "g";
    const rx = new RegExp(embedRegex.source, flags);

    const tokens: Array<{ s: number; e: number }> = [];
    {
      let m: RegExpExecArray | null;
      while ((m = rx.exec(prev))) {
        tokens.push({ s: m.index, e: m.index + m[0].length });
      }
    }

    // --- 4) Which tokens intersect the changed region? ---
    const overlaps = tokens.filter((t) => !(prevChangedEnd <= t.s || prevChangedStart >= t.e));

    // If no embeds were touched, just accept `next` as-is.
    if (overlaps.length === 0) return next;

    // --- 5) Expand the replacement window to fully cover all overlapped tokens ---
    const expandedStart = Math.min(prevChangedStart, ...overlaps.map((t) => t.s));
    const expandedEnd = Math.max(prevChangedEnd, ...overlaps.map((t) => t.e));

    // --- 6) Keep exactly what the user put in for the changed slice ---
    const inserted = next.slice(L, nlen - R);

    // --- 7) Rebuild: prev prefix + user inserted + prev suffix (with embeds removed) ---
    return prev.slice(0, expandedStart) + inserted + prev.slice(expandedEnd);
  };

  // Debounced search fetching for mentions
  useEffect(() => {
    if (dropdownMode !== "mention") return;
    let ignore = false;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("pageSize", "10");
      try {
        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          credentials: "include"
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: UserLite[] };
        if (!ignore) setList(data.items || []);
      } catch {}
    }, 150);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [dropdownMode, q]);

  // Keep active index in range
  useEffect(() => {
    if (dropdownMode === "mention") {
      setActive((i) => Math.min(i, Math.max(0, list.length - 1)));
    } else if (dropdownMode === "component") {
      setActive((i) => Math.min(i, Math.max(0, filteredComponents.length - 1)));
    }
  }, [list.length, dropdownMode, filteredComponents.length]);

  const pickUser = (u: UserLite) => {
    const ta = taRef.current;
    if (!ta) return;

    const tag = `<user data-id="${u._id}" />`;

    if (mentionEditState?.isEditing) {
      // Update existing mention
      const { editStartIndex, editEndIndex } = mentionEditState;
      const before = value.slice(0, editStartIndex);
      const after = value.slice(editEndIndex);
      const next = `${before}${tag}${after}`;
      onChange(next);
      setMentionEditState(null);
    } else {
      // Insert new mention
      const pos = ta.selectionStart || 0;
      const before = value.slice(0, pos);
      const after = value.slice(pos);
      const triggerIndex = before.lastIndexOf(MENTION_TRIGGER);
      if (triggerIndex === -1) return close();
      const prefix = before.slice(0, triggerIndex);
      const next = `${prefix}${tag}${after}`;
      onChange(next);
      setTimeout(() => {
        ta.focus();
        const newPos = (prefix + tag).length;
        ta.setSelectionRange(newPos, newPos);
      }, 0);
    }

    close();
  };

  const pickComponent = (comp: ComponentConfig) => {
    if (comp.props.length === 0) {
      // No props needed, insert immediately
      insertComponent(comp.id, {});
    } else {
      // Start props collection
      setComponentPropsState({
        componentId: comp.id,
        propsCollected: {},
        currentPropIndex: 0
      });
      setCurrentPropValue("");
      setDropdownMode("componentProps");
    }
  };

  const handlePropSubmit = () => {
    if (!componentPropsState) return;
    const comp = COMPONENT_REGISTRY.find((c) => c.id === componentPropsState.componentId);
    if (!comp) return;

    const currentProp = comp.props[componentPropsState.currentPropIndex];

    // Check if current prop is required and empty
    if (currentProp.required && !currentPropValue.trim()) {
      return; // Don't proceed if required field is empty
    }

    const newPropsCollected = {
      ...componentPropsState.propsCollected,
      [currentProp.name]:
        currentPropValue ||
        (currentProp.placeHolderOnly ? undefined : String(currentProp.default || ""))
    };

    if (componentPropsState.currentPropIndex < comp.props.length - 1) {
      // Move to next prop
      setComponentPropsState({
        ...componentPropsState,
        propsCollected: newPropsCollected,
        currentPropIndex: componentPropsState.currentPropIndex + 1
      });
      const nextProp = comp.props[componentPropsState.currentPropIndex + 1];
      setCurrentPropValue(newPropsCollected[nextProp.name] || "");
    } else {
      // All props collected, insert or update component
      if (componentPropsState.isEditing) {
        updateComponent(comp.id, newPropsCollected);
      } else {
        insertComponent(comp.id, newPropsCollected);
      }
    }
  };

  const handlePropBack = () => {
    if (!componentPropsState) return;

    if (componentPropsState.currentPropIndex > 0) {
      // Go back to previous prop
      const comp = COMPONENT_REGISTRY.find((c) => c.id === componentPropsState.componentId);
      if (!comp) return;

      const prevPropIndex = componentPropsState.currentPropIndex - 1;
      const prevProp = comp.props[prevPropIndex];
      const prevValue = componentPropsState.propsCollected[prevProp.name] || "";

      setComponentPropsState({
        ...componentPropsState,
        currentPropIndex: prevPropIndex
      });
      setCurrentPropValue(prevValue);
    } else {
      // If editing, close the dropdown instead of going back to component selection
      if (componentPropsState.isEditing) {
        close();
      } else {
        // Go back to component selection
        setDropdownMode("component");
        setComponentPropsState(null);
        setCurrentPropValue("");
      }
    }
  };

  const insertComponent = (componentId: string, props: Record<string, string | undefined>) => {
    const ta = taRef.current;
    if (!ta) return;
    const pos = ta.selectionStart || 0;
    const before = value.slice(0, pos);
    const after = value.slice(pos);
    const triggerIndex = before.lastIndexOf(COMPONENT_TRIGGER);
    if (triggerIndex === -1) return close();
    const prefix = before.slice(0, triggerIndex);

    // Build tag
    const propsStr = Object.entries(props)
      .filter(([, val]) => val !== undefined)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");
    const tag = `<${componentId}${propsStr ? " " + propsStr : ""} />`;
    const next = `${prefix}${tag}${after}`;
    onChange(next);
    close();
    setTimeout(() => {
      ta.focus();
      const newPos = (prefix + tag).length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleComponentClick = (componentRaw: string) => {
    // Parse the component tag to extract type and props
    const componentMatch = /<(\w+)\b([^>]*?)\/?>/.exec(componentRaw);
    if (!componentMatch) return;

    const componentType = componentMatch[1];
    const attrsStr = componentMatch[2] || "";

    const comp = COMPONENT_REGISTRY.find((c) => c.id === componentType);
    if (!comp) return;

    // Extract all attributes
    const propsCollected: Record<string, string> = {};
    const attrRegex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr))) {
      const key = attrMatch[1];
      const val = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
      propsCollected[key] = val;
    }

    // Find the position of this component in the text
    const componentIndex = value.indexOf(componentRaw);
    if (componentIndex === -1) return;

    // Set up editing state
    setComponentPropsState({
      componentId: componentType,
      propsCollected,
      currentPropIndex: 0,
      isEditing: true,
      editStartIndex: componentIndex,
      editEndIndex: componentIndex + componentRaw.length
    });

    // Set the first prop value
    const firstProp = comp.props[0];
    if (firstProp) {
      setCurrentPropValue(propsCollected[firstProp.name] || String(firstProp.default || ""));
    }

    setDropdownMode("componentProps");
    setQ("");
  };

  const handleMentionClick = (mentionRaw: string) => {
    // Parse the mention tag to extract user ID
    const mentionMatch =
      /<user\b[^>]*?data-id\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))[^>]*?\/>/.exec(mentionRaw);
    if (!mentionMatch) return;

    // Find the position of this mention in the text
    const mentionIndex = value.indexOf(mentionRaw);
    if (mentionIndex === -1) return;

    // Store editing state
    setMentionEditState({
      isEditing: true,
      editStartIndex: mentionIndex,
      editEndIndex: mentionIndex + mentionRaw.length
    });

    // Open mention dropdown in editing mode
    setDropdownMode("mention");
    setQ("");
    setActive(0);
  };

  const updateComponent = (componentId: string, props: Record<string, string | undefined>) => {
    if (!componentPropsState?.isEditing) return;

    const { editStartIndex, editEndIndex } = componentPropsState;
    if (editStartIndex === undefined || editEndIndex === undefined) return;

    const before = value.slice(0, editStartIndex);
    const after = value.slice(editEndIndex);

    // Build new tag
    const propsStr = Object.entries(props)
      .filter(([, val]) => val !== undefined)
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");
    const tag = `<${componentId}${propsStr ? " " + propsStr : ""} />`;
    const next = `${before}${tag}${after}`;

    onChange(next);
    close();

    setTimeout(() => {
      taRef.current?.focus();
    }, 0);
  };

  // click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const node = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // sync overlay scroll
  useEffect(() => {
    const ta = taRef.current;
    const ov = overlayRef.current;
    if (!ta || !ov) return;
    const sync = () => {
      ov.scrollTop = ta.scrollTop;
      ov.scrollLeft = ta.scrollLeft;
    };
    ta.addEventListener("scroll", sync);
    return () => ta.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;

    const snap = () => {
      const pos = ta.selectionStart ?? 0;
      const rx = new RegExp(allEmbedsRegex.source, allEmbedsRegex.flags);
      const tokens: Array<{ s: number; e: number }> = [];
      let m: RegExpExecArray | null;
      while ((m = rx.exec(value))) tokens.push({ s: m.index, e: m.index + m[0].length });

      const hit = tokens.find((t) => pos > t.s && pos < t.e);
      if (hit) {
        const before = pos - hit.s;
        const after = hit.e - pos;
        const newPos = before <= after ? hit.s : hit.e;
        ta.setSelectionRange(newPos, newPos);
      }
    };

    ta.addEventListener("keyup", snap);
    ta.addEventListener("mouseup", snap);
    ta.addEventListener("select", snap);
    return () => {
      ta.removeEventListener("keyup", snap);
      ta.removeEventListener("mouseup", snap);
      ta.removeEventListener("select", snap);
    };
  }, [value, allEmbedsRegex]);

  // Get current component config for props collection
  const currentComponent = componentPropsState
    ? COMPONENT_REGISTRY.find((c) => c.id === componentPropsState.componentId)
    : null;
  const currentProp = currentComponent
    ? currentComponent.props[componentPropsState?.currentPropIndex ?? 0]
    : null;

  return (
    <Wrapper ref={wrapRef}>
      <Label>{label}</Label>
      <Surface>
        <Overlay ref={overlayRef} aria-hidden>
          {segments.map((seg, idx) => {
            if (seg.type === "text")
              return <span key={`t-${idx}-${seg.text ?? Math.random()}`}>{seg.text}</span>;
            if (seg.type === "mention")
              return (
                <MultiLineEmbed
                  key={`m-${seg.id}-${idx}`}
                  raw={seg.raw}
                  color="#e0f2fe"
                  containerRef={overlayRef as React.RefObject<HTMLDivElement>}
                  layoutVersion={value}
                  onClick={() => handleMentionClick(seg.raw)}
                  style={{ cursor: "pointer" }}
                >
                  <UserMention userId={seg.id} isAdmin />
                </MultiLineEmbed>
              );
            if (seg.type === "component") {
              const comp = COMPONENT_REGISTRY.find((c) => c.id === seg.componentType);
              return (
                <MultiLineEmbed
                  key={`c-${seg.componentType}-${idx}`}
                  raw={seg.raw}
                  color={comp?.color || "#f3e8ff"}
                  containerRef={overlayRef as React.RefObject<HTMLDivElement>}
                  layoutVersion={value}
                  onClick={() => handleComponentClick(seg.raw)}
                  style={{ cursor: "pointer" }}
                >
                  {comp ? comp.render(seg.props, seg.raw) : <span>{seg.raw}</span>}
                </MultiLineEmbed>
              );
            }
            return null;
          })}
        </Overlay>
        <TextArea
          ref={taRef}
          value={value}
          onChange={(e) => {
            const newVal = sanitizeEmbeds(value, e.target.value, allEmbedsRegex);
            onChange(newVal);
          }}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          rows={minRows}
          placeholder={placeholder}
        />
      </Surface>
      {dropdownMode === "mention" && (
        <Dropdown role="listbox" aria-label="Mention users" style={{ width: "max-content" }}>
          <Search
            placeholder="Search users..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%" }}
          />
          {list.map((u, idx) => (
            <Item
              key={u._id}
              $active={idx === active}
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={idx === active}
              onMouseEnter={() => setActive(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                pickUser(u);
              }}
            >
              {u.image ? (
                <Avatar src={u.image} alt={u.name} />
              ) : (
                <Avatar src="/logo/32x32.webp" alt="" />
              )}
              <span>{u.displayName || u.name}</span>
            </Item>
          ))}
          {list.length === 0 && <Empty>No users</Empty>}
        </Dropdown>
      )}
      {dropdownMode === "component" && (
        <Dropdown role="listbox" aria-label="Insert component">
          <Search
            placeholder="Search components..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
          {filteredComponents.map((comp, idx) => (
            <Item
              key={comp.id}
              $active={idx === active}
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={idx === active}
              onMouseEnter={() => setActive(idx)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pickComponent(comp);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <span>{comp.label}</span>
            </Item>
          ))}
          {filteredComponents.length === 0 && <Empty>No components</Empty>}
        </Dropdown>
      )}
      {dropdownMode === "componentProps" && currentComponent && currentProp && (
        <Dropdown>
          {componentPropsState?.isEditing && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6366f1",
                marginBottom: "8px",
                textAlign: "center"
              }}
            >
              Editing {currentComponent.label}
            </div>
          )}
          <PropLabel>
            {currentProp.label}
            {currentProp.required && <span style={{ color: "#ef4444" }}> *</span>}
          </PropLabel>
          <PropInput
            type={currentProp.type === "number" ? "number" : "text"}
            value={currentPropValue}
            onChange={(e) => setCurrentPropValue(e.target.value)}
            placeholder={currentProp.default ? `Default: ${currentProp.default}` : ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Only submit if not a required empty field
                if (!currentProp.required || currentPropValue.trim()) {
                  handlePropSubmit();
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            autoFocus
          />
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
            {componentPropsState && currentComponent ? (
              <>
                Step {componentPropsState.currentPropIndex + 1} of {currentComponent.props.length}
              </>
            ) : null}
          </div>
          <SubmitButtonWrapper>
            <BackButton onClick={handlePropBack} iconSize={20} />
            {componentPropsState &&
            currentComponent &&
            componentPropsState.currentPropIndex < currentComponent.props.length - 1 ? (
              <NextButton
                onClick={handlePropSubmit}
                iconSize={20}
                disabled={currentProp.required && !currentPropValue.trim()}
              />
            ) : (
              <AcceptButton
                onClick={handlePropSubmit}
                iconSize={20}
                color="success"
                disabled={currentProp.required && !currentPropValue.trim()}
              />
            )}
          </SubmitButtonWrapper>
        </Dropdown>
      )}
    </Wrapper>
  );
}

const Placeholder = styled.span`
  visibility: hidden; /* in-flow, wraps exactly like the raw text */
  opacity: 0;
  white-space: pre-wrap;
`;

const Cover = styled.span<{ $clickable?: boolean }>`
  position: absolute;
  border-radius: 6px;
  pointer-events: ${({ $clickable }) => ($clickable ? "auto" : "none")};
  display: flex;
  align-items: center;
  justify-content: center;
`;

function MultiLineEmbed({
  raw,
  color,
  containerRef,
  layoutVersion,
  children,
  onClick,
  style
}: {
  raw: string;
  color: string;
  containerRef: React.RefObject<HTMLDivElement>;
  layoutVersion: unknown;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const phRef = useRef<HTMLSpanElement>(null);
  const [rects, setRects] = useState<DOMRect[]>([]);

  useLayoutEffect(() => {
    let alive = true;
    let rafId = 0;

    const measure = async () => {
      const container = containerRef.current;
      const ph = phRef.current;
      if (!container || !ph) return;

      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {}

      await new Promise<void>((res) => (rafId = requestAnimationFrame(() => res())));
      await new Promise<void>((res) => (rafId = requestAnimationFrame(() => res())));
      if (!alive) return;

      const range = document.createRange();
      range.selectNodeContents(ph);
      const list = Array.from(range.getClientRects());
      const cont = container.getBoundingClientRect();

      const rel = list.map(
        (r) =>
          new DOMRect(
            r.left - cont.left + container.scrollLeft,
            r.top - cont.top + container.scrollTop,
            r.width,
            r.height
          )
      );
      setRects(rel);
    };

    measure();

    // Re-measure on size changes
    const ro = new ResizeObserver(() => measure());
    if (phRef.current) ro.observe(phRef.current);
    if (containerRef.current) ro.observe(containerRef.current);

    // Re-measure when overlay DOM mutates
    const mo = new MutationObserver(() => measure());
    const overlay = containerRef.current;
    if (overlay) {
      mo.observe(overlay, { childList: true, subtree: true, characterData: true });
    }

    // Re-measure on window resize
    const onWin = () => measure();
    window.addEventListener("resize", onWin);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [raw, layoutVersion, containerRef]);

  const main =
    rects.length > 0 ? rects.reduce((mx, r) => (r.width > mx.width ? r : mx), rects[0]) : null;

  return (
    <>
      {/* In-flow invisible placeholder that defines line boxes */}
      <Placeholder ref={phRef}>{raw}</Placeholder>

      {/* Absolute covers, positioned relative to Overlay */}
      {rects.map((r, i) => (
        <Cover
          key={i}
          $clickable={!!onClick}
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
            background: color,
            ...style
          }}
          onClick={onClick}
        >
          {main === r && (
            <div
              style={{
                maxWidth: "100%",
                padding: "0 6px",
                borderRadius: 999,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                pointerEvents: "none"
              }}
            >
              {children}
            </div>
          )}
        </Cover>
      ))}
    </>
  );
}
