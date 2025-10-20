"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { track } from "@/lib/telemetry/client";
import {
  AvatarButton,
  UserMenuIconSlot as IconSlot,
  UserMenuDivider as Divider,
  UserMenuWrapper as Wrapper,
  UserMenuList as Menu,
  UserMenuItem as MenuItem
} from "./Navbar.styles";
import { LoginButton } from "@/components/Buttons";
import { useGiveawaysParticipation } from "@/lib/giveaways/useParticipation";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("navbar");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const role = session?.user?.role;
  const isPrivileged = role === "admin" || role === "team";
  const { participating } = useGiveawaysParticipation({ revalidateOnFocus: false });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Hook handles fetching/caching; we only show the menu item when authenticated and participating

  if (status === "loading") {
    return <LoginButton onClick={() => {}} disabled iconSize={18} />;
  }

  if (!session?.user) {
    return (
      <LoginButton
        onClick={() => {
          void signIn();
        }}
        iconSize={18}
      />
    );
  }

  const avatarSrc =
    typeof session.user.image === "string" ? session.user.image : "/logo/32x32.webp";

  return (
    <Wrapper ref={ref}>
      <AvatarButton
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={session.user.name || "User menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={session.user.name || "User"}
          width={34}
          height={34}
          style={{ borderRadius: "50%" }}
        />
      </AvatarButton>
      <Menu role="menu" aria-label={t("myProfile")} $open={open}>
        {isPrivileged && (
          <MenuItem role="none">
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)}>
              <IconSlot>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  fill="var(--navbar-user-menu-link-text)"
                >
                  <path d="M680-280q25 0 42.5-17.5T740-340q0-25-17.5-42.5T680-400q-25 0-42.5 17.5T620-340q0 25 17.5 42.5T680-280Zm0 120q31 0 57-14.5t42-38.5q-22-13-47-20t-52-7q-27 0-52 7t-47 20q16 24 42 38.5t57 14.5ZM480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v227q-19-8-39-14.5t-41-9.5v-147l-240-90-240 90v188q0 47 12.5 94t35 89.5Q310-290 342-254t71 60q11 32 29 61t41 52q-1 0-1.5.5t-1.5.5Zm200 0q-83 0-141.5-58.5T480-280q0-83 58.5-141.5T680-480q83 0 141.5 58.5T880-280q0 83-58.5 141.5T680-80ZM480-494Z" />
                </svg>
              </IconSlot>
              <span>{t("adminPanel")}</span>
            </Link>
          </MenuItem>
        )}
        {isPrivileged && <Divider />}
        <MenuItem role="none">
          <Link role="menuitem" href={`/user/${session.user.id}`} onClick={() => setOpen(false)}>
            <IconSlot>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="var(--navbar-user-menu-link-text)"
              >
                <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" />
              </svg>
            </IconSlot>
            <span>{t("myProfile")}</span>
          </Link>
        </MenuItem>
        {participating && (
          <MenuItem role="none">
            <Link role="menuitem" href="/giveaways" onClick={() => setOpen(false)}>
              <IconSlot>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  fill="var(--navbar-user-menu-link-text)"
                >
                  {/* <path d="M160-80v-440H80v-240h208q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q23 0 43 8.5t37 23.5q17-16 37-24t43-8q50 0 85 35t35 85q0 11-2 20.5t-6 19.5h208v240h-80v440H160Zm400-760q-17 0-28.5 11.5T520-800q0 17 11.5 28.5T560-760q17 0 28.5-11.5T600-800q0-17-11.5-28.5T560-840Zm-200 40q0 17 11.5 28.5T400-760q17 0 28.5-11.5T440-800q0-17-11.5-28.5T400-840q-17 0-28.5 11.5T360-800ZM160-680v80h280v-80H160Zm280 520v-360H240v360h200Zm80 0h200v-360H520v360Zm280-440v-80H520v80h280Z" /> */}
                  <path d="M160-280v80h640v-80H160Zm0-440h88q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q30 0 55.5 15.5T460-826l20 26 20-26q18-24 44-39t56-15q50 0 85 35t35 85q0 11-1.5 21t-6.5 19h88q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720Zm0 320h640v-240H596l84 114-64 46-136-184-136 184-64-46 82-114H160v240Zm200-320q17 0 28.5-11.5T400-760q0-17-11.5-28.5T360-800q-17 0-28.5 11.5T320-760q0 17 11.5 28.5T360-720Zm240 0q17 0 28.5-11.5T640-760q0-17-11.5-28.5T600-800q-17 0-28.5 11.5T560-760q0 17 11.5 28.5T600-720Z" />
                </svg>
              </IconSlot>
              <span>{t("myGiveaways", { default: "My giveaways" })}</span>
            </Link>
          </MenuItem>
        )}
        <MenuItem role="none">
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)}>
            <IconSlot>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="var(--navbar-user-menu-link-text)"
              >
                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
              </svg>
            </IconSlot>
            <span>{t("settings")}</span>
          </Link>
        </MenuItem>
        <Divider />
        <MenuItem role="none">
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              track("auth_logout", { event_props: { source: "user_menu" } });
              signOut();
            }}
            style={{ width: "100%", color: "var(--navbar-user-menu-logout-text)" }}
          >
            <IconSlot>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="var(--navbar-user-menu-logout-text)"
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
              </svg>
            </IconSlot>
            <span>{t("logout", { default: "Logout" })}</span>
          </button>
        </MenuItem>
      </Menu>
    </Wrapper>
  );
}
