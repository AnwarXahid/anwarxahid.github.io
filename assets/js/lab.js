(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

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
  let redrawThumbs = () => {};

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
      redrawThumbs();
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

  /* ---------------- Generative "diagnostic" card thumbnails ---------------- */
  safe(() => {
    const seeded = (seed) => {
      let s = (seed >>> 0) || 1;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    };

    const draw = (canvas) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 180;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const line = css("--line");
      const accent = css("--accent");
      const warn = css("--warn");
      const muted = css("--muted");
      ctx.fillStyle = css("--surface-2");
      ctx.fillRect(0, 0, w, h);

      const seed = parseInt(canvas.dataset.seed, 10) || 7;
      const mode = ((((parseInt(canvas.dataset.mode, 10) || 0) % 4) + 4) % 4);
      const rnd = seeded(seed + mode * 97);
      const pad = 16;
      const iw = w - pad * 2;
      const ih = h - pad * 2;

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= 6; gx++) {
        const x = pad + (iw * gx) / 6;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, h - pad);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 4; gy++) {
        const y = pad + (ih * gy) / 4;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }

      if (mode === 0) {
        const n = 68;
        const split = 0.32 + rnd() * 0.26;
        const ref = [];
        let y = pad + ih * 0.5;
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          y += (rnd() - 0.5) * 7;
          y = Math.max(pad + 4, Math.min(h - pad - 4, y));
          const x = pad + (iw * i) / n;
          ref.push([x, y]);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          let yy = ref[i][1];
          if (t > split) {
            const k = (t - split) / (1 - split);
            yy += (rnd() - 0.5) * k * k * ih * 1.1;
          }
          yy = Math.max(3, Math.min(h - 3, yy));
          i ? ctx.lineTo(ref[i][0], yy) : ctx.moveTo(ref[i][0], yy);
        }
        ctx.stroke();

        const sx = pad + iw * split;
        ctx.strokeStyle = warn;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(sx, pad);
        ctx.lineTo(sx, h - pad);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (mode === 1) {
        const mid = pad + ih * 0.5;
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad, mid);
        ctx.lineTo(w - pad, mid);
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 46; i++) {
          const x = pad + rnd() * iw;
          const outlier = rnd() > 0.86;
          const spread = outlier ? ih * 0.42 : ih * 0.12;
          const yy = mid + (rnd() - 0.5) * 2 * spread;
          ctx.fillStyle = outlier ? warn : accent;
          ctx.globalAlpha = outlier ? 0.95 : 0.55;
          ctx.beginPath();
          ctx.arc(x, yy, outlier ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (mode === 2) {
        const bars = 11;
        const gap = 5;
        const bw = (iw - gap * (bars - 1)) / bars;
        const thr = pad + ih * 0.32;
        for (let i = 0; i < bars; i++) {
          const center = Math.exp(-Math.pow((i - bars / 2) / 2.4, 2));
          let bh = ih * (0.14 + center * 0.7 * (0.7 + rnd() * 0.6));
          bh = Math.min(bh, ih);
          const x = pad + i * (bw + gap);
          const yTop = h - pad - bh;
          const over = yTop < thr;
          ctx.fillStyle = over ? warn : accent;
          ctx.globalAlpha = over ? 0.9 : 0.45;
          ctx.fillRect(x, yTop, bw, bh);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = warn;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pad, thr);
        ctx.lineTo(w - pad, thr);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const cols = 22;
        const cw = iw / cols;
        const rows = 4;
        for (let i = 0; i < cols; i++) {
          for (let r = 0; r < rows; r++) {
            const v = rnd();
            ctx.fillStyle = v > 0.8 ? warn : accent;
            ctx.globalAlpha = 0.14 + v * 0.7;
            ctx.fillRect(
              pad + i * cw + 1,
              pad + (ih * r) / rows + 1,
              cw - 2,
              ih / rows - 2
            );
          }
        }
        ctx.globalAlpha = 1;
      }
    };

    const thumbs = Array.prototype.slice.call(
      document.querySelectorAll("canvas.card-thumb")
    );
    if (!thumbs.length) return;

    redrawThumbs = () => thumbs.forEach(draw);
    redrawThumbs();

    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = window.setTimeout(redrawThumbs, 200);
    });
  });

  /* ---------------- Hero field: lattice + instability wavefront ---------------- */
  safe(() => {
    const field = document.getElementById("field");
    const hero = document.querySelector(".hero");
    if (!field || !hero) return;
    const fctx = field.getContext("2d");
    if (!fctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const GAP = 34;
    let pts = [];
    let W = 0;
    let H = 0;
    let waveX = -160;
    let last = 0;
    let raf = null;

    const build = () => {
      W = hero.clientWidth;
      H = hero.clientHeight;
      field.width = W * dpr;
      field.height = H * dpr;
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      for (let y = GAP; y < H; y += GAP) {
        for (let x = GAP; x < W + GAP; x += GAP) {
          pts.push({ x, y });
        }
      }
    };

    const render = (wave, tms) => {
      const accent = css("--accent");
      const warn = css("--warn");
      const band = 150;
      fctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        let infl = Math.max(0, 1 - Math.abs(p.x - wave) / band);
        infl *= infl;
        const off = infl * Math.sin(tms * 0.004 + p.y * 0.06 + p.x * 0.01) * 16;
        const r = 1 + infl * 2.4;
        fctx.beginPath();
        fctx.arc(p.x, p.y + off, r, 0, Math.PI * 2);
        fctx.fillStyle = infl > 0.04 ? warn : accent;
        fctx.globalAlpha = infl > 0.04 ? 0.28 + infl * 0.6 : 0.14;
        fctx.fill();
      }
      fctx.globalAlpha = 1;
    };

    const loop = (ts) => {
      if (!last) last = ts;
      const dt = Math.min(48, ts - last);
      last = ts;
      waveX += dt * 0.06;
      if (waveX > W + 180) waveX = -160;
      render(waveX, ts);
      raf = requestAnimationFrame(loop);
    };

    const startAnim = () => {
      build();
      if (reduce) {
        render(-999, 0);
        return;
      }
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(loop);
    };

    startAnim();

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

  /* ---------------- Hero readout drift ---------------- */
  safe(() => {
    const ro = document.getElementById("ro");
    const ro2 = document.getElementById("ro2");
    if (reduce || !ro || !ro2) return;
    let drift = 0;
    window.setInterval(() => {
      drift += (Math.random() - 0.48) * 0.03;
      drift = Math.max(-0.9, Math.min(0.9, drift));
      ro.textContent = (0.42 + drift * 0.1).toFixed(3);
      ro2.textContent = (drift >= 0 ? "+" : "") + drift.toFixed(2);
    }, 900);
  });
})();
