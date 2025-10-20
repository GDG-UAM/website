"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { resolveCssColor } from "@/lib/utils/colors";

const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState({
    primary: "#1976d2",
    secondary: "#fbc02d",
    error: "#d32f2f",
    success: "#2e7d32",
    warning: "#ed6c02",
    info: "#0288d1"
  });

  useEffect(() => {
    function updateColors() {
      setColors({
        primary: resolveCssColor("var(--button-primary-bg)", "#1976d2"),
        secondary: resolveCssColor("var(--button-secondary-bg)", "#fbc02d"),
        error: resolveCssColor("var(--button-danger-bg)", "#d32f2f"),
        success: resolveCssColor("var(--toast-success-bg)", "#2e7d32"),
        warning: resolveCssColor("var(--button-warning-bg)", "#ed6c02"),
        info: resolveCssColor("var(--toast-info-bg)", "#0288d1")
      });
    }
    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-contrast",
        "data-deuteranopia",
        "data-protanopia",
        "data-tritanopia",
        "data-theme"
      ]
    });
    return () => observer.disconnect();
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        typography: { fontFamily: "inherit" },
        palette: {
          primary: { main: colors.primary, contrastText: "#fff" },
          secondary: { main: colors.secondary, contrastText: "#000" },
          error: { main: colors.error, contrastText: "#fff" },
          warning: { main: colors.warning, contrastText: "#000" },
          success: { main: colors.success, contrastText: "#fff" },
          info: { main: colors.info, contrastText: "#fff" }
        },
        components: {
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                "&.Mui-focused": {
                  outline: "none",
                  boxShadow: "none"
                }
              }
            }
          },
          MuiFilledInput: {
            styleOverrides: {
              root: {
                "&.Mui-focused": {
                  outline: "none",
                  boxShadow: "none"
                }
              }
            }
          },
          MuiInput: {
            styleOverrides: {
              root: {
                "&:focus": {
                  outline: "none",
                  boxShadow: "none"
                }
              }
            }
          },
          MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 500 } } },
          MuiCheckbox: {
            styleOverrides: {
              root: { color: colors.primary, "&.Mui-checked": { color: colors.primary } }
            }
          },
          MuiRadio: {
            styleOverrides: {
              root: { color: colors.primary, "&.Mui-checked": { color: colors.primary } }
            }
          },
          MuiSwitch: {
            styleOverrides: {
              switchBase: {
                "&.Mui-checked": { color: colors.primary },
                "&.Mui-checked + .MuiSwitch-track": { backgroundColor: colors.primary }
              }
            }
          }
        }
      }),
    [colors]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default AppThemeProvider;
