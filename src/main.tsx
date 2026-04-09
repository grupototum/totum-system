import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- PWA Service Worker Registration ---
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && !isInIframe && !isPreviewHost) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.onupdatefound = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
                console.log("[SW] Nova versão disponível.");
              }
            };
          }
        };
      })
      .catch((err) => console.warn("[SW] Registro falhou:", err));
  });
} else if (isPreviewHost || isInIframe) {
  // Unregister any existing SW in preview/iframe
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
