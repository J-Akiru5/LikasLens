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
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      if (typeof window === "undefined") return "civic";
      const stored = localStorage.getItem("likas-theme") as Theme | null;
      return stored || "civic";
    } catch {
      return "civic";
    }
  });

  // Sync DOM attribute when theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "ghost" ? "ghost" : "light");
  }, [theme]);

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

  // Prevent hydration mismatch on server
  if (typeof window === "undefined") {
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
