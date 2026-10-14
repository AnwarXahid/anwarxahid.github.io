(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Run a feature block in isolation: one failure never breaks the others,
     and the reveal system can never leave content invisible. */
  const safe = (fn) => {
    try {
      fn();
    } catch (e) {
      if (window.console) console.warn("[lab.js]", e);
    }
  };

  /* ---------------- Reveal on scroll (defensive) ---------------- */
  safe(() => {
    const els = Array.prototype.slice.call(document.querySelectorAll(".rv"));
    if (!els.length) return;
    const showAll = () => els.forEach((el) => el.classList.add("in"));

    if (reduce || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    els.forEach((el) => el.classList.add("pre"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));

    /* failsafes — content is visible even if the observer never fires */
    window.setTimeout(showAll, 1800);
    window.addEventListener("load", () => window.setTimeout(showAll, 400));
  });

  /* ---------------- Dark mode toggle (persisted) ---------------- */

  safe(() => {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    const label = toggle.querySelector(".label");

    const currentTheme = () =>
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    const sync = () => {
      const isDark = currentTheme() === "dark";
      if (label) label.textContent = isDark ? "Light" : "Dark";
      toggle.setAttribute("aria-pressed", String(isDark));
    };

    sync();
    toggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* private mode — won't persist */
      }
      sync();
    });
  });

  /* ---------------- Copy-to-clipboard for BibTeX ---------------- */
  safe(() => {
    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy-target");
        const target = id && document.getElementById(id);
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
  });

  /* ---------------- Scroll-spy + sliding nav pill ---------------- */
  safe(() => {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;
    const pill = nav.querySelector(".nav-pill");
    const links = Array.prototype.slice.call(nav.querySelectorAll("a"));

    const idFor = (a) => {
      const href = a.getAttribute("href") || "";
      const h = href.indexOf("#");
      return h >= 0 ? href.slice(h + 1) : "";
    };

    const sections = links.map((a) => {
      const id = idFor(a);
      return id ? document.getElementById(id) : null;
    });
    if (!sections.some(Boolean)) return; // inner pages: nothing to spy

    let currentId = null;

    const movePill = (link) => {
      if (!pill) return;
      if (!link) {
        pill.style.opacity = "0";
        return;
      }
      pill.style.opacity = "1";
      pill.style.width = link.offsetWidth + "px";
      pill.style.transform =
        "translateY(-50%) translateX(" + link.offsetLeft + "px)";
    };

    const setActive = (id) => {
      if (id === currentId) return;
      currentId = id;
      let active = null;
      links.forEach((a) => {
        const on = idFor(a) === id;
        a.classList.toggle("active", on);
        if (on) active = a;
      });
      movePill(active);
      if (active && nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({
          left: active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2,
          behavior: reduce ? "auto" : "smooth",
        });
      }
    };

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(en.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => s && spy.observe(s));

    window.addEventListener("resize", () => {
      const a = nav.querySelector("a.active");
      if (a) movePill(a);
    });

    const hash = (location.hash || "").slice(1);
    if (hash && sections.some((s) => s && s.id === hash)) {
      setActive(hash);
    }
    window.setTimeout(() => {
      const a = nav.querySelector("a.active");
      if (a) movePill(a);
    }, 90);
  });

  /* ---------------- Hero field: flowing contour lines ---------------- */
  safe(() => {
    const field = document.getElementById("field");
    const hero = document.querySelector(".hero");
    if (!field || !hero) return;
    const fctx = field.getContext("2d", { alpha: true });
    if (!fctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = null;
    let last = 0;
    let pointer = { x: 0.7, y: 0.5 };

    const build = () => {
      W = hero.clientWidth;
      H = hero.clientHeight;
      field.width = Math.round(W * dpr);
      field.height = Math.round(H * dpr);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (time) => {
      fctx.clearRect(0, 0, W, H);
      const origin = H * 0.54;
      const flow = time * 0.00024;
      const reach = Math.min(W, H) * 0.19;
      const bend = (pointer.y - 0.5) * 22;

      // Overlapping bands create the depth and movement of a slow current.
      for (let band = 0; band < 3; band++) {
        const count = band === 0 ? 30 : 20;
        for (let line = 0; line < count; line++) {
          const progress = line / count;
          const depth = (progress - 0.5) * reach * (band === 0 ? 2 : 2.8);
          const phase = flow * (band % 2 ? -1 : 1) + band * 2.3;
          const amplitude = 18 + progress * 22 + band * 9;
          fctx.beginPath();
          for (let x = -12; x <= W + 12; x += 10) {
            const nx = x / Math.max(W, 1);
            const perspective = Math.sin(Math.PI * nx);
            const swell = Math.sin(nx * 8.3 + phase + line * 0.095) * amplitude;
            const ripple = Math.sin(nx * 19 - phase * 1.8 + line * 0.2) * 5.5;
            const current = Math.sin(nx * 3.7 + phase * 0.55) * 22;
            const pull = Math.exp(-Math.pow((nx - pointer.x) * 3.3, 2)) * bend;
            const y = origin + depth + (swell + ripple + current) * perspective + pull;
            if (x === -12) fctx.moveTo(x, y);
            else fctx.lineTo(x, y);
          }
          const hue = band === 1 ? "142, 212, 231" : band === 2 ? "83, 167, 206" : "116, 226, 225";
          const gradient = fctx.createLinearGradient(0, 0, W, 0);
          gradient.addColorStop(0, `rgba(${hue}, 0)`);
          gradient.addColorStop(0.33, `rgba(${hue}, ${0.08 + progress * 0.07})`);
          gradient.addColorStop(0.7, `rgba(${hue}, ${0.25 + progress * 0.2})`);
          gradient.addColorStop(1, `rgba(${hue}, 0)`);
          fctx.strokeStyle = gradient;
          fctx.lineWidth = line % 9 === 0 ? 1.25 : 0.65;
          fctx.stroke();
        }
      }

      // A few reflected glints make the current feel liquid without obscuring text.
      for (let i = 0; i < 25; i++) {
        const x = W * (0.38 + ((i * 0.618) % 0.6));
        const y = origin + Math.sin(i * 7.2 + flow) * reach * 0.65;
        const shimmer = reduce ? 0.28 : 0.12 + (Math.sin(time * 0.0014 + i * 3.7) + 1) * 0.13;
        fctx.beginPath();
        fctx.arc(x, y, i % 5 === 0 ? 1.4 : 0.7, 0, Math.PI * 2);
        fctx.fillStyle = `rgba(196, 249, 246, ${shimmer})`;
        fctx.fill();
      }
    };

    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      if (ts - last < 33) return;
      last = ts;
      render(ts);
    };

    const startAnim = () => {
      build();
      cancelAnimationFrame(raf);
      if (reduce) {
        render(0);
        return;
      }
      last = 0;
      raf = requestAnimationFrame(loop);
    };

    startAnim();
    hero.addEventListener("pointermove", (event) => {
      pointer = { x: event.clientX / Math.max(W, 1), y: event.clientY / Math.max(H, 1) };
    }, { passive: true });

    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = window.setTimeout(startAnim, 220);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!reduce && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    });
  });
})();
