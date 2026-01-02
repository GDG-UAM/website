"use client";

import {
  CustomButton,
  CustomButtonProps,
  DEFAULT_CONFIRMATION_TIME,
  CustomButtonColor,
  PressEvent as InternalPressEvent
} from "./_buttons/CustomButton";
import { ButtonProvider as OriginalButtonProvider } from "./_buttons/ButtonProvider";
import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

export const ButtonProvider = OriginalButtonProvider;

type PropsToOmit = "path" | "viewPort" | "hoverColor";
export type PressEvent = InternalPressEvent;

const CHECK_ICON_PATH = "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z";

export const PlainButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  color = "primary",
  ...props
}) => {
  return <CustomButton color={color} {...props} />;
};

export const DownloadButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
      color={color}
      ariaLabel={ariaLabel ?? t("download")}
      {...props}
    />
  );
};

export const AcceptButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
      color={color}
      ariaLabel={ariaLabel ?? t("accept")}
      {...props}
    />
  );
};

export const AddButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"
      color={color}
      ariaLabel={ariaLabel ?? t("add")}
      {...props}
    />
  );
};

export const BackButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"
      color={color}
      ariaLabel={ariaLabel ?? t("back")}
      {...props}
    />
  );
};

export const CancelButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "danger",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
      color={color}
      ariaLabel={ariaLabel ?? t("cancel")}
      {...props}
    />
  );
};

export const DuplicateButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M760-200H320q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200ZM560-640v-200H320v560h440v-360H560ZM160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-800v200-200 560-560Z"
      color={color}
      ariaLabel={ariaLabel ?? t("duplicate")}
      {...props}
    />
  );
};

interface CopyButtonProps extends Omit<CustomButtonProps, PropsToOmit | "onClick"> {
  content: string;
  iconSwitchDelay?: number;
  ariaLabelCopied?: string;
  colorCopied?: CustomButtonColor;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  iconSwitchDelay = 1500,
  ariaLabel,
  ariaLabelCopied,
  color = "default",
  colorCopied = "success",
  ...props
}) => {
  const [copied, setCopied] = useState(false);

  const t = useTranslations("buttons");

  const copyIconPath =
    "M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), iconSwitchDelay);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [content, iconSwitchDelay]);

  return (
    <CustomButton
      onClick={handleCopy}
      path={copied ? CHECK_ICON_PATH : copyIconPath}
      color={copied ? colorCopied : color}
      ariaLabel={copied ? (ariaLabelCopied ?? t("copy.copied")) : (ariaLabel ?? t("copy.copy"))}
      {...props}
    />
  );
};

export const DeleteButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "danger",
  showSpinner = true,
  confirmationDuration = DEFAULT_CONFIRMATION_TIME,
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
      color={color}
      showSpinner={showSpinner}
      confirmationDuration={confirmationDuration}
      ariaLabel={ariaLabel ?? t("delete")}
      {...props}
    />
  );
};

export const EditButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
      color={color}
      ariaLabel={ariaLabel ?? t("edit")}
      {...props}
    />
  );
};

export const HideButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"
      color={color}
      ariaLabel={ariaLabel ?? t("hide")}
      {...props}
    />
  );
};

export const InfoButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
      color={color}
      ariaLabel={ariaLabel ?? t("info")}
      {...props}
    />
  );
};

export const LoginButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M480-120v-80h280v-560H480v-80h280q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H480Zm-80-160-55-58 102-102H120v-80h327L345-622l55-58 200 200-200 200Z"
      color={color}
      ariaLabel={ariaLabel ?? t("login")}
      {...props}
    />
  );
};

interface OpenLinkButtonProps extends Omit<CustomButtonProps, PropsToOmit | "onClick"> {
  href: string;
}

export const OpenLinkButton: React.FC<OpenLinkButtonProps> = ({
  href,
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  const handleClick = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <CustomButton
      onClick={handleClick}
      path="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"
      color={color}
      ariaLabel={ariaLabel ?? t("openLink")}
      {...props}
    />
  );
};

export const NextButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"
      color={color}
      ariaLabel={ariaLabel ?? t("next")}
      {...props}
    />
  );
};

export const ReadButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M120-240v-80h480v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"
      color={color}
      ariaLabel={ariaLabel ?? t("read")}
      {...props}
    />
  );
};

export const SaveButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"
      color={color}
      ariaLabel={ariaLabel ?? t("save")}
      {...props}
    />
  );
};

