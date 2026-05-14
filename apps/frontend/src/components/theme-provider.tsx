"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "civic" | "ghost";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("civic");
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("likas-theme") as Theme | null;
    const initial = stored || "civic";
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial === "ghost" ? "ghost" : "light");
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("likas-theme", newTheme);
    document.documentElement.setAttribute(
      "data-theme",
      newTheme === "ghost" ? "ghost" : "light"
    );
  };

  const toggleTheme = () => {
    const newTheme = theme === "civic" ? "ghost" : "civic";
    setTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
