(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const nav = document.querySelector("[data-nav]");
  const progress = document.querySelector(".scroll-progress");

  window.addEventListener("load", () => {
    window.setTimeout(() => body.classList.add("is-loaded"), 260);
  });

  const updateScrollState = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  const revealItems = document.querySelectorAll(".section, .glass-card, .project-card, .publication-card, .timeline-item, .blog-card, .portfolio-card");
  revealItems.forEach((item) => item.classList.add("reveal"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  revealItems.forEach((item) => observer.observe(item));

  const cursor = document.querySelector(".cursor-dot");
  if (cursor && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;

    window.addEventListener("pointermove", (event) => {
      tx = event.clientX;
      ty = event.clientY;
      cursor.style.opacity = "1";
    }, { passive: true });

    document.querySelectorAll("a, button, .glass-card, .project-card, .publication-card").forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
    });

    const renderCursor = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();
  }

  if (!reducedMotion) {
    const tiltCards = document.querySelectorAll(".glass-card, .project-card, .publication-card, .portrait-frame");
    tiltCards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-4px) rotateX(${py * -4}deg) rotateY(${px * 5}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  const canvas = document.getElementById("lab-field");
  if (!canvas || reducedMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let particles = [];
  let pointerX = 0;
  let pointerY = 0;

  const createParticles = () => {
    const count = Math.min(86, Math.max(42, Math.floor((width * height) / 26000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.35 + Math.random() * 1.2,
      vx: -0.14 + Math.random() * 0.28,
      vy: -0.1 + Math.random() * 0.2,
      size: 0.7 + Math.random() * 1.8
    }));
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / width - 0.5) * 18;
    pointerY = (event.clientY / height - 0.5) * 18;
  }, { passive: true });

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx * p.z + pointerX * 0.002;
      p.y += p.vy * p.z + pointerY * 0.002;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      const alpha = 0.18 + p.z * 0.2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(120, 241, 255, ${alpha})`;
      ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 128) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(88, 243, 255, ${(1 - dist / 128) * 0.13})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  };

  resize();
  draw();
})();
