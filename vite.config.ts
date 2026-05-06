import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Fallbacks for when .env is gitignored and missing in published builds.
// These are publishable (anon) credentials — safe to embed.
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
