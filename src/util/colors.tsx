/** Basic utility functions for the components  */
import { useEffect, useState } from "react";

// Darken unplayed colors
/** Adjusts a hex color by a fraction. If zero_dark is true, it darkens the color; otherwise, it lightens it.
 *
 * @param hex The hex color string (e.g., "#ff0000").
 * @param frac The fraction by which to adjust the color (default is 0.2).
 * @param zero_dark The boolean indicating whether to darken (true) or lighten (false) the color (default is true).
 * @returns The adjusted hex color string.
 */
export function adjust_hex(
  hex: string,
  frac: number = 0.2,
  zero_dark: boolean = true,
): string {
  const cleanHex = hex.replace("#", "");
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);
  if (zero_dark) {
    r = Math.max(0, Math.floor(r * frac));
    g = Math.max(0, Math.floor(g * frac));
    b = Math.max(0, Math.floor(b * frac));
  } else {
    r = Math.min(255, Math.floor(r * frac));
    g = Math.min(255, Math.floor(g * frac));
    b = Math.min(255, Math.floor(b * frac));
  }
  const r_hex = r.toString(16).padStart(2, "0");
  const g_hex = g.toString(16).padStart(2, "0");
  const b_hex = b.toString(16).padStart(2, "0");
  return `#${r_hex}${g_hex}${b_hex}`;
}

// Read a global CSS variable safely
export const getGlobalCSSVar = (varName: string): string => {
  const rootStyles = window.getComputedStyle(document.documentElement);
  const value = rootStyles.getPropertyValue(varName).trim();
  // Convert to HEX string if it's in RGB format
  if (value.startsWith("rgb")) {
    const rgbValues = value.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      const r = parseInt(rgbValues[0]).toString(16).padStart(2, "0");
      const g = parseInt(rgbValues[1]).toString(16).padStart(2, "0");
      const b = parseInt(rgbValues[2]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
  }
  // Add a output alert to show the value of the variable
  // alert(`${varName} has value ${value}`);
  return value;
};

export function useSystemDarkMode(): boolean {
  // Initialize state with the current system setting
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // Handle SSR safely
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Handler to update state when the system setting changes
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDark(event.matches);
    };

    // Listen for OS-level theme changes
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDark;
}

// Usage
export const primaryColor: string = getGlobalCSSVar("--color-primary");
export const secondaryColor: string = getGlobalCSSVar("--color-secondary");
export const tertiaryColor: string = getGlobalCSSVar("--color-tertiary");
