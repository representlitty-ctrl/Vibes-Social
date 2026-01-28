import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";
type ColorTheme = "red" | "blue" | "green" | "purple" | "orange";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  defaultColorTheme = "red",
  storageKey = "vibes-theme",
  colorStorageKey = "vibes-color-theme",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
  storageKey?: string;
  colorStorageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(colorStorageKey) as ColorTheme) || defaultColorTheme;
    }
    return defaultColorTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Disable transitions during theme switch for instant change
    root.style.setProperty('--theme-transition', 'none');
    root.classList.add('theme-switching');
    
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Re-enable transitions after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.removeProperty('--theme-transition');
        root.classList.remove('theme-switching');
      });
    });
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Disable transitions during color theme switch
    root.style.setProperty('--theme-transition', 'none');
    root.classList.add('theme-switching');
    
    root.classList.remove("theme-red", "theme-blue", "theme-green", "theme-purple", "theme-orange");
    root.classList.add(`theme-${colorTheme}`);
    
    // Re-enable transitions after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.removeProperty('--theme-transition');
        root.classList.remove('theme-switching');
      });
    });
  }, [colorTheme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    colorTheme,
    setColorTheme: (newColorTheme: ColorTheme) => {
      localStorage.setItem(colorStorageKey, newColorTheme);
      setColorTheme(newColorTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export const COLOR_THEMES: { value: ColorTheme; label: string; color: string }[] = [
  { value: "red", label: "Red", color: "hsl(0, 70%, 45%)" },
  { value: "blue", label: "Blue", color: "hsl(210, 70%, 45%)" },
  { value: "green", label: "Green", color: "hsl(142, 70%, 35%)" },
  { value: "purple", label: "Purple", color: "hsl(270, 70%, 50%)" },
  { value: "orange", label: "Orange", color: "hsl(25, 95%, 50%)" },
];
