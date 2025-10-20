import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import styled, { css, keyframes } from "styled-components";

export const Bar = styled.nav`
  position: sticky;
  top: 0;
  z-index: 1002;
  background: var(--navbar-bar-bg);
  color: var(--navbar-bar-text);
  border-bottom: 1px solid var(--navbar-bar-border-bottom);
  box-shadow: var(--navbar-bar-shadow);
`;

export const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;

  @media (min-width: 768px) {
    padding: 16px 28px;
  }
`;

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  font-weight: 600;
  letter-spacing: 0.2px;

  &:hover {
    color: inherit;
  }

  &:focus {
    color: inherit !important;
  }
`;

export const DesktopNav = styled.ul`
  list-style: none;
  display: none;
  margin: 0;
  padding: 0;
  gap: 6px;
  align-items: center;

  @media (min-width: 900px) {
    display: flex;
  }
`;

export const MobileNav = styled.ul<{ $open?: boolean; $aiActive: boolean }>`
  list-style: none;
  margin: 0;
  padding: 0;
  display: none;

  ${({ $open, $aiActive }) => css`
    @media (max-width: 899px) {
      position: fixed;
      top: ${$aiActive ? "110" : "68"}px;
      left: 0;
      right: 0;
      background: var(--navbar-mobile-bg);
      border-bottom: 1px solid var(--navbar-mobile-border-bottom);
      box-shadow: var(--navbar-mobile-shadow);
      display: flex;
      flex-direction: column;
      padding: 10px;
      transform: translateY(${$open ? "0" : "calc(-100% - 64px)"});

      visibility: ${$open ? "visible" : "hidden"};
      transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1001;
    }
  `}
`;

// Overlay component for mobile menu
export const Overlay = styled.div<{ $open: boolean }>`
  @media (max-width: 899px) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--navbar-overlay-bg);
    opacity: ${({ $open }) => ($open ? "1" : "0")};
    visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
    transition:
      opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
  }

  @media (min-width: 900px) {
    display: none;
  }
`;

export const NavItem = styled.li``;

const colorMap: Record<string, string> = {
  "/": "var(--navbar-link-text-active-root)",
  "/events": "var(--navbar-link-text-active-events)",
  "/newsletter": "var(--navbar-link-text-active-newsletter)",
  "/blog": "var(--navbar-link-text-active-blog)",
  "/about": "var(--navbar-link-text-active-about)",
  "/contact": "var(--navbar-link-text-active-contact)"
};

const bgMap: Record<string, string> = {
  "/": "var(--navbar-link-bg-active-root)",
  "/events": "var(--navbar-link-bg-active-events)",
  "/newsletter": "var(--navbar-link-bg-active-newsletter)",
  "/blog": "var(--navbar-link-bg-active-blog)",
  "/about": "var(--navbar-link-bg-active-about)",
  "/contact": "var(--navbar-link-bg-active-contact)"
};

// Slightly stronger background on hover
const hoverBgMap: Record<string, string> = {
  "/": "var(--navbar-link-bg-hover-active-root)",
  "/events": "var(--navbar-link-bg-hover-active-events)",
  "/newsletter": "var(--navbar-link-bg-hover-active-newsletter)",
  "/blog": "var(--navbar-link-bg-hover-active-blog)",
  "/about": "var(--navbar-link-bg-hover-active-about)",
  "/contact": "var(--navbar-link-bg-hover-active-contact)"
};

const navLinkStyles = css<{ $active?: boolean } & { href: string }>`
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--navbar-link-text) !important;
  text-decoration: none;
  font-size: 1.02rem;
  line-height: 1;
  transition:
    background-color 0.15s ease-in-out,
    color 0.15s ease-in-out;

  /* use colored bg on hover */
  &:hover {
    background: ${({ href }) => bgMap[href] || "var(--navbar-link-bg-hover-default)"};
  }

  /* active state */
  ${({ $active, href }) =>
    $active &&
    css`
      color: ${colorMap[href] || colorMap["/"]} !important;
      background: ${bgMap[href] || bgMap["/"]};

      /* even stronger on hover when active */
      &:hover {
        background: ${hoverBgMap[href] || hoverBgMap["/"]};
      }
    `}
`;