export const ViewButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"
      color={color}
      ariaLabel={ariaLabel ?? t("view")}
      {...props}
    />
  );
};

export const CollapsableMenuButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"
      color={color}
      ariaLabel={ariaLabel ?? t("menu")}
      {...props}
    />
  );
};

interface ConfigSocials {
  baseUrl: string;
  iconPath: string;
  isPathElement?: boolean;
  viewBox: string;
  labelKey: string;
  hoverColor: string;
}

const SocialMedia: Record<string, ConfigSocials> = {
  instagram: {
    baseUrl: "https://instagram.com/",
    iconPath:
      "M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334",
    viewBox: "-1 -1 18 18",
    labelKey: "openInstagram",
    hoverColor: "var(--button-instagram-hover-text)"
  },
  linkedin: {
    baseUrl: "https://www.linkedin.com/in/",
    iconPath:
      "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z",
    viewBox: "-1 -1 18 18",
    labelKey: "openLinkedin",
    hoverColor: "var(--button-linkedin-hover-text)"
  },
  linkedinCompany: {
    baseUrl: "https://www.linkedin.com/company/",
    iconPath:
      "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z",
    viewBox: "-1 -1 18 18",
    labelKey: "openLinkedin",
    hoverColor: "var(--button-linkedin-hover-text)"
  },
  github: {
    baseUrl: "https://github.com/",
    iconPath:
      "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z",
    viewBox: "0 0 98 96",
    labelKey: "openGithub",
    hoverColor: "var(--button-github-hover-text)"
  },
  x: {
    baseUrl: "https://x.com/",
    iconPath:
      "M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66",
    viewBox: "0 0 300 300",
    labelKey: "openX",
    hoverColor: "var(--button-x-hover-text)"
  },
  website: {
    baseUrl: "",
    iconPath:
      "M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z",
    viewBox: "50 -910 860 860",
    labelKey: "openWebsite",
    hoverColor: "var(--button-website-hover-text)"
  },
  email: {
    baseUrl: "mailto:",
    iconPath:
      "M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z",
    viewBox: "0 -960 960 960",
    labelKey: "openEmail",
    hoverColor: "var(--button-email-hover-text)"
  },
  whatsapp: {
    baseUrl: "https://chat.whatsapp.com/",
    iconPath:
      "M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232",
    viewBox: "-1 -1 18 18",
    labelKey: "openWhatsapp",
    hoverColor: "var(--button-whatsapp-hover-text)"
  },
  gdgCommunity: {
    baseUrl: "https://gdg.community.dev/",
    iconPath: `
      <g transform="matrix(1, 0, 0, 1, -175.3, -153.8)">
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M 253.038 228.062 C 253.038 228.062 220.239 202.392 213.429 201.24 C 204.384 199.71 192.523 206.083 194.4 204.7 L 247.2 166.8 C 253 162.7 260 161 267 162.2 C 274 163.3 280.1 167.2 284.3 172.9 C 288.4 178.7 290.1 185.7 288.9 192.7 C 287.8 199.7 283.9 205.8 278.2 210 L 253.038 228.062 Z M 262.6 165.5 C 257.9 165.5 253.2 167 249.3 169.8 L 196.5 207.7 C 193.572 206.586 207.276 201.125 211.783 201.731 C 223.454 203.301 250.013 225.553 250.012 225.554 L 276 206.9 C 281 203.3 284.2 198.1 285.2 192 C 286.2 186 284.8 179.9 281.2 175 C 277.6 170 272.4 166.8 266.3 165.8 C 265.1 165.6 263.8 165.5 262.6 165.5 Z"/>
        </g>
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M262.6,290.8c-5.5,0-10.9-1.7-15.4-5l-52.8-37.9c-11.9-8.5-14.6-25.2-6.1-37.1h0c4.1-5.8,10.3-9.6,17.3-10.7,7-1.1,14,.5,19.8,4.6l52.8,37.9c11.9,8.5,14.6,25.2,6.1,37.1-4.1,5.8-10.3,9.6-17.3,10.7-1.5.2-2.9.4-4.3.4ZM209.9,203.5c-1.2,0-2.5.1-3.7.3-6,1-11.3,4.3-14.9,9.2h0c-3.6,5-5,11-4,17,1,6,4.3,11.3,9.2,14.9l52.8,37.9c5,3.6,11,5,17,4,6-1,11.3-4.3,14.9-9.2,3.6-5,5-11,4-17-1-6-4.3-11.3-9.2-14.9l-52.8-37.9c-3.9-2.8-8.5-4.3-13.3-4.3Z"/>
        </g>
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M 337.4 290.8 C 329.1 290.8 321 287 315.8 279.8 C 307.3 267.9 310 251.3 321.9 242.7 L 346.237 225.23 C 346.15 225.265 382.902 257.685 394.263 253.141 L 396.625 254.514 L 352.9 285.9 C 348.2 289.3 342.8 290.9 337.4 290.9 L 337.4 290.8 Z M 391.95 253.191 C 391.95 253.191 346.657 228.708 349.163 227.638 L 324 245.7 C 313.8 253.1 311.4 267.4 318.8 277.6 C 326.2 287.8 340.5 290.2 350.7 282.8 L 391.95 253.191 Z"/>
        </g>
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M390.1,252.9c-5.5,0-10.9-1.7-15.4-5l-52.8-37.9c-11.9-8.5-14.6-25.2-6.1-37.1h0c8.5-11.9,25.2-14.6,37.1-6.1l52.8,37.9c11.9,8.5,14.6,25.2,6.1,37.1-4.1,5.8-10.3,9.6-17.3,10.7-1.5.2-2.9.4-4.3.4ZM318.8,175c-3.6,5-5,11-4,17,1,6,4.3,11.3,9.2,14.9l52.8,37.9c5,3.6,11,5,17,4,6-1,11.3-4.3,14.9-9.2,3.6-5,5-11,4-17-1-6-4.3-11.3-9.2-14.9l-52.8-37.9c-10.2-7.4-24.5-5-31.9,5.2h0Z"/>
        </g>
      </g>
    `,
    isPathElement: true,
    viewBox: "0 0 249.3 144.9",
    labelKey: "openGdgCommunity",
    hoverColor: "var(--button-gdg-community-hover-text)"
  }
};

