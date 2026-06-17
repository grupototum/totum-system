import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Fallbacks para quando .env não existe no build (credenciais anon — seguro embedar).
const FALLBACK_ENV = {
  VITE_SUPABASE_URL: "https://fgosozxvhbdhqigwzqih.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb3Nvenh2aGJkaHFpZ3d6cWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDkyNzksImV4cCI6MjA5MDAyNTI3OX0.F92C_qDXYrflzbziYtZIjDmy0X2GyMgqDaaGPlUcrpY",
  VITE_SUPABASE_PROJECT_ID: "fgosozxvhbdhqigwzqih",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      target: "esnext",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // React e tudo que depende diretamente de React vai junto para evitar
              // que createContext seja chamado antes do React estar disponível.
              if (
                id.includes("react-dom") ||
                id.includes("react-router-dom") ||
                id.includes("react/") ||
                /[/\\]react[/\\]/.test(id) ||
                id.includes("@radix-ui") ||
                id.includes("cmdk") ||
                id.includes("vaul") ||
                id.includes("react-resizable-panels") ||
                id.includes("embla-carousel-react") ||
                id.includes("react-dropzone") ||
                id.includes("react-hook-form") ||
                id.includes("@hookform") ||
                id.includes("input-otp") ||
                id.includes("next-themes") ||
                id.includes("sonner") ||
                id.includes("framer-motion")
              ) return "vendor-react";
              if (id.includes("@tanstack")) return "vendor-query";
              if (id.includes("@supabase")) return "vendor-supabase";
              if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) return "vendor-charts";
              if (id.includes("lucide")) return "vendor-icons";
              if (id.includes("xlsx") || id.includes("exceljs")) return "vendor-xlsx";
              if (id.includes("date-fns") || id.includes("react-day-picker")) return "vendor-date";
            }
          },
        },
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || FALLBACK_ENV.VITE_SUPABASE_URL
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_ENV.VITE_SUPABASE_PUBLISHABLE_KEY
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        env.VITE_SUPABASE_PROJECT_ID || FALLBACK_ENV.VITE_SUPABASE_PROJECT_ID
      ),
    },
  };
});
