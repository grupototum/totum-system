import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Fallbacks for when .env is gitignored and missing in published builds.
// These are publishable (anon) credentials — safe to embed.
const FALLBACK_ENV = {
  VITE_SUPABASE_URL: "https://sugulxjfkhibuddmoyzr.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1Z3VseGpma2hpYnVkZG1veXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODUwOTEsImV4cCI6MjA4OTM2MTA5MX0.Skr8cZ1_WIyY-lzaprmFfitGPrv24dvcFOPIgXtV2yQ",
  VITE_SUPABASE_PROJECT_ID: "sugulxjfkhibuddmoyzr",
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
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
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
