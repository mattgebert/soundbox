import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

/** A custom hook to detect the system's dark mode preference and update the state accordingly. It listens for changes in the system's color scheme and updates the state when the preference changes.
 *
 * @returns A boolean indicating whether the system is in dark mode (true) or light mode (false).
 */
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

export function useTheme() {
  // Initialize state from localStorage, defaulting to 'system'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("app-theme") as ThemeMode) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const root = document.documentElement;

    // Function to apply the actual dark mode class to HTML
    const applyTheme = () => {
      let isDark: boolean;
      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = theme === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    };

    applyTheme();
    localStorage.setItem("app-theme", theme);

    // If mode is 'system', listen for live OS adjustments
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemChange = () => applyTheme();

      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }
  }, [theme]);

  // Helper to cycle through states: light -> dark -> system
  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  return { theme, setTheme, cycleTheme };
}