interface OpenSocialButtonProps extends Omit<CustomButtonProps, PropsToOmit | "onClick"> {
  user: string;
  network: keyof typeof SocialMedia;
  ignoreStart?: boolean;
  showTooltip?: boolean;
}

export const OpenSocialButton: React.FC<OpenSocialButtonProps> = ({
  user,
  network,
  ignoreStart = false,
  showTooltip = false,
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");
  const social = SocialMedia[network];

  if (!social) {
    console.error(`Network "${network}" is not configured.`);
    return null;
  }

  const handleClick = () => {
    window.open(`${ignoreStart ? "" : social.baseUrl}${user}`, "_blank", "noopener,noreferrer");
  };

  const getTooltipText = (value: string, baseUrl: string) => {
    if (baseUrl) {
      if (value.startsWith(baseUrl)) {
        const rest = value.slice(baseUrl.length);
        return rest || value;
      }
      return value;
    }
    if (value.startsWith("http")) {
      return value.slice(value.indexOf("://") + 3);
    }
    return value;
  };

  const tooltipText = getTooltipText(user, social.baseUrl);

  return (
    <CustomButton
      onClick={handleClick}
      path={social.iconPath}
      isPathElement={social.isPathElement}
      color={color}
      ariaLabel={ariaLabel ?? t(social.labelKey)}
      viewBox={social.viewBox}
      hoverColor={social.hoverColor}
      tooltip={showTooltip ? tooltipText : undefined}
      {...props}
    />
  );
};

export const ReloadButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  showSpinner = true,
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"
      color={color}
      ariaLabel={ariaLabel ?? t("reload")}
      showSpinner={showSpinner}
      {...props}
    />
  );
};

export const ShareButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z"
      color={color}
      ariaLabel={ariaLabel ?? t("share")}
      {...props}
    />
  );
};

export const LinkedInShareButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path={SocialMedia.linkedin.iconPath}
      viewBox={SocialMedia.linkedin.viewBox}
      isPathElement={SocialMedia.linkedin.isPathElement}
      color={color}
      ariaLabel={ariaLabel ?? t("linkedinShare")}
      {...props}
    />
  );
};

export const OpenBadgeButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M240-40v-329L110-580l185-300h370l185 300-130 211v329l-240-80-240 80Zm80-111 160-53 160 53v-129H320v129Zm20-649L204-580l136 220h280l136-220-136-220H340Zm98 383L296-558l57-57 85 85 169-170 57 56-226 227ZM320-280h320-320Z"
      color={color}
      ariaLabel={ariaLabel ?? t("addOpenBadge")}
      {...props}
    />
  );
};

