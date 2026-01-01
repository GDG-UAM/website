import { Chip, ChipProps } from "@mui/material";
import { ReactNode } from "react";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
}

export const textColumn = <T,>(
  key: string,
  header: string,
  getValue: (item: T) => string | number | null | undefined,
  options?: { bold?: boolean; subValue?: (item: T) => ReactNode }
): AdminTableColumn<T> => ({
  key,
  header,
  render: (item) => {
    const val = getValue(item);
    return (
      <div>
        <div style={{ fontWeight: options?.bold ? 600 : 400 }}>{val ?? "—"}</div>
        {options?.subValue && (
          <div style={{ color: "#6b7280", fontSize: "12px" }}>{options.subValue(item)}</div>
        )}
      </div>
    );
  }
});

export const chipColumn = <T, K extends string>(
  key: string,
  header: string,
  getStatus: (item: T) => K,
  getLabel: (status: K) => string,
  getColor: (status: K) => ChipProps["color"],
  variant: ChipProps["variant"] = "outlined"
): AdminTableColumn<T> => ({
  key,
  header,
  render: (item) => {
    const status = getStatus(item);
    return (
      <Chip size="small" variant={variant} color={getColor(status)} label={getLabel(status)} />
    );
  }
});

export const dateColumn = <T,>(
  key: string,
  header: string,
  getDate: (item: T) => Date | string | null | undefined,
  options?: { includeTime?: boolean }
): AdminTableColumn<T> => ({
  key,
  header,
  render: (item) => {
    const rawDate = getDate(item);
    if (!rawDate) return "—";
    const d = new Date(rawDate);
    return options?.includeTime ? d.toLocaleString() : d.toLocaleDateString();
  }
});

export const customColumn = <T,>(
  key: string,
  header: string,
  render: (item: T) => ReactNode,
  options?: Partial<AdminTableColumn<T>>
): AdminTableColumn<T> => ({
  key,
  header,
  render,
  ...options
});
