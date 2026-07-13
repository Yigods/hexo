import {
  getStyleStatus,
  styleStatus,
  updateStyleStatus,
} from "../state/styleStatus.js";

const mermaidSelector = ".mermaid";
let didInitAuto = false;

const ensureOriginalData = () => {
  document.querySelectorAll(mermaidSelector).forEach((element) => {
    if (!element.getAttribute("data-original-code")) {
      element.setAttribute("data-original-code", element.innerHTML);
    }
  });
};

const resetProcessed = () => {
  document.querySelectorAll(mermaidSelector).forEach((element) => {
    const originalCode = element.getAttribute("data-original-code");
    if (originalCode !== null) {
      element.removeAttribute("data-processed");
      element.innerHTML = originalCode;
    }
  });
};

export const ModeToggle = {
  modeToggleButton_dom: null,
  iconDom: null,
  mermaidLightTheme: null,
  mermaidDarkTheme: null,

  mermaidInit(theme) {
    if (!window.mermaid) {
      return;
    }

    ensureOriginalData();
    resetProcessed();
    mermaid.initialize({ theme });
    mermaid.init({ theme }, document.querySelectorAll(mermaidSelector));
  },

  enableLightMode() {
    document.body.classList.remove("dark-mode");
    document.documentElement.classList.remove("dark");
    document.body.classList.add("light-mode");
    document.documentElement.classList.add("light");
    if (this.iconDom) {
      this.iconDom.className = "fa-regular fa-moon";
    }
    updateStyleStatus({ isDark: false });
    this.mermaidInit(this.mermaidLightTheme);
    this.setGiscusTheme();
    this.setUtterancesTheme();
  },

  enableDarkMode() {
    document.body.classList.remove("light-mode");
    document.documentElement.classList.remove("light");
    document.body.classList.add("dark-mode");
    document.documentElement.classList.add("dark");
    if (this.iconDom) {
      this.iconDom.className = "fa-regular fa-brightness";
    }
    updateStyleStatus({ isDark: true });
    this.mermaidInit(this.mermaidDarkTheme);
    this.setGiscusTheme();
    this.setUtterancesTheme();
  },

  async setGiscusTheme(theme) {
    const container = document.querySelector("#giscus-container");
    if (!container) {
      return;
    }

    theme ??= styleStatus.isDark ? "dark" : "light";
    const themeRoot = new URL(config.root || "/", window.location.origin);
    const giscusTheme = theme === "dark"
      ? new URL("css/giscus-comment-dark.css?v=2", themeRoot).href
      : theme === "light"
        ? new URL("css/giscus-comment-light.css?v=2", themeRoot).href
        : theme;
    const giscusScript = container.querySelector('script[src="https://giscus.app/client.js"]');
    if (giscusScript) {
      giscusScript.setAttribute("data-theme", giscusTheme);
    }

    const maxAttempts = 30;
    let giscusFrame = container.querySelector("iframe.giscus-frame");
    for (let attempt = 0; attempt < maxAttempts && !giscusFrame; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      giscusFrame = container.querySelector("iframe.giscus-frame");
    }

    if (!giscusFrame?.contentWindow) {
      return;
    }

    if (giscusFrame.classList.contains("giscus-frame--loading")) {
      await new Promise((resolve) => {
        const timeoutId = setTimeout(resolve, 6000);
        giscusFrame.addEventListener(
          "load",
          () => {
            clearTimeout(timeoutId);
            resolve();
          },
          { once: true },
        );
      });
    }

    if (giscusFrame.classList.contains("giscus-frame--loading")) {
      return;
    }

    giscusFrame.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: giscusTheme,
          },
        },
      },
      "https://giscus.app",
    );
  },

  async setUtterancesTheme(theme) {
    const container = document.querySelector("#utterances-container");
    if (!container) {
      return;
    }

    const themeLight =
      container.dataset.utterancesThemeLight || "github-light";
    const themeDark =
      container.dataset.utterancesThemeDark || "github-dark";
    theme ??= styleStatus.isDark ? themeDark : themeLight;

    const maxAttempts = 10;
    let utterancesFrame = document.querySelector("iframe.utterances-frame");

    for (let attempt = 0; attempt < maxAttempts && !utterancesFrame; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      utterancesFrame = document.querySelector("iframe.utterances-frame");
    }

    if (!utterancesFrame || !utterancesFrame.contentWindow) {
      return;
    }

    utterancesFrame.contentWindow.postMessage(
      { type: "set-theme", theme },
      "https://utteranc.es",
    );
  },

  isDarkPrefersColorScheme() {
    return (
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
    );
  },

  initModeStatus() {
    const storedStatus = getStyleStatus();

    if (storedStatus) {
      storedStatus.isDark ? this.enableDarkMode() : this.enableLightMode();
    } else {
      this.isDarkPrefersColorScheme().matches
        ? this.enableDarkMode()
        : this.enableLightMode();
    }
  },

  initModeToggleButton(signal) {
    if (!this.modeToggleButton_dom) {
      return;
    }

    const handler = () => {
      const isDark = document.body.classList.contains("dark-mode");
      isDark ? this.enableLightMode() : this.enableDarkMode();
    };

    if (signal) {
      this.modeToggleButton_dom.addEventListener("click", handler, { signal });
    } else {
      this.modeToggleButton_dom.addEventListener("click", handler);
    }
  },

  initModeAutoTrigger(appSignal) {
    const isDarkMode = this.isDarkPrefersColorScheme();
    if (!isDarkMode || didInitAuto) {
      return;
    }

    didInitAuto = true;
    const handler = (event) => {
      event.matches ? this.enableDarkMode() : this.enableLightMode();
    };

    if (appSignal) {
      isDarkMode.addEventListener("change", handler, { signal: appSignal });
    } else {
      isDarkMode.addEventListener("change", handler);
    }
  },

  init({ signal, appSignal } = {}) {
    this.modeToggleButton_dom = document.querySelector(
      ".tool-dark-light-toggle",
    );
    this.iconDom = document.querySelector(".tool-dark-light-toggle i");

    const mermaidThemeConfig =
      theme.plugins?.mermaid?.theme || theme.mermaid?.style || {};
    this.mermaidLightTheme = mermaidThemeConfig.light || "default";
    this.mermaidDarkTheme = mermaidThemeConfig.dark || "dark";

    this.initModeStatus();
    this.initModeToggleButton(signal);
    this.initModeAutoTrigger(appSignal);

    ensureOriginalData();
  },
};

export default function initModeToggle(options = {}) {
  ModeToggle.init(options);
}
