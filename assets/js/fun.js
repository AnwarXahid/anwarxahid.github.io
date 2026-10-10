/* The after-hours lab: no libraries, network requests, or global game state. */
(() => {
  "use strict";

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const effectsButton = document.getElementById("effects-toggle");
  let effectsOn = !motion.matches;

  function syncEffects() {
    document.body.dataset.effects = effectsOn ? "on" : "off";
    effectsButton.textContent = motion.matches ? "Reduced motion" : `Effects ${effectsOn ? "on" : "off"}`;
    effectsButton.setAttribute("aria-pressed", String(effectsOn));
    effectsButton.disabled = motion.matches;
  }
  effectsButton.addEventListener("click", () => {
    effectsOn = !effectsOn;
    syncEffects();
  });
  motion.addEventListener("change", () => {
    if (motion.matches) effectsOn = false;
    syncEffects();
  });
  syncEffects();

  function initGame() {
    const arena = document.getElementById("bug-arena");
    const overlay = document.getElementById("game-overlay");
    const startButton = document.getElementById("game-start");
    const pauseButton = document.getElementById("game-pause");
    const finishButton = document.getElementById("game-finish");
    const modeSelect = document.getElementById("game-mode");
    const still = document.getElementById("still-targets");
    const timeDisplay = document.getElementById("game-time");
    const scoreDisplay = document.getElementById("game-score");
    const comboDisplay = document.getElementById("game-combo");
    const bestDisplay = document.getElementById("game-best");
    const feedback = document.getElementById("game-feedback");
    const announcement = document.getElementById("game-announcement");
    const bestKey = "anwar-lab-bug-panic-best-v1";
    const bugs = ["NaN", "off-by-one", "hallucination", "data race", "memory leak", "silent drift", "tensor tantrum", "null pointer"];
    const excuses = ["works on my machine", "feature", "rounding error", "cannot reproduce", "expected behavior"];
    const bugLines = ["A reproducible result. Finally.", "One less bug. Approximately 10,000 to go.", "The GPU sends its regards.", "Your test suite felt that.", "Accepted! By the garbage collector.", "Hallucination rate: slightly less embarrassing."];
    const decoyLines = ["That was an excuse! −1. Combo peer-rejected.", "You debugged the documentation. −1. Combo reset.", "Reviewer #2 calls this a feature. −1. Combo reset."];
    const pick = (items) => items[Math.floor(Math.random() * items.length)];
    const pad = (value) => String(value).padStart(2, "0");
    let best = 0;
    let storageAvailable = true;
    try {
      const saved = Number(localStorage.getItem(bestKey));
      if (Number.isFinite(saved) && saved >= 0 && saved <= 100000) best = Math.floor(saved);
    } catch (error) { storageAvailable = false; }
    bestDisplay.textContent = pad(best);
    still.checked = motion.matches;
    motion.addEventListener("change", () => { if (motion.matches) still.checked = true; });

    // Slots are stable DOM buttons. They never vanish underneath keyboard focus.
    const slots = Array.from(arena.querySelectorAll(".bug-target"), (el, index) => ({
      el, index, active: false, real: true, phase: Math.random() * Math.PI * 2,
      expiresAt: 0, respawnAt: 0, occupied: false,
    }));
    let phase = "idle";
    let mode = "sprint";
    let score = 0;
    let combo = 0;
    let peakCombo = 0;
    let elapsed = 0;
    let lastTime = 0;
    let frameId = 0;
    let tier = 0;
    let keyboardMode = false;
    let lastSeconds = -1;
    let arenaWidth = 0;
    let arenaHeight = 0;

    const calm = () => still.checked || motion.matches || !effectsOn || keyboardMode || mode === "zen";

    function measure() {
      arenaWidth = arena.clientWidth;
      arenaHeight = arena.clientHeight;
      positionTargets(0);
    }

    function positionTargets(delta) {
      const cellWidth = arenaWidth / 3;
      const cellHeight = arenaHeight / 2;
      slots.forEach((slot) => {
        const width = Math.min(120, cellWidth - 14);
        const moving = phase === "running" && !calm() && slot.active;
        if (moving) slot.phase += delta * (.8 + tier * .65);
        const amplitudeX = moving ? Math.max(0, (cellWidth - width) / 2 - 7) : 0;
        const amplitudeY = moving ? Math.max(0, (cellHeight - 122) / 2 - 5) : 0;
        const x = (slot.index % 3) * cellWidth + (cellWidth - width) / 2 + Math.sin(slot.phase) * amplitudeX;
        const y = Math.floor(slot.index / 3) * cellHeight + (cellHeight - 122) / 2 + Math.cos(slot.phase * 1.4) * amplitudeY;
        slot.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
    }

    function drawTarget(slot, real) {
      slot.real = real;
      slot.active = true;
      slot.occupied = true;
      slot.expiresAt = elapsed + (4800 - tier * 1100);
      slot.el.disabled = phase !== "running";
      slot.el.removeAttribute("aria-disabled");
      slot.el.className = `bug-target${real ? "" : " is-decoy"}`;
      slot.el.dataset.species = String(Math.floor(Math.random() * 3));
      const label = pick(real ? bugs : excuses);
      slot.el.innerHTML = `<span class="target-key">${slot.index + 1}</span>${real ? '<svg aria-hidden="true"><use href="#arcade-bug"></use></svg>' : '<span class="decoy-art" aria-hidden="true">“”</span>'}<span class="target-label"></span>`;
      slot.el.querySelector(".target-label").textContent = label;
      slot.el.setAttribute("aria-label", `${slot.index + 1}: ${real ? "Real bug" : "Decoy excuse"}, ${label}. ${real ? "Catch for one point" : "Costs one point and resets combo"}.`);
    }

    function spawn(slot) {
      const others = slots.filter((item) => item !== slot && item.active);
      const realCount = others.filter((item) => item.real).length;
      const decoyCount = others.length - realCount;
      // At least two bugs and at most three excuses: every board is playable.
      const real = realCount < 2 || decoyCount >= 3 || Math.random() < .62 - tier * .06;
      drawTarget(slot, real);
    }

    function updateStats() {
      scoreDisplay.textContent = pad(score);
      comboDisplay.innerHTML = `${combo}<span>×</span>`;
      const seconds = mode === "zen" ? -1 : Math.max(0, Math.ceil((30000 - elapsed) / 1000));
      if (seconds !== lastSeconds) {
        timeDisplay.innerHTML = seconds < 0 ? "∞" : `${seconds}<span>s</span>`;
        timeDisplay.classList.toggle("time-urgent", seconds >= 0 && seconds <= 10);
        if (phase === "running" && (seconds === 10 || seconds === 5)) announcement.textContent = `${seconds} seconds left. Score ${score}.`;
        lastSeconds = seconds;
      }
    }

    function setOverlay(tag, title, description, button, footnote) {
      document.getElementById("overlay-tag").textContent = tag;
      document.getElementById("overlay-title").textContent = title;
      document.getElementById("overlay-description").textContent = description;
      startButton.firstChild.textContent = `${button} `;
      document.getElementById("overlay-footnote").textContent = footnote;
      overlay.hidden = false;
    }

    function endRun(early = false) {
      if (phase !== "running" && phase !== "paused") return;
      phase = "ended";
      cancelAnimationFrame(frameId);
      arena.classList.remove("is-playing", "is-paused");
      slots.forEach((slot) => { slot.el.disabled = true; });
      pauseButton.hidden = true;
      finishButton.hidden = true;
      modeSelect.disabled = false;
      const newBest = mode === "sprint" && score > best;
      if (newBest) {
        best = score;
        bestDisplay.textContent = pad(best);
        try { localStorage.setItem(bestKey, String(best)); } catch (error) { storageAvailable = false; }
      }
      setOverlay(newBest ? "NEW LAB RECORD" : mode === "zen" ? "VERY MINDFUL DEBUGGING" : "EXPERIMENT COMPLETE",
        mode === "zen" || early ? "Run wrapped." : "Time’s up!",
        `${score} points. Peak combo: ${peakCombo}. ${score >= 20 ? "Your test suite is applauding." : score >= 8 ? "A respectable dent in the backlog." : "The bugs would like to thank you for your restraint."}`,
        "Play again", mode === "zen" ? "Zen scores don’t compete with the 30-second sprint." : storageAvailable ? "Your best sprint score is saved on this browser." : "Browser storage is unavailable; your best lasts for this visit.");
      feedback.textContent = newBest ? "A new best! Put it on your CV. (Please don’t.)" : "The experiment is reproducible. Want another run?";
      feedback.dataset.kind = "bug";
      announcement.textContent = `Run finished. Score ${score}, peak combo ${peakCombo}${newBest ? ", new best score" : ""}.`;
      updateStats();
      startButton.focus({ preventScroll: true });
    }

    function advanceClock(now) {
      if (phase !== "running") return false;
      elapsed += Math.max(0, now - lastTime);
      lastTime = now;
      if (mode === "sprint" && elapsed >= 30000) {
        elapsed = 30000;
        endRun();
        return false;
      }
      return true;
    }

    function frame(now) {
      const delta = Math.min((now - lastTime) / 1000, .1);
      if (!advanceClock(now)) return;
      const nextTier = mode === "sprint" ? Math.min(2, Math.floor(elapsed / 10000)) : 0;
      if (nextTier > tier) {
        tier = nextTier;
        feedback.textContent = tier === 1 ? "Deadline approaching. The bugs recruited a collaborator." : "FINAL 10 SECONDS. Camera-ready chaos.";
        feedback.dataset.kind = "bug";
      }
      slots.forEach((slot, index) => {
        if (index >= 4 + tier) return;
        if (!slot.occupied || (!slot.active && elapsed >= slot.respawnAt)) spawn(slot);
        else if (slot.active && !calm() && elapsed >= slot.expiresAt) spawn(slot);
      });
      positionTargets(delta);
      updateStats();
      frameId = requestAnimationFrame(frame);
    }

    function hit(slot) {
      if (!advanceClock(performance.now()) || !slot.active) return;
      if (slot.real) {
        score += 1;
        combo += 1;
        peakCombo = Math.max(peakCombo, combo);
        feedback.textContent = combo > 0 && combo % 5 === 0 ? `${combo} in a row! Statistically suspicious. Keep going.` : pick(bugLines);
        feedback.dataset.kind = "bug";
      } else {
        score = Math.max(0, score - 1);
        combo = 0;
        feedback.textContent = pick(decoyLines);
        feedback.dataset.kind = "decoy";
      }
      slot.active = false;
      slot.respawnAt = elapsed + 260;
      slot.el.classList.add("is-empty");
      slot.el.setAttribute("aria-disabled", "true");
      slot.el.setAttribute("aria-label", `${slot.index + 1}: specimen respawning`);
      updateStats();
    }

    function startRun() {
      cancelAnimationFrame(frameId);
      phase = "running";
      mode = modeSelect.value;
      score = 0; combo = 0; peakCombo = 0; elapsed = 0; tier = 0; lastSeconds = -2;
      slots.forEach((slot, index) => {
        slot.active = false; slot.occupied = false;
        slot.el.disabled = index >= 4;
        if (index < 4) drawTarget(slot, index % 2 === 0);
        else slot.el.classList.add("is-empty");
      });
      overlay.hidden = true;
      arena.classList.add("is-playing");
      arena.classList.remove("is-paused");
      pauseButton.hidden = false;
      pauseButton.textContent = "Pause";
      finishButton.hidden = false;
      modeSelect.disabled = true;
      document.getElementById("timer-label").textContent = mode === "zen" ? "No deadline" : "Time left";
      feedback.textContent = mode === "zen" ? "Zen mode. The deadline has left the chat. Finish whenever you like." : "Catch the creatures. The sticky notes are excuses!";
      feedback.dataset.kind = "bug";
      updateStats();
      measure();
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
      arena.focus({ preventScroll: true });
      announcement.textContent = mode === "zen" ? "Zen run started. No timer. Use Finish run when ready." : "Run started. 30 seconds. Use keys 1 to 6 while focused in the arena.";
    }

    function pauseRun() {
      if (!advanceClock(performance.now())) return;
      phase = "paused";
      cancelAnimationFrame(frameId);
      arena.classList.add("is-paused");
      slots.forEach((slot) => { slot.el.disabled = true; });
      pauseButton.textContent = "Resume";
      setOverlay("YOUR COFFEE BREAK IS VALID", "Simulation paused.", "The bugs can wait. The timer is paused, too.", "Resume debugging", "Switching tabs pauses automatically. Resume when ready.");
      announcement.textContent = "Run paused. Timer stopped.";
    }

    function resumeRun() {
      phase = "running";
      overlay.hidden = true;
      arena.classList.remove("is-paused");
      slots.forEach((slot) => { slot.el.disabled = !slot.occupied; });
      pauseButton.textContent = "Pause";
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
      arena.focus({ preventScroll: true });
      announcement.textContent = "Run resumed.";
    }

    startButton.disabled = false;
    startButton.addEventListener("click", () => phase === "paused" ? resumeRun() : startRun());
    pauseButton.addEventListener("click", () => phase === "paused" ? resumeRun() : pauseRun());
    finishButton.addEventListener("click", () => endRun(true));
    slots.forEach((slot) => slot.el.addEventListener("click", () => hit(slot)));
    arena.addEventListener("pointerdown", () => { keyboardMode = false; });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Tab") keyboardMode = true;
    });
    arena.addEventListener("keydown", (event) => {
      if (phase !== "running") return;
      keyboardMode = true;
      if (/^[1-6]$/.test(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (!event.repeat) hit(slots[Number(event.key) - 1]);
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const current = slots.findIndex((slot) => slot.el === document.activeElement);
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" ? 3 : -3;
        let next = current < 0 ? 0 : (current + step + 6) % 6;
        while (slots[next].el.disabled) next = (next + 1) % 6;
        slots[next].el.focus();
      } else if (event.repeat && (event.key === " " || event.key === "Enter")) event.preventDefault();
      positionTargets(0);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && phase === "running") pauseRun();
    });
    window.addEventListener("pagehide", () => { if (phase === "running") pauseRun(); });
    window.addEventListener("resize", measure);
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(arena);
    measure();
  }

  function initFortune() {
    // UTC enumerates calendar days using *local* year/month/day, avoiding DST
    // shifts. Adjacent local dates select adjacent cards, including at New Year.
    const fortunes = [
      { title: "The Debugger", text: "A bug will reveal itself today. It was in the line you described as ‘obviously correct.’", gpu: "One free slot", aura: "Cautiously caffeinated", reviewer: "Almost convinced" },
      { title: "The Tensor", text: "Your dimensions will align. Your sleep schedule will remain an incompatible shape.", gpu: "Suspiciously available", aura: "Broadcasting panic", reviewer: "Needs a diagram" },
      { title: "The Deadline", text: "The universe grants you an extra day. The submission portal continues to disagree.", gpu: "Queue position: hope", aura: "Anywhere-on-Earth", reviewer: "Already on vacation" },
      { title: "The Floating Point", text: "Two GPUs will agree on everything except the answer. Congratulations: that’s your next paper.", gpu: "± one epsilon", aura: "Numerically unstable", reviewer: "Requests more precision" },
      { title: "The Coffee", text: "Your next breakthrough arrives between the third coffee and the realization it’s actually decaf.", gpu: "Warm and cooperative", aura: "Double espresso", reviewer: "Mildly awake" },
      { title: "The Rebuttal", text: "You will compose a devastating response, then replace it with ‘We thank the reviewer.’", gpu: "Reproducibly lucky", aura: "Diplomatic turbulence", reviewer: "Reading selectively" },
      { title: "The Hallucination", text: "An LLM will confidently cite your future paper. At least someone believes you’ll finish it.", gpu: "High confidence, low VRAM", aura: "Citation needed", reviewer: "Fact-checking the stars" },
      { title: "The Seed", text: "The stars have aligned. Please record the random seed so they can align again.", gpu: "Seed 42 energy", aura: "Reproducible optimism", reviewer: "Surprisingly satisfied" },
      { title: "The Ablation", text: "Remove one component and everything improves. The component is your assumption.", gpu: "Less is more VRAM", aura: "Experimentally humbled", reviewer: "Wants twelve more runs" },
      { title: "The Null Pointer", text: "You will find meaning in your research. It may require checking for null first.", gpu: "Allocation approved", aura: "Dereferencing destiny", reviewer: "Looking for the point" },
      { title: "The Checkpoint", text: "A saved checkpoint will rescue your day. Name it something better than final_final_REAL.pt.", gpu: "Weights safely loaded", aura: "Backed-up serenity", reviewer: "Version confused" },
      { title: "The Conference", text: "Someone at a poster session will understand your work. They will also ask where the snacks are.", gpu: "Travel-sized luck", aura: "Poster-board magnetic", reviewer: "Networking for cookies" },
      { title: "The Gradient", text: "Your loss will go down. Your number of browser tabs will achieve a new state of the art.", gpu: "Descending nicely", aura: "Locally optimal", reviewer: "Stuck in a minimum" },
      { title: "The Test Suite", text: "All tests will pass. For a brief, beautiful moment, resist asking why there are only three.", gpu: "Green across the board", aura: "Coverage questionable", reviewer: "Adds an edge case" },
      { title: "The Literature", text: "You will finish reading one paper and discover seventeen more. The bibliography has reproduced.", gpu: "Idle while you read", aura: "Related-work spiral", reviewer: "Suggests their own paper" },
      { title: "The Ph.D.", text: "Today’s tiny fix becomes tomorrow’s dissertation paragraph. Save the screenshot. You earned it.", gpu: "A little cosmic headroom", aura: "Progress, however small", reviewer: "Tentative thumbs-up" },
    ];
    const card = document.getElementById("fortune-card");
    const redraw = document.getElementById("fortune-redraw");
    const readings = document.getElementById("fortune-readings");
    const status = document.getElementById("fortune-announcement");
    let dailyKey = "";
    let selected;
    let revealed = false;
    let midnightTimer;
    let redrawTimer;
    let drag = null;
    let suppressClick = false;

    function hideCard() {
      revealed = false;
      card.classList.remove("is-revealed");
      card.setAttribute("aria-expanded", "false");
      card.setAttribute("aria-label", "Reveal today's fortune. Pull sideways, click, or press Enter.");
      card.querySelector(".card-back").removeAttribute("aria-hidden");
      card.querySelector(".card-front").setAttribute("aria-hidden", "true");
      readings.hidden = true;
      redraw.firstChild.textContent = "Reveal today's card ";
      document.getElementById("pull-hint").textContent = "← Pull sideways, or tap to tempt fate →";
    }

    function syncDay() {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      const key = `${year}-${month + 1}-${day}`;
      if (key === dailyKey) return;
      dailyKey = key;
      const ordinal = Math.floor(Date.UTC(year, month, day) / 86400000);
      const index = ((ordinal % fortunes.length) + fortunes.length) % fortunes.length;
      selected = fortunes[index];
      document.getElementById("fortune-date").textContent = `${today.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · YOUR LOCAL DAY`;
      document.getElementById("fortune-number").textContent = `ARCANA ${String(index + 1).padStart(2, "0")} / ${fortunes.length}`;
      document.getElementById("fortune-title").textContent = selected.title;
      document.getElementById("fortune-text").textContent = selected.text;
      document.getElementById("gpu-luck").textContent = selected.gpu;
      document.getElementById("deadline-aura").textContent = selected.aura;
      document.getElementById("reviewer-mood").textContent = selected.reviewer;
      hideCard();
      clearTimeout(midnightTimer);
      const tomorrow = new Date(year, month, day + 1);
      midnightTimer = window.setTimeout(() => {
        syncDay();
        status.textContent = "A new local day: your next fortune is ready to reveal.";
      }, tomorrow.getTime() - today.getTime() + 100);
    }

    function revealCard() {
      syncDay();
      revealed = true;
      card.classList.add("is-revealed");
      card.setAttribute("aria-expanded", "true");
      card.setAttribute("aria-label", `Today's fortune: ${selected.title}. ${selected.text} Turn card face down.`);
      card.querySelector(".card-back").setAttribute("aria-hidden", "true");
      card.querySelector(".card-front").removeAttribute("aria-hidden");
      readings.hidden = false;
      redraw.firstChild.textContent = "Draw again ";
      document.getElementById("pull-hint").textContent = "Same day, same destiny. Tap the card to turn it over.";
      status.textContent = `${selected.title}. ${selected.text} GPU luck: ${selected.gpu}. Deadline aura: ${selected.aura}. Reviewer mood: ${selected.reviewer}.`;
    }

    card.addEventListener("click", (event) => {
      if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
      clearTimeout(redrawTimer);
      syncDay();
      if (revealed) hideCard(); else revealCard();
    });
    redraw.addEventListener("click", () => {
      clearTimeout(redrawTimer);
      if (!revealed || motion.matches || !effectsOn) revealCard();
      else {
        hideCard();
        redrawTimer = window.setTimeout(revealCard, 300);
      }
    });

    // Horizontal dragging leaves ordinary vertical touch scrolling available.
    card.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      suppressClick = false;
      drag = { id: event.pointerId, x: event.clientX, distance: 0 };
      card.setPointerCapture(event.pointerId);
    });
    card.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      drag.distance = event.clientX - drag.x;
      if (Math.abs(drag.distance) < 7) return;
      card.classList.add("is-dragging");
      if (!motion.matches && effectsOn) {
        const distance = Math.max(-85, Math.min(85, drag.distance));
        card.style.transform = `translateX(${distance}px) rotate(${distance / 9}deg)`;
      }
    });
    function resetDrag() {
      card.classList.remove("is-dragging");
      card.style.transform = "";
      drag = null;
    }
    card.addEventListener("pointerup", (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      suppressClick = Math.abs(drag.distance) >= 7;
      if (Math.abs(drag.distance) >= 45) revealCard();
      resetDrag();
    });
    card.addEventListener("pointercancel", () => { suppressClick = false; resetDrag(); });
    card.addEventListener("lostpointercapture", resetDrag);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) syncDay(); });
    window.addEventListener("pageshow", syncDay);
    syncDay();
    card.disabled = false;
    redraw.disabled = false;
  }

  function initReviewer() {
    const comments = [
      "The results are promising, but have you considered running the experiments on my laptop from 2011?",
      "The paper lacks an ablation study of the authors’ caffeine intake.",
      "I could not reproduce the results. I also could not locate the clearly labeled Run button.",
      "The numerical error is small, but my concern about it is asymptotically large.",
      "Please compare against the baseline I invented in the previous sentence.",
      "The claimed 30-second runtime excludes the six months spent debugging. Please clarify.",
      "This work is both too theoretical and insufficiently theoretical. Confidence: high.",
      "The GPU fortune is interesting, but the stars need a stronger evaluation protocol.",
      "Accept, conditional on adding a diagram that explains why the diagram is necessary.",
      "The bugs appear realistic. Unfortunately, this is also my main criticism of the code.",
      "The authors claim the game is fun. Please report a p-value for vibes.",
      "I appreciate the reproducibility. I refreshed the fortune seven times and remain annoyed.",
    ];
    const button = document.getElementById("reviewer-button");
    const comment = document.getElementById("reviewer-comment");
    let previous = -1;
    button.disabled = false;
    button.addEventListener("click", () => {
      const index = previous < 0 ? Math.floor(Math.random() * comments.length) : (previous + 1 + Math.floor(Math.random() * (comments.length - 1))) % comments.length;
      previous = index;
      comment.textContent = `“${comments[index]}”`;
      comment.hidden = false;
      button.setAttribute("aria-expanded", "true");
    });
  }

  // One broken experiment must not shut down the whole lab.
  [initGame, initFortune, initReviewer].forEach((init) => {
    try { init(); } catch (error) { console.error("[after-hours lab]", error); }
  });
})();