export const PrintButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z"
      color={color}
      ariaLabel={ariaLabel ?? t("print")}
      {...props}
    />
  );
};

export const PlayButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"
      color={color}
      ariaLabel={ariaLabel ?? t("play")}
      {...props}
    />
  );
};

export const PauseButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "secondary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"
      color={color}
      ariaLabel={ariaLabel ?? t("pause")}
      {...props}
    />
  );
};

export const RandomButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M640-260q25 0 42.5-17.5T700-320q0-25-17.5-42.5T640-380q-25 0-42.5 17.5T580-320q0 25 17.5 42.5T640-260ZM480-420q25 0 42.5-17.5T540-480q0-25-17.5-42.5T480-540q-25 0-42.5 17.5T420-480q0 25 17.5 42.5T480-420ZM320-580q25 0 42.5-17.5T380-640q0-25-17.5-42.5T320-700q-25 0-42.5 17.5T260-640q0 25 17.5 42.5T320-580ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"
      color={color}
      ariaLabel={ariaLabel ?? t("random")}
      {...props}
    />
  );
};

export const GridViewButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M340-540H200q-33 0-56.5-23.5T120-620v-140q0-33 23.5-56.5T200-840h140q33 0 56.5 23.5T420-760v140q0 33-23.5 56.5T340-540Zm-140-80h140v-140H200v140Zm140 500H200q-33 0-56.5-23.5T120-200v-140q0-33 23.5-56.5T200-420h140q33 0 56.5 23.5T420-340v140q0 33-23.5 56.5T340-120Zm-140-80h140v-140H200v140Zm560-340H620q-33 0-56.5-23.5T540-620v-140q0-33 23.5-56.5T620-840h140q33 0 56.5 23.5T840-760v140q0 33-23.5 56.5T760-540Zm-140-80h140v-140H620v140Zm140 500H620q-33 0-56.5-23.5T540-200v-140q0-33 23.5-56.5T620-420h140q33 0 56.5 23.5T840-340v140q0 33-23.5 56.5T760-120Zm-140-80h140v-140H620v140ZM340-620Zm0 280Zm280-280Zm0 280Z"
      color={color}
      ariaLabel={ariaLabel ?? t("gridView")}
      {...props}
    />
  );
};

export const ListViewButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M200-520q-33 0-56.5-23.5T120-600v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v160q0 33-23.5 56.5T760-520H200Zm0-80h560v-160H200v160Zm0 480q-33 0-56.5-23.5T120-200v-160q0-33 23.5-56.5T200-440h560q33 0 56.5 23.5T840-360v160q0 33-23.5 56.5T760-120H200Zm0-80h560v-160H200v160Zm0-560v160-160Zm0 400v160-160Z"
      color={color}
      ariaLabel={ariaLabel ?? t("listView")}
      {...props}
    />
  );
};

export const SearchButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"
      color={color}
      ariaLabel={ariaLabel ?? t("search")}
      {...props}
    />
  );
};

export const ChevronLeftButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"
      color={color}
      ariaLabel={ariaLabel ?? t("previous")}
      {...props}
    />
  );
};

export const ChevronRightButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"
      color={color}
      ariaLabel={ariaLabel ?? t("next")}
      {...props}
    />
  );
};

export const ChevronDownButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"
      color={color}
      ariaLabel={ariaLabel ?? t("down")}
      {...props}
    />
  );
};

export const ManageButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "primary",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M520-600v-80h120v-160h80v160h120v80H520Zm120 480v-400h80v400h-80Zm-400 0v-160H120v-80h320v80H320v160h-80Zm0-320v-400h80v400h-80Z"
      color={color}
      ariaLabel={ariaLabel ?? t("manage")}
      {...props}
    />
  );
};

export const UpButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"
      color={color}
      ariaLabel={ariaLabel ?? t("up")}
      {...props}
    />
  );
};

export const DownButton: React.FC<Omit<CustomButtonProps, PropsToOmit>> = ({
  ariaLabel,
  color = "default",
  ...props
}) => {
  const t = useTranslations("buttons");

  return (
    <CustomButton
      path="M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z"
      color={color}
      ariaLabel={ariaLabel ?? t("down")}
      {...props}
    />
  );
};

interface SendButtonProps extends Omit<CustomButtonProps, PropsToOmit> {
  iconSwitchDelay?: number;
  ariaLabelSent?: string;
  colorSent?: CustomButtonColor;
  childrenSent?: React.ReactNode;
  tooltipSent?: string | null;
}

