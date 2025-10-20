"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import { FaExclamationCircle } from "react-icons/fa";
import { DEBOUNCE_COMMIT_MS } from "./common";
import type { GamesSettings } from "@/lib/validation/settingsSchemas";
import { gamesSchema } from "@/lib/validation/settingsSchemas";

const GamesSection: React.FC<{
  value?: GamesSettings;
  onChange: (v: Partial<GamesSettings>) => void;
  t: (k: string) => string;
}> = ({ value, onChange, t }) => {
  const [nick, setNick] = useState((value?.scoreboardNickname || "").trim());
  const [anon, setAnon] = useState(value?.anonymousOnScoreboard || false);
  const [showRankings, setShowRankings] = useState(value?.showRankings ?? true);
  const originalRef = useRef<GamesSettings | undefined>(value);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirtyRef = useRef<{ nick: boolean }>({ nick: false });
  useEffect(() => {
    if (!value) return;
    if (!dirtyRef.current.nick || value.scoreboardNickname === nick) {
      setNick((prev) => (errors.scoreboardNickname ? prev : value.scoreboardNickname || ""));
      if (value.scoreboardNickname === nick) dirtyRef.current.nick = false;
    }
    setAnon(value.anonymousOnScoreboard);
    setShowRankings(value.showRankings ?? true);
    originalRef.current = value;
    setErrors((prev) => {
      if (value.scoreboardNickname && value.scoreboardNickname.length <= 60) {
        const { scoreboardNickname: s, ...rest } = prev;
        void s;
        return rest;
      }
      return prev;
    });
  }, [value, errors.scoreboardNickname, nick]);
  const validateNick = useCallback(
    (val: string): string | null => {
      if (val === "") return null;
      const res = gamesSchema
        .pick({ scoreboardNickname: true })
        .safeParse({ scoreboardNickname: val });
      if (!res.success) {
        const issue = res.error.issues[0];
        if (issue?.code === "too_big") return t("games.errors.nicknameMax");
        return issue?.message || "Invalid";
      }
      return null;
    },
    [t]
  );
  const commitNick = useCallback(() => {
    const orig = originalRef.current;
    const patch: Partial<GamesSettings> = {};
    if (!orig) {
      if (!errors.scoreboardNickname && nick !== "") patch.scoreboardNickname = nick;
      if (Object.keys(patch).length) onChange(patch);
      return;
    }
    const trimmed = nick.trim();
    if ((trimmed || "") !== (orig.scoreboardNickname || "").trim()) {
      const err = validateNick(trimmed);
      if (err) setErrors((p) => ({ ...p, scoreboardNickname: err }));
      else {
        setErrors((p) => {
          const c = { ...p };
          delete c.scoreboardNickname;
          return c;
        });
        patch.scoreboardNickname = trimmed;
      }
    }
    if (Object.keys(patch).length) onChange(patch);
  }, [nick, errors.scoreboardNickname, onChange, validateNick]);
  useEffect(() => {
    const handle = setTimeout(() => commitNick(), DEBOUNCE_COMMIT_MS);
    return () => clearTimeout(handle);
  }, [nick, commitNick]);
  return (
    <Stack spacing={3}>
      <div>
        <TextField
          size="small"
          fullWidth
          value={nick}
          placeholder={t("games.nicknamePlaceholder")}
          onChange={(e) => {
            dirtyRef.current.nick = true;
            setNick(e.target.value);
          }}
          onBlur={commitNick}
          error={!!errors.scoreboardNickname}
          helperText={errors.scoreboardNickname}
          InputProps={{
            endAdornment: errors.scoreboardNickname ? (
              <FaExclamationCircle color="var(--settings-input-error)" size={16} />
            ) : undefined
          }}
        />
      </div>
      <FormControlLabel
        control={
          <Checkbox
            checked={anon}
            onChange={(e) => {
              const v = e.target.checked;
              setAnon(v);
              const orig = originalRef.current;
              if (!orig || v !== orig.anonymousOnScoreboard) onChange({ anonymousOnScoreboard: v });
            }}
          />
        }
        label={t("games.anonymous")}
        style={{ marginLeft: 0 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showRankings}
            onChange={(e) => {
              const v = e.target.checked;
              setShowRankings(v);
              const orig = originalRef.current;
              if (!orig || v !== orig.showRankings) onChange({ showRankings: v });
            }}
          />
        }
        label={t("games.rankings")}
        style={{ marginLeft: 0 }}
      />
    </Stack>
  );
};

export default GamesSection;
