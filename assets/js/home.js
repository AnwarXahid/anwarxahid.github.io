(() => {
  "use strict";

  const body = document.body;
  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("field");
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = document.querySelector(".motion-toggle");
  let paused = motionQuery.matches;
  try { paused = paused || localStorage.getItem("portfolio-motion") === "paused"; } catch {}

  const syncMotion = () => {
    body.dataset.motion = paused ? "paused" : "playing";
    if (!toggle) return;
    toggle.hidden = false;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.querySelector(".motion-label").textContent = paused
      ? toggle.dataset.labelPlay || "Play motion"
      : toggle.dataset.labelPause || "Pause motion";
    toggle.querySelector(".motion-symbol").textContent = paused ? "▷" : "Ⅱ";
    document.dispatchEvent(new Event("portfolio:motion"));
  };
  toggle?.addEventListener("click", () => {
    paused = !paused;
    try { localStorage.setItem("portfolio-motion", paused ? "paused" : "playing"); } catch {}
    syncMotion();
  });
  motionQuery.addEventListener("change", () => { paused = motionQuery.matches; syncMotion(); });
  syncMotion();

  // Register the observer before hiding anything. Content stays visible if setup fails.
  if ("IntersectionObserver" in window && !paused) {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        target.classList.add("in");
        reveal.unobserve(target);
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -28px 0px" });
    document.querySelectorAll(".rv").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) return;
      const siblings = [...el.parentElement.children].filter((node) => node.classList.contains("rv"));
      el.style.setProperty("--reveal-delay", Math.min(siblings.indexOf(el), 2) * 80 + "ms");
      reveal.observe(el);
      el.classList.add("pre");
    });
    const showFocused = (event) => event.target.closest(".rv")?.classList.add("in");
    document.addEventListener("focusin", showFocused);
    document.addEventListener("portfolio:motion", () => {
      if (paused) {
        document.querySelectorAll(".rv.pre").forEach((el) => el.classList.add("in"));
        reveal.disconnect();
      }
    });
  }

  // Keep the native scroll behavior; only measure it for the reading progress line.
  let scrollPending = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    body.style.setProperty("--reading-progress", max > 0 ? String(scrollY / max) : "0");
    scrollPending = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  // A local highlight follows the pointer without moving card content.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".publication-card, .project-card, .research-area").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (paused) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--pointer-x", event.clientX - rect.left + "px");
        card.style.setProperty("--pointer-y", event.clientY - rect.top + "px");
      }, { passive: true });
    });
  }

  if (!canvas || !hero) return;
  let gl;
  try { gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" }); } catch {}
  if (!gl) return; // The layered CSS backdrop is the static fallback.

  // Original procedural water: domain-warped waves, surface normals and soft caustics.
  // One fullscreen triangle, no textures or third-party rendering dependencies.
  const vertexSource = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision highp float;
    uniform vec2 resolution;
    uniform vec2 pointer;
    uniform vec3 ripple;
    uniform float time;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
        mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = mat2(1.6, -1.2, 1.2, 1.6) * p + 3.1;
        a *= 0.5;
      }
      return v;
    }
    float surface(vec2 p) {
      vec2 drift = vec2(time * 0.055, -time * 0.035);
      vec2 warp = vec2(sin(p.y * 0.9 + time * 0.09), cos(p.x * 0.7 - time * 0.07));
      return fbm(p + warp * 0.85 + drift);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float aspect = resolution.x / resolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 4.2;
      p += vec2(0.2, -0.12) * time * 0.08;
      vec2 delta = (uv - pointer) * vec2(aspect, 1.0);
      p += delta * exp(-dot(delta, delta) * 5.0) * 0.22;
      float age = time - ripple.z;
      vec2 dropDelta = (uv - ripple.xy) * vec2(aspect, 1.0);
      float distanceToDrop = length(dropDelta);
      if (age >= 0.0 && age < 5.0) {
        float ring = sin(distanceToDrop * 42.0 - age * 5.5);
        float envelope = exp(-pow((distanceToDrop - age * 0.16) * 7.0, 2.0)) * exp(-age * 0.9);
        p += normalize(dropDelta + vec2(0.001)) * ring * envelope * 0.085;
      }
      float h = surface(p);
      float dx = surface(p + vec2(0.035, 0.0)) - h;
      float dy = surface(p + vec2(0.0, 0.035)) - h;
      vec3 normal = normalize(vec3(-dx * 14.0, -dy * 14.0, 0.6));
      vec3 light = normalize(vec3(-0.5, 0.8, 1.3));
      float specular = pow(max(dot(reflect(-light, normal), vec3(0., 0., 1.)), 0.0), 22.0);
      float caustic = pow(max(1.0 - abs(h - 0.48) * 9.0, 0.0), 5.0);
      float softLight = exp(-length((uv - vec2(0.78, 0.58)) * vec2(1.1, 0.7)) * 2.0);
      vec3 deep = vec3(0.013, 0.037, 0.064);
      vec3 blue = vec3(0.025, 0.16, 0.22);
      vec3 color = mix(deep, blue, smoothstep(0.15, 0.8, h) * softLight);
      color += vec3(0.13, 0.42, 0.45) * caustic * softLight * 0.55;
      color += vec3(0.40, 0.67, 0.68) * specular * softLight * 0.45;
      color += vec3(0.01, 0.04, 0.052) * softLight;
      float vignette = 1.0 - smoothstep(0.15, 0.9, length((uv - 0.5) * vec2(0.9, 1.0)));
      color *= 0.55 + vignette * 0.45;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  let program;
  try {
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  } catch (error) {
    canvas.style.display = "none";
    console.warn("Water backdrop unavailable; using static background.", error);
    return;
  }
  const uniforms = Object.fromEntries(["resolution", "pointer", "ripple", "time"].map((name) => [name, gl.getUniformLocation(program, name)]));
  let frame = 0, last = 0, elapsed = 12, visible = true, lost = false;
  let point = [0.72, 0.55], target = [...point], drop = [0.72, 0.55, -100];

  const draw = () => {
    if (lost) return;
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, point[0], point[1]);
    gl.uniform3f(uniforms.ripple, drop[0], drop[1], drop[2]);
    gl.uniform1f(uniforms.time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const resize = () => {
    // Bound GPU work by pixel count on high density and tall mobile displays.
    const { width, height } = hero.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(800000 / (width * height)));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  };
  const tick = (now) => {
    frame = requestAnimationFrame(tick);
    if (now - last < 1000 / 30) return;
    elapsed += last ? Math.min((now - last) / 1000, 0.08) : 0;
    last = now;
    point[0] += (target[0] - point[0]) * 0.045;
    point[1] += (target[1] - point[1]) * 0.045;
    draw();
  };
  const reconcile = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (!paused && visible && !document.hidden && !lost) frame = requestAnimationFrame(tick);
  };
  hero.addEventListener("pointermove", (event) => {
    if (paused || event.pointerType === "touch") return;
    const rect = hero.getBoundingClientRect();
    target = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
  }, { passive: true });
  hero.addEventListener("pointerdown", (event) => {
    if (paused || event.target.closest("a, button")) return;
    const rect = hero.getBoundingClientRect();
    drop = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height, elapsed];
  }, { passive: true });
  document.addEventListener("portfolio:motion", reconcile);
  document.addEventListener("visibilitychange", reconcile);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reconcile(); }).observe(hero);
  }
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); }, { passive: true });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    canvas.style.opacity = "0";
    reconcile();
  });
  // Restore the CSS fallback if the browser reclaims this decorative context.
  resize();
  canvas.classList.add("water-ready");
  reconcile();
})();
