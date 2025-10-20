"use client";

import Link from "next/link";
import styled from "styled-components";
import React from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
};

const Nav = styled.nav`
  width: 100%;
  margin: 4px 0 12px 0;
`;

const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  color: #4b5563;
  font-size: 14px;
`;

const Crumb = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  a {
    color: #2563eb;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

const Sep = styled.span`
  color: #9ca3af;
`;

export default function AdminBreadcrumbs({ items, className, style }: AdminBreadcrumbsProps) {
  const last = items.length - 1;
  return (
    <Nav aria-label="breadcrumb" className={className} style={style}>
      <List>
        {items.map((it, i) => (
          <Crumb key={`${it.label}-${i}`}>
            {it.href && i !== last ? (
              <Link href={it.href}>{it.label}</Link>
            ) : (
              <span>{it.label}</span>
            )}
            {i !== last && <Sep>/</Sep>}
          </Crumb>
        ))}
      </List>
    </Nav>
  );
}
