"use client";

import { api } from "@/lib/eden";
import { useEffect, useState, useRef } from "react";
import { TextField } from "@mui/material";
import { DeleteButton } from "@/components/Buttons";
import styled from "styled-components";
import { useTranslations } from "next-intl";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  position: relative;
`;

const ComboboxWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 250px;
  overflow-y: auto;
`;

const DropdownItem = styled.div`
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;

const Avatar = styled.div<{ src?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #fff;
  background-image: ${(props) => (props.src ? `url(${props.src})` : "none")};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #888;
  overflow: hidden;
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MainText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SubText = styled.span`
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const EntryItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 16px;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const EntryActions = styled.div`
  margin-left: auto;
`;

type UserLite = {
  _id: string;
  name: string;
  displayName?: string;
  image?: string;
};

interface UserSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
}

export default function UserSelector({ value, onChange, label, placeholder }: UserSelectorProps) {
  const t = useTranslations("admin.hackathons.teams.form");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<UserLite[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resolvedUsers, setResolvedUsers] = useState<Record<string, UserLite>>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await api.admin.users.get({
          query: { q: query, pageSize: 5 }
        });
        if (!error && data) {
          setOptions(data.items || []);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const unresolvedIds = value.filter((id) => !resolvedUsers[id]);

    if (unresolvedIds.length > 0) {
      unresolvedIds.forEach((id) => {
        api.admin
          .users({ id })
          .get()
          .then(({ data, error }) => {
            if (!error && data) {
              setResolvedUsers((prev) => ({ ...prev, [id]: data }));
            }
          });
      });
    }
  }, [value, resolvedUsers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddUser = (user: UserLite) => {
    if (value.includes(user._id)) return;
    onChange([...value, user._id]);
    setQuery("");
    setShowDropdown(false);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  return (
    <Container>
      <SearchRow>
        <ComboboxWrapper ref={wrapperRef}>
          <TextField
            fullWidth
            size="small"
            label={label}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowDropdown(false);
              }
            }}
          />
          {showDropdown && (options.length > 0 || loading) && (
            <Dropdown>
              {loading && (
                <DropdownItem style={{ color: "#999", fontSize: 13 }}>
                  {t("loading") || "Searching..."}
                </DropdownItem>
              )}
              {options.map((option) => (
                <DropdownItem key={option._id} onClick={() => handleAddUser(option)}>
                  <Avatar src={option.image} />
                  <ItemInfo>
                    <MainText>{option.displayName || option.name}</MainText>
                    {option.name !== option.displayName && <SubText>{option.name}</SubText>}
                  </ItemInfo>
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </ComboboxWrapper>
      </SearchRow>

      {value.length > 0 && (
        <EntryList>
          {value.map((id, index) => {
            const user = resolvedUsers[id];
            const displayName = user ? user.displayName || user.name : id;

            return (
              <EntryItem key={index}>
                <Avatar src={user?.image} />
                <ItemInfo>
                  <MainText>{displayName}</MainText>
                  <SubText>{id}</SubText>
                </ItemInfo>
                <EntryActions>
                  <DeleteButton onClick={() => handleRemove(id)} iconSize={18} />
                </EntryActions>
              </EntryItem>
            );
          })}
        </EntryList>
      )}
    </Container>
  );
}