export const SendButton: React.FC<SendButtonProps> = ({
  ariaLabel,
  color = "primary",
  colorSent = "success",
  iconSwitchDelay = 1500,
  ariaLabelSent,
  confirmationDuration,
  childrenSent,
  tooltipSent,
  tooltip,
  children,
  onClick,
  disabled = false,
  ...props
}) => {
  const t = useTranslations("buttons");
  const [sent, setSent] = useState(false);

  const sendIconPath =
    "M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z";

  const handleClick = useCallback(async () => {
    if (disabled) return;
    const res = onClick?.();
    try {
      if (res instanceof Promise) await res;
      setSent(true);
      setTimeout(() => setSent(false), iconSwitchDelay);
    } catch {}
  }, [onClick, iconSwitchDelay, disabled]);

  return (
    <CustomButton
      onClick={handleClick}
      path={sent ? CHECK_ICON_PATH : sendIconPath}
      color={sent ? colorSent : color}
      ariaLabel={sent ? (ariaLabelSent ?? t("send.sent")) : (ariaLabel ?? t("send.send"))}
      disabled={!sent && disabled}
      confirmationDuration={sent ? undefined : confirmationDuration}
      tooltip={
        sent && tooltipSent !== undefined
          ? tooltipSent === null
            ? undefined
            : tooltipSent
          : tooltip
      }
      {...props}
    >
      {sent ? childrenSent : children}
    </CustomButton>
  );
};

