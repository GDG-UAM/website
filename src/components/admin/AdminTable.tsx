"use client";

import { useState, useEffect, ReactNode } from "react";
import styled from "styled-components";
import { TextField, MenuItem } from "@mui/material";
import { ReloadButton, BackButton, NextButton } from "@/components/Buttons";
import { AdminTableColumn } from "./AdminTableFactories";

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
  padding: 12px;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    &::-webkit-scrollbar {
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 0;

  @media (max-width: 900px) {
    & > .search-field {
      flex: 1 1 100%;
      margin-left: 0 !important;
    }
  }

  @media (max-width: 640px) {
    & > * {
      flex: 1 1 100%;
      width: 100%;
      min-width: 100% !important;
      margin-left: 0 !important;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 10px 6px;
    border-bottom: 1px solid #f3f4f6;
  }
  th {
    text-align: left;
    border-bottom-width: 2px;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    min-width: 700px;
    td {
      white-space: nowrap;
    }
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.875rem;
  color: #666;
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RowActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
`;

export interface AdminTableFilter {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  minWidth?: string;
}

export interface AdminTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  loading?: boolean;
  onReload?: () => void;
  reloadLabel?: string;
  headerActions?: ReactNode;
  rowActions?: (item: T) => ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: AdminTableFilter[];
  pagination?: AdminTablePagination;
  emptyMessage?: string;
  noResultsMessage?: string;
  footerInfo?: ReactNode;
}

const LoadingSpinner = styled.div`
  width: 36px;
  height: 36px;
  border: 4px solid var(--loading-border);
  border-top: 4px solid var(--loading-border-top);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export function AdminTable<T extends { _id?: string | { toString: () => string } }>({
  columns,
  data,
  loading,
  onReload,
  reloadLabel,
  headerActions,
  rowActions,
  search,
  filters,
  pagination,
  emptyMessage = "No items found",
  noResultsMessage = "No results match your search"
}: AdminTableProps<T>) {
  const [internalReloading, setInternalReloading] = useState(false);
  const showPagination = pagination && pagination.total > pagination.pageSize;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  // Sync internal reloading state with parent loading state
  useEffect(() => {
    if (!loading) {
      setInternalReloading(false);
    }
  }, [loading]);

  const handleReload = () => {
    if (onReload) {
      setInternalReloading(true);
      onReload();
    }
  };

  const showSpinner = (loading && data.length === 0) || internalReloading;

  return (
    <Wrapper>
      <Controls>
        {onReload && <ReloadButton onClick={handleReload}>{reloadLabel || "Reload"}</ReloadButton>}
        {headerActions}
        {filters?.map((filter) => (
          <TextField
            key={filter.key}
            select
            size="small"
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            style={{ minWidth: filter.minWidth || "120px" }}
          >
            {filter.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        ))}
        {search && (
          <TextField
            className="search-field"
            size="small"
            placeholder={search.placeholder || "Search..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            style={{ marginLeft: "auto", minWidth: "250px" }}
          />
        )}
      </Controls>

      <Card>
        {showSpinner ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <LoadingSpinner />
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            {search?.value ||
            (filters && filters.some((f) => f.value && f.value !== "all" && f.value !== ""))
              ? noResultsMessage
              : emptyMessage}
          </div>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        textAlign: col.align || "left",
                        width: col.width
                      }}
                    >
                      {col.header}
                    </th>
                  ))}
                  {rowActions && <th style={{ textAlign: "right" }}></th>}
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={item._id?.toString() || idx}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align || "left"
                        }}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                    {rowActions && (
                      <td>
                        <RowActions>{rowActions(item)}</RowActions>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      {!loading && (data.length > 0 || pagination) && (
        <Footer>
          <div>
            {pagination
              ? `Showing ${data.length} of ${pagination.total}`
              : `Showing ${data.length} items`}
          </div>
          {showPagination && (
            <PaginationControls>
              <BackButton
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                iconSize={18}
              />
              <span>
                {pagination.page} / {totalPages}
              </span>
              <NextButton
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                iconSize={18}
              />
            </PaginationControls>
          )}
        </Footer>
      )}
    </Wrapper>
  );
}
