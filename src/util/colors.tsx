/** Basic utility functions for the components  */

// Darken unplayed colors
export function darken_hex(hex: string, frac: number = 0.2): string {
  const cleanHex = hex.replace("#", "");
  const r = Math.floor(parseInt(cleanHex.substring(0, 2), 16) * frac);
  const g = Math.floor(parseInt(cleanHex.substring(2, 4), 16) * frac);
  const b = Math.floor(parseInt(cleanHex.substring(4, 6), 16) * frac);
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

// Usage
export const primaryColor: string = getGlobalCSSVar("--color-primary");
export const secondaryColor: string = getGlobalCSSVar("--color-secondary");
export const tertiaryColor: string = getGlobalCSSVar("--color-tertiary");