const AdminButtonPaths: Record<string, string> = {
  blog: "M280-280h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z",
  newsletter:
    "M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm80-80h480v-80H240v80Zm0-160h160v-240H240v240Zm240 0h240v-80H480v80Zm0-160h240v-80H480v80ZM160-200v-560 560Z",
  events:
    "M580-240q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z",
  giveaways:
    "M160-80v-440H80v-240h208q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q23 0 43 8.5t37 23.5q17-16 37-24t43-8q50 0 85 35t35 85q0 11-2 20.5t-6 19.5h208v240h-80v440H160Zm400-760q-17 0-28.5 11.5T520-800q0 17 11.5 28.5T560-760q17 0 28.5-11.5T600-800q0-17-11.5-28.5T560-840Zm-200 40q0 17 11.5 28.5T400-760q17 0 28.5-11.5T440-800q0-17-11.5-28.5T400-840q-17 0-28.5 11.5T360-800ZM160-680v80h280v-80H160Zm280 520v-360H240v360h200Zm80 0h200v-360H520v360Zm280-440v-80H520v80h280Z",
  certificates:
    "m363-310 117-71 117 71-31-133 104-90-137-11-53-126-53 126-137 11 104 90-31 133ZM480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z",
  hackathons:
    "M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z",
  games:
    "M189-160q-60 0-102.5-43T42-307q0-9 1-18t3-18l84-336q14-54 57-87.5t98-33.5h390q55 0 98 33.5t57 87.5l84 336q2 9 3.5 18.5T919-306q0 61-43.5 103.5T771-160q-42 0-78-22t-54-60l-28-58q-5-10-15-15t-21-5H385q-11 0-21 5t-15 15l-28 58q-18 38-54 60t-78 22Zm3-80q19 0 34.5-10t23.5-27l28-57q15-31 44-48.5t63-17.5h190q34 0 63 18t45 48l28 57q8 17 23.5 27t34.5 10q28 0 48-18.5t21-46.5q0 1-2-19l-84-335q-7-27-28-44t-49-17H285q-28 0-49.5 17T208-659l-84 335q-2 6-2 18 0 28 20.5 47t49.5 19Zm348-280q17 0 28.5-11.5T580-560q0-17-11.5-28.5T540-600q-17 0-28.5 11.5T500-560q0 17 11.5 28.5T540-520Zm80-80q17 0 28.5-11.5T660-640q0-17-11.5-28.5T620-680q-17 0-28.5 11.5T580-640q0 17 11.5 28.5T620-600Zm0 160q17 0 28.5-11.5T660-480q0-17-11.5-28.5T620-520q-17 0-28.5 11.5T580-480q0 17 11.5 28.5T620-440Zm80-80q17 0 28.5-11.5T740-560q0-17-11.5-28.5T700-600q-17 0-28.5 11.5T660-560q0 17 11.5 28.5T700-520Zm-360 60q13 0 21.5-8.5T370-490v-40h40q13 0 21.5-8.5T440-560q0-13-8.5-21.5T410-590h-40v-40q0-13-8.5-21.5T340-660q-13 0-21.5 8.5T310-630v40h-40q-13 0-21.5 8.5T240-560q0 13 8.5 21.5T270-530h40v40q0 13 8.5 21.5T340-460Zm140-20Z",
  links:
    "M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z",
  permissions:
    "M720-240q25 0 42.5-17.5T780-300q0-25-17.5-42.5T720-360q-25 0-42.5 17.5T660-300q0 25 17.5 42.5T720-240Zm0 120q30 0 56-14t43-39q-23-14-48-20.5t-51-6.5q-26 0-51 6.5T621-173q17 25 43 39t56 14ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM490-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v52q-18-6-37.5-9t-42.5-3v-40H240v400h212q8 24 16 41.5T490-80Zm230 40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM240-560v400-400Z",
  featureFlags:
    "M200-120v-680h360l16 80h224v400H520l-16-80H280v280h-80Zm300-440Zm86 160h134v-240H510l-16-80H280v240h290l16 80Z",
  "test-dev":
    "M200-120q-51 0-72.5-45.5T138-250l222-270v-240h-40q-17 0-28.5-11.5T280-800q0-17 11.5-28.5T320-840h320q17 0 28.5 11.5T680-800q0 17-11.5 28.5T640-760h-40v240l222 270q32 39 10.5 84.5T760-120H200Zm80-120h400L544-400H416L280-240Zm-80 40h560L520-492v-268h-80v268L200-200Zm280-280Z",
  "test-prod":
    "M200-120q-51 0-72.5-45.5T138-250l222-270v-240h-40q-17 0-28.5-11.5T280-800q0-17 11.5-28.5T320-840h320q17 0 28.5 11.5T680-800q0 17-11.5 28.5T640-760h-40v240l222 270q32 39 10.5 84.5T760-120H200Zm0-80h560L520-492v-268h-80v268L200-200Zm280-280Z",
  // ---------------------------- Hackathons ----------------------------
  "hackathon-tracks":
    "M760-120q-39 0-70-22.5T647-200H440q-66 0-113-47t-47-113q0-66 47-113t113-47h80q33 0 56.5-23.5T600-600q0-33-23.5-56.5T520-680H313q-13 35-43.5 57.5T200-600q-50 0-85-35t-35-85q0-50 35-85t85-35q39 0 69.5 22.5T313-760h207q66 0 113 47t47 113q0 66-47 113t-113 47h-80q-33 0-56.5 23.5T360-360q0 33 23.5 56.5T440-280h207q13-35 43.5-57.5T760-360q50 0 85 35t35 85q0 50-35 85t-85 35ZM200-680q17 0 28.5-11.5T240-720q0-17-11.5-28.5T200-760q-17 0-28.5 11.5T160-720q0 17 11.5 28.5T200-680Z",
  "hackathon-track-selection":
    "M440-80v-200q0-56-17-83t-45-53l57-57q12 11 23 23.5t22 26.5q14-19 28.5-33.5T538-485q38-35 69-81t33-161l-63 63-57-56 160-160 160 160-56 56-64-63q-2 143-44 203.5T592-425q-32 29-52 56.5T520-280v200h-80ZM248-633q-4-20-5.5-44t-2.5-50l-64 63-56-56 160-160 160 160-57 56-63-62q0 21 2 39.5t4 34.5l-78 19Zm86 176q-20-21-38.5-49T263-575l77-19q10 27 23 46t28 34l-57 57Z",
  "hackathon-intermission":
    "M320-400h80v-80q0-17 11.5-28.5T440-520h80v80l120-120-120-120v80h-80q-50 0-85 35t-35 85v80ZM160-240q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240H160Zm0-80h640v-440H160v440Zm0 0v-440 440ZM40-120v-80h880v80H40Z",
  "hackathon-teams":
    "M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z"
};

export const AdminNavigationButton: React.FC<
  Omit<CustomButtonProps, PropsToOmit> & { type: keyof typeof AdminButtonPaths }
> = ({ type, ariaLabel, color = "primary", ...props }) => {
  const t = useTranslations("admin.navigation");

  return (
    <CustomButton
      path={AdminButtonPaths[type]}
      color={color}
      ariaLabel={ariaLabel ?? t(type)}
      justify="flex-start"
      {...props}
    />
  );
};
