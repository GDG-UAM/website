"use client";
import { api } from "@/lib/eden";

import { useEffect, useState } from "react";
import { TextField, Chip, CircularProgress, Autocomplete } from "@mui/material";

type UserLite = {
  _id: string;
  name: string;
  displayName?: string;
  image?: string;
};

export interface UserSelectProps {
  label?: string;
  value: string[]; // array of user ids
  onChange: (ids: string[], users?: UserLite[]) => void;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
}

export default function UserSelect({
  label = "Authors",
  value,
  onChange,
  placeholder,
  disabled,
  helperText
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite[]>([]);

  // Fetch users from admin endpoint with search
  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        const { data, error } = await api.admin.users.get({
          query: {
            q: query || undefined,
            pageSize: 20
          }
        });
        if (error) return;
        if (!ignore) setOptions(data.items || []);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [query]);

  // Ensure selected list has full user objects for current ids
  useEffect(() => {
    // merge currently selected IDs with available options
    const map = new Map(options.map((u) => [u._id, u] as const));
    const next = value.map((id) => map.get(id) || { _id: id, name: id });
    setSelected(next as UserLite[]);
  }, [options, value]);

  const displayLabel = (u: UserLite) => u.displayName || u.name || u._id;

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      options={options}
      value={selected}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      getOptionLabel={displayLabel}
      isOptionEqualToValue={(o, v) => o._id === v._id}
      filterOptions={(x) => x}
      onChange={(_e, newVal) =>
        onChange(
          newVal.map((u) => u._id),
          newVal
        )
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip label={displayLabel(option)} {...getTagProps({ index })} key={option._id} />
        ))
      }
    />
  );
}
