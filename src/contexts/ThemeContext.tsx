import { createContext, useContext, useEffect, type ReactNode } from "react";

// O Totum é dark-only. O modo claro foi removido; o tema fica travado em escuro.
type Theme = "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "dark";
  setTheme: (t?: unknown) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    document.body.classList.add("dark-bg");
    document.body.classList.remove("light");
    try {
      localStorage.setItem("totum-theme", "dark");
    } catch {}
  }, []);

  const noop = () => {};

  return (
    <ThemeContext.Provider value={{ theme: "dark", resolvedTheme: "dark", setTheme: noop, toggleTheme: noop }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
