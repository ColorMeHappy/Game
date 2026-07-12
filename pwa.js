"use strict";

(() => {
  const root = document.documentElement;
  const body = document.body;
  const installButton = document.getElementById("installPwaButton");
  const installGuide = document.getElementById("installGuide");
  const closeInstallGuide = document.getElementById("closeInstallGuide");
  const installGuideDone = document.getElementById("installGuideDone");
  const offlineToast = document.getElementById("offlineToast");
  const canvas = document.getElementById("game");
  let deferredInstallPrompt = null;
  let toastTimer = 0;

  const userAgent = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isTouch = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;

  body.classList.toggle("is-ios", isIOS);
  body.classList.toggle("is-standalone", isStandalone);
  body.classList.toggle("is-touch", isTouch);

  function updateViewportVars() {
    const viewport = window.visualViewport;
    const width = viewport ? viewport.width : window.innerWidth;
    const height = viewport ? viewport.height : window.innerHeight;
    root.style.setProperty("--app-width", `${Math.round(width)}px`);
    root.style.setProperty("--app-height", `${Math.round(height)}px`);
  }

  function showInstallGuide() {
    installGuide?.classList.remove("hidden");
  }

  function hideInstallGuide() {
    installGuide?.classList.add("hidden");
  }

  function updateInstallButton() {
    if (!installButton) return;
    installButton.classList.toggle("hidden", isStandalone);
    installButton.textContent = deferredInstallPrompt ? "Install App" : isIOS ? "Install on iPhone" : "Install App";
  }

  async function installApp() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } finally {
        deferredInstallPrompt = null;
        updateInstallButton();
      }
      return;
    }
    showInstallGuide();
  }

  async function enterImmersiveMode() {
    if (!isTouch || isIOS || isStandalone) return;
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (_) {}
    try {
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch (_) {}
  }

  function showNetworkToast(message) {
    if (!offlineToast) return;
    offlineToast.textContent = message;
    offlineToast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => offlineToast.classList.remove("visible"), 2400);
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton?.classList.add("hidden");
    hideInstallGuide();
  });

  installButton?.addEventListener("click", installApp);
  closeInstallGuide?.addEventListener("click", hideInstallGuide);
  installGuideDone?.addEventListener("click", hideInstallGuide);
  installGuide?.addEventListener("pointerdown", event => {
    if (event.target === installGuide) hideInstallGuide();
  });

  ["playButton", "campaignStartButton", "storyStartButton"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", enterImmersiveMode, { passive: true });
  });

  canvas?.addEventListener("contextmenu", event => event.preventDefault());
  canvas?.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
  document.addEventListener("gesturestart", event => event.preventDefault(), { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", event => {
    const now = Date.now();
    if (now - lastTouchEnd <= 280) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  window.addEventListener("offline", () => showNetworkToast("Offline mode active"));
  window.addEventListener("online", () => showNetworkToast("Connection restored"));
  window.addEventListener("resize", updateViewportVars, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(updateViewportVars, 120), { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewportVars, { passive: true });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(error => {
        console.warn("PWA service worker registration failed", error);
      });
    });
  }

  updateViewportVars();
  updateInstallButton();
})();
