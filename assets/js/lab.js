(() => {
  const root = document.documentElement;

  // ---- Dark mode toggle (persisted via localStorage) ----
  const toggle = document.getElementById("theme-toggle");

  const currentTheme = () =>
    root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  const syncToggle = () => {
    if (!toggle) return;
    const isDark = currentTheme() === "dark";
    toggle.textContent = isDark ? "Light mode" : "Dark mode";
    toggle.setAttribute("aria-pressed", String(isDark));
  };

  syncToggle();

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        // localStorage unavailable (private mode, etc.) — theme just won't persist.
      }
      syncToggle();
    });
  }

  // ---- Copy-to-clipboard for BibTeX blocks ----
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-copy-target");
      const target = targetId && document.getElementById(targetId);
      if (!target) return;

      const text = target.textContent.trim();
      const original = btn.textContent;

      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
      } catch (e) {
        btn.textContent = "Copy failed";
      }

      window.setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    });
  });
})();