export const NavLinkA = styled(Link)<{ $active?: boolean }>`
  ${navLinkStyles}
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const LangButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  color: var(--navbar-lang-button-text);
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.15s ease-in-out;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: var(--navbar-lang-button-bg-hover);
  }
`;

export const DesktopSpacer = styled.div`
  width: 8px;
  @media (max-width: 899px) {
    display: none;
  }
`;

export const FlagImg = styled.img`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
`;

// Language dropdown styles
export const LangDropdown = styled.div`
  position: relative;
`;

export const LangMenu = styled.ul<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--navbar-lang-menu-bg);
  border: 1px solid var(--navbar-lang-menu-border);
  box-shadow: var(--navbar-lang-menu-shadow);
  border-radius: 10px;
  /* no minimum width to let content define size */
  display: ${({ $open }) => ($open ? "block" : "none")};
  z-index: 1100;
`;

export const AiList = styled.div`
  max-height: calc(6 * 44px);
  overflow-y: auto;
`;

export const LangMenuItem = styled.li`
  button {
    width: 100%;
    display: flex;
    align-items: center;
    /* left aligned content */
    gap: 10px;
    padding: 8px 10px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--navbar-lang-item-text);
    text-align: left;
    &:hover {
      background: var(--navbar-lang-item-bg-hover);
    }
    &:disabled {
      background: var(--navbar-lang-item-bg-disabled);
      color: var(--navbar-lang-item-text-disabled);
      cursor: not-allowed;
    }
  }
`;

export const LangName = styled.span`
  min-width: max-content;
`;

export const SearchInput = styled.input`
  width: 260px;
  margin: 4px 6px 8px;
  padding: 8px 10px;
  border: 1px solid var(--navbar-search-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  &:focus {
    border-color: var(--navbar-search-input-focus-border);
    box-shadow: var(--navbar-search-input-focus-ring);
  }
`;

export const CollapsableMenuWrapper = styled.div`
  @media (min-width: 900px) {
    display: none;
  }
`;

export const FlexSpacer = styled.span`
  flex: 1;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const AvailableIcon = styled(FaCheckCircle)`
  color: var(--navbar-ai-available-icon);
  flex-shrink: 0;
`;

export const SpinnerIcon = styled(ImSpinner8)`
  color: var(--navbar-ai-spinner-icon);
  animation: ${spin} 1s linear infinite;
  flex-shrink: 0;
`;

export const AvatarButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  transition:
    background-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
  &:hover {
    background: var(--navbar-avatar-bg-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--navbar-avatar-focus-ring);
  }
`;

export const UserMenuIconSlot = styled.span`
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg {
    width: 24px;
    height: 24px;
  }
`;

export const UserMenuDivider = styled.hr`
  border: none;
  height: 1px;
  background: var(--navbar-user-divider-bg);
  margin: 6px 4px;
`;

// Refined compact user menu list
export const UserMenuWrapper = styled.div`
  position: relative;
  height: 36px;
`;

export const UserMenuList = styled.ul<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--navbar-user-menu-bg);
  border: 1px solid var(--navbar-user-menu-border);
  box-shadow: var(--navbar-user-menu-shadow);
  border-radius: 10px;
  display: ${({ $open }) => ($open ? "block" : "none")};
  z-index: 1100;
  width: max-content;
  min-width: 160px;
`;

export const UserMenuItem = styled.li`
  button,
  a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: #3c4043;
    color: var(--navbar-user-menu-item-text);
    text-decoration: none;
    font: inherit;
    text-align: left;
    line-height: 1;
    white-space: nowrap;
    font-size: 0.92rem;
    max-width: 100%;
    &:hover {
      background: var(--navbar-user-menu-item-bg-hover);
    }
    &:focus-visible {
      outline: none;
      background: var(--navbar-user-menu-item-bg-focus);
    }
  }
`;
