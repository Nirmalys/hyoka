/**
 * Hyoka admin UI entry (human-readable source).
 * Production bundles are built into ../dist/ via `npm run build`.
 * See ../README.md and the plugin readme.txt "Development" / "Source Code" sections.
 */
import "./public-path";

import { createRoot } from "react-dom/client";

const initReactApp = async () => {
  const container = document.getElementById("HYOKA-root");

  if (!container) {
    return;
  }

  container.classList.add("HYOKA-root");

  try {
    const { default: App } = await import(/* webpackChunkName: "app" */ "./App");
    const root = createRoot(container);
    root.render(<App />);
  } catch {
    // Initialization failed; leave the root empty.
  }
};

const startApp = () => {
  if (!window.location.hash) {
    window.location.hash = "#/home";
  }

  if (document.getElementById("HYOKA-root")) {
    initReactApp();
  } else {
    setTimeout(startApp, 200);
  }
};

document.addEventListener("DOMContentLoaded", startApp);
