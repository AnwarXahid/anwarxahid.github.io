(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const canvas = $("skyCanvas");
  const ctx = canvas.getContext("2d");
  const ui = {
    start: $("startScreen"), result: $("resultScreen"), pause: $("pauseScreen"),
    hud: $("hud"), controls: $("mobileControls"), round: $("roundValue"),
    rescued: $("rescueValue"), hearts: $("heartValue"), time: $("timeFill"),
    message: $("gameMessage"), music: $("musicButton"), musicLabel: $("musicLabel"),
    resultSticker: $("resultSticker"), resultTitle: $("resultTitle"),
    resultText: $("resultText"), resultScore: $("resultScore"),
    resultButton: $("resultButton"),
  };
  const rounds = [
    { name: "Cloud Nine", goal: 2, duration: 19, waves: 7, sky: ["#5266a7", "#b18cc2", "#f7c09c"] },
    { name: "Golden Hour", goal: 3, duration: 21, waves: 8, sky: ["#54689f", "#dc8aa9", "#f7c67e"] },
    { name: "Homeward", goal: 4, duration: 23, waves: 9, sky: ["#324e87", "#ad77ae", "#f6ab8b"] },
  ];
  const crew = [
    { skin: "#a96d52", shirt: "#4ed0be", hair: "#273553" },
    { skin: "#e6aa7f", shirt: "#ffd070", hair: "#664552" },
    { skin: "#7b4b40", shirt: "#a996ec", hair: "#1f2949" },
    { skin: "#c88968", shirt: "#ff8e84", hair: "#3a3352" },
  ];
  const positions = [0.5, 0.32, 0.72, 0.32, 0.68, 0.3, 0.72, 0.28, 0.7];
  const clouds = [
    [0.11, 0.16, 0.9], [0.7, 0.24, 0.65], [0.33, 0.49, 1.2],
    [0.82, 0.72, 0.8], [0.16, 0.89, 1.1], [0.62, 1.08, 0.75],
  ];
  const PLAYER_Y = 0.43;
  let width = 0, height = 0, dpr = 1;
  let state = "start", round = 0, elapsed = 0, ambientTime = 0, rescued = 0;
  let hearts = 3, nextWave = 0, nextHazard = 0, heroX = 0.5, targetX = 0.5;
  let objects = [], effects = [], invulnerable = 0, messageTime = 0;
  let resultType = "clear", lastFrame = 0, pointerActive = false;
  const keys = { left: false, right: false };
  let musicOn = true, audio = null, musicTimer = null, musicStep = 0;
  const tune = [523, 659, 784, 0, 659, 587, 523, 0, 440, 523, 659, 0, 587, 523, 392, 0];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const px = (value) => value * width;
  const py = (value) => value * height;

  function resize() {
    const box = stage.getBoundingClientRect();
    width = box.width;
    height = box.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  function oval(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function line(x1, y1, x2, y2, color, size) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function rounded(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function polygon(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  function label(text, x, y, size, color, align) {
    ctx.font = "900 " + size + "px Outfit, sans-serif";
    ctx.textAlign = align || "center";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  function announce(text) {
    ui.message.textContent = text;
    ui.message.classList.add("show");
    messageTime = 1.25;
  }
  function audioContext() {
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      return audio;
    } catch (_) {
      return null;
    }
  }
  function tone(frequency, duration, volume, kind) {
    if (!musicOn) return;
    const source = audioContext();
    if (!source) return;
    const oscillator = source.createOscillator();
    const gain = source.createGain();
    oscillator.type = kind || "triangle";
    oscillator.frequency.setValueAtTime(frequency, source.currentTime);
    gain.gain.setValueAtTime(0.0001, source.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, source.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, source.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(source.destination);
    oscillator.start();
    oscillator.stop(source.currentTime + duration);
  }
  function syncMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (!musicOn || state !== "running") return;
    musicTimer = setInterval(() => {
      const note = tune[musicStep % tune.length];
      if (note) tone(note, 0.21, 0.018);
      if (musicStep % 4 === 0) tone([131, 147, 165, 147][Math.floor(musicStep / 4) % 4], 0.4, 0.016, "sine");
      musicStep++;
    }, 245);
  }
  function beginRound(index) {
    round = index;
    state = "running";
    elapsed = 0;
    rescued = 0;
    hearts = 3;
    nextWave = 0;
    nextHazard = 0;
    heroX = 0.5;
    targetX = 0.5;
    invulnerable = 0;
    objects = [];
    effects = [];
    ui.start.classList.add("hidden");
    ui.result.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.hud.hidden = false;
    ui.controls.hidden = false;
    syncHud();
    announce("ROUND " + (round + 1) + " · " + rounds[round].name.toUpperCase());
    tone(659, 0.17, 0.04);
    syncMusic();
    lastFrame = performance.now();
  }
  function syncHud() {
    const info = rounds[round];
    ui.round.textContent = (round + 1) + " / 3";
    ui.rescued.textContent = rescued + " / " + info.goal;
    ui.hearts.textContent = "♥ ".repeat(hearts).trim() + (hearts < 3 ? " ♡".repeat(3 - hearts) : "");
    ui.hearts.setAttribute("aria-label", hearts + (hearts === 1 ? " heart" : " hearts"));
    ui.time.style.transform = "scaleX(" + clamp(1 - elapsed / info.duration, 0, 1) + ")";
  }
  function endRound(kind) {
    state = "result";
    resultType = kind;
    syncMusic();
    ui.hud.hidden = true;
    ui.controls.hidden = true;
    ui.resultScore.textContent = String(rescued);
    if (kind === "win") {
      ui.resultSticker.textContent = "✦ THREE ROUNDS. ALL HEART. ✦";
      ui.resultTitle.textContent = "The sky is yours!";
      ui.resultText.textContent = "Three drops, one incredible rescue crew. Every bro made it home.";
      ui.resultButton.innerHTML = "PLAY AGAIN <span aria-hidden=\"true\">↗</span>";
      tone(880, 0.5, 0.055);
    } else if (kind === "clear") {
      ui.resultSticker.textContent = "✦ ROUND " + (round + 1) + " CLEAR ✦";
      ui.resultTitle.textContent = "Nice catch!";
      ui.resultText.textContent = "Your bros opened their chutes and floated safely home. Another drop is waiting.";
      ui.resultButton.innerHTML = "NEXT ROUND <span aria-hidden=\"true\">↗</span>";
      tone(784, 0.35, 0.05);
    } else {
      ui.resultSticker.textContent = "✦ THE CREW NEEDS YOU ✦";
      ui.resultTitle.textContent = "One more try!";
      ui.resultText.textContent = "Catch " + rounds[round].goal + " bros before the ground arrives. This round is ready to replay.";
      ui.resultButton.innerHTML = "RETRY ROUND " + (round + 1) + " <span aria-hidden=\"true\">↗</span>";
      tone(262, 0.35, 0.045);
    }
    ui.result.classList.remove("hidden");
    ui.resultButton.focus();
  }
  function pauseGame() {
    if (state !== "running") return;
    state = "paused";
    ui.pause.classList.remove("hidden");
    syncMusic();
    $("resumeButton").focus();
  }
  function resumeGame() {
    if (state !== "paused") return;
    state = "running";
    ui.pause.classList.add("hidden");
    syncMusic();
    lastFrame = performance.now();
    stage.focus();
  }
  function spawnWave(index) {
    const type = index === 3 || (round === 2 && index === 7) ? "chute" : "falling";
    objects.push({
      type, x: positions[index], y: 1.13,
      crew: crew[(index + round) % crew.length], phase: index * 1.6,
    });
  }
  function spawnHazard(index) {
    objects.push({ type: "hazard", x: [0.22, 0.78, 0.18][index], y: 1.14, phase: index });
  }
  function rescue(object) {
    object.done = true;
    rescued++;
    effects.push({ type: "rescue", x: object.x, y: PLAYER_Y, age: 0, crew: object.crew });
    if (object.type === "chute") {
      hearts = Math.min(3, hearts + 1);
      announce("HIGH FIVE! +1 HEART");
    } else {
      announce("CHUTE OPEN! BRO SAVED");
    }
    tone(784, 0.16, 0.06);
    setTimeout(() => tone(1047, 0.16, 0.035), 90);
    syncHud();
    if (rescued >= rounds[round].goal) endRound(round === 2 ? "win" : "clear");
  }
  function hitHazard(object) {
    object.done = true;
    if (invulnerable > 0) return;
    hearts--;
    invulnerable = 1.2;
    effects.push({ type: "hit", x: heroX, y: PLAYER_Y, age: 0 });
    announce("WHOA! WATCH THE DEBRIS");
    tone(165, 0.22, 0.05, "sawtooth");
    syncHud();
    if (hearts <= 0) endRound("fail");
  }
  function update(dt) {
    elapsed += dt;
    const info = rounds[round];
    if (keys.left) targetX -= dt * 0.7;
    if (keys.right) targetX += dt * 0.7;
    targetX = clamp(targetX, 0.11, 0.89);
    heroX += clamp(targetX - heroX, -dt * 1.8, dt * 1.8);
    while (nextWave < info.waves && elapsed >= 1.15 + nextWave * 2.05) spawnWave(nextWave++);
    while (nextHazard < 3 && elapsed >= 5.7 + nextHazard * 5.8) spawnHazard(nextHazard++);
    invulnerable = Math.max(0, invulnerable - dt);
    for (const object of objects) {
      object.y -= dt * (object.type === "chute" ? 0.285 : 0.32);
      if (object.done || Math.abs(object.y - PLAYER_Y) > 0.075) continue;
      if (Math.abs(object.x - heroX) < (object.type === "hazard" ? 0.09 : 0.15)) {
        if (object.type === "hazard") hitHazard(object);
        else rescue(object);
        if (state !== "running") break;
      }
    }
    objects = objects.filter((object) => !object.done && object.y > -0.18);
    for (const effect of effects) effect.age += dt;
    effects = effects.filter((effect) => effect.age < (effect.type === "rescue" ? 1.4 : 0.55));
    syncHud();
    if (state === "running" && elapsed >= info.duration) endRound("fail");
  }
  function drawCloud(x, y, scale, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    oval(x, y + 8 * scale, 54 * scale, 15 * scale, "#fff9ef");
    oval(x - 22 * scale, y, 27 * scale, 21 * scale, "#fff9ef");
    oval(x + 11 * scale, y - 9 * scale, 37 * scale, 30 * scale, "#fff9ef");
    oval(x + 39 * scale, y + 1 * scale, 23 * scale, 18 * scale, "#fff9ef");
    ctx.restore();
  }
  function drawBackdrop() {
    const colors = rounds[round].sky;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, colors[0]);
    sky.addColorStop(0.55, colors[1]);
    sky.addColorStop(1, colors[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(px(0.78), py(0.2), 6, px(0.78), py(0.2), width * 0.42);
    glow.addColorStop(0, "#fff3c7bd");
    glow.addColorStop(1, "#fff3c700");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    oval(px(0.78), py(0.19), Math.min(width, height) * 0.105, Math.min(width, height) * 0.105, "#ffe6a2");
    oval(px(0.78), py(0.19), Math.min(width, height) * 0.074, Math.min(width, height) * 0.074, "#fff0bb");
    const motion = state === "running" ? elapsed : ambientTime * 0.5;
    for (let i = 0; i < 27; i++) {
      const x = px(((i * 0.317) % 1));
      const y = py(((i * 0.193 - motion * 0.19) % 1 + 1) % 1);
      line(x, y, x - 3, y - 15 - (i % 4) * 6, "#ffffff45", 1.5 + i % 2);
    }
    for (let i = 0; i < clouds.length; i++) {
      const cloud = clouds[i];
      const y = ((cloud[1] - motion * (0.036 + i * 0.006)) % 1.36 + 1.36) % 1.36 - 0.14;
      drawCloud(px(cloud[0]), py(y), cloud[2] * Math.min(width / 700, 1.2), 0.32 + i % 3 * 0.12);
    }
    const progress = state === "start" ? 0 : clamp(elapsed / rounds[round].duration, 0, 1);
    if (progress > 0.56) {
      const rise = (progress - 0.56) / 0.44;
      const top = py(1.1 - rise * 0.38);
      polygon([[0, height], [0, top + 55], [px(.18), top + 5], [px(.35), top + 55], [px(.57), top - 5], [px(.8), top + 35], [width, top + 4], [width, height]], "#72639d");
      polygon([[0, height], [0, top + 105], [px(.2), top + 70], [px(.39), top + 112], [px(.66), top + 58], [width, top + 90], [width, height]], "#4a6485");
    }
  }
  function drawPlane() {
    if (state !== "start" && elapsed > 3.2) return;
    const progress = state === "start" ? 0 : elapsed / 3.2;
    const scale = Math.min(width / 700, 1.1) * (1 - progress * 0.55);
    const x = px(0.5), y = py(0.16 - progress * 0.21);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    oval(0, 28, 104, 14, "#1e234d22");
    polygon([[-120, 0], [-32, -13], [18, -17], [120, -3], [50, 10], [-40, 14]], "#edf3f1");
    polygon([[-27, -12], [14, -42], [49, -41], [32, 2]], "#fff9ed");
    polygon([[-14, 8], [20, 38], [50, 37], [30, 2]], "#d8e4e9");
    rounded(-99, -8, 49, 11, 5, "#324568");
    for (let i = 0; i < 5; i++) oval(-34 + i * 19, -3, 4, 4, "#6ca6bd");
    polygon([[76, -5], [91, -27], [103, -25], [104, 0]], "#f19378");
    ctx.restore();
  }
  function drawHuman(x, y, size, character, hero) {
    const s = size / 70;
    ctx.save();
    ctx.translate(x, y);
    if (hero && invulnerable > 0 && Math.floor(ambientTime * 16) % 2) ctx.globalAlpha = 0.42;
    const flutter = Math.sin(ambientTime * 14) * 4 * s;
    if (hero) {
      polygon([[-8*s, -22*s], [-27*s, -68*s-flutter], [-19*s, -52*s], [1*s, -26*s]], "#f56d65");
      polygon([[1*s, -26*s], [16*s, -66*s+flutter], [12*s, -40*s], [7*s, -22*s]], "#ffc377");
    }
    line(-10*s, 16*s, -19*s, 39*s, "#243451", 8*s);
    line(10*s, 16*s, 19*s, 39*s, "#243451", 8*s);
    line(-16*s, -12*s, -37*s, -3*s+flutter, character.skin, 8*s);
    line(16*s, -12*s, 37*s, -3*s-flutter, character.skin, 8*s);
    rounded(-20*s, -23*s, 40*s, 43*s, 12*s, character.shirt);
    rounded(-12*s, -29*s, 24*s, 12*s, 5*s, hero ? "#ffe8a6" : character.shirt);
    oval(0, -42*s, 18*s, 19*s, character.skin);
    ctx.fillStyle = character.hair;
    ctx.beginPath();
    ctx.arc(0, -46*s, 18*s, Math.PI, Math.PI * 2);
    ctx.lineTo(17*s, -42*s);
    ctx.lineTo(9*s, -55*s);
    ctx.lineTo(-14*s, -53*s);
    ctx.fill();
    oval(-6*s, -40*s, 1.8*s, 2*s, "#27304b");
    oval(6*s, -40*s, 1.8*s, 2*s, "#27304b");
    line(-5*s, -31*s, 5*s, -31*s, "#824b54", 1.6*s);
    if (hero) {
      line(-19*s, -19*s, 19*s, -19*s, "#f9e2a7", 5*s);
      rounded(12*s, -8*s, 13*s, 23*s, 4*s, "#f8c670");
      oval(0, 40*s, 22*s, 4*s, "#2a315525");
    }
    ctx.restore();
  }
  function drawParachute(x, y, size, colors, opening) {
    const spread = size * opening;
    const canopyY = y - size * 1.8;
    line(x - spread * .8, canopyY + size*.2, x - size*.16, y - size*.72, "#f7f5e6", 2);
    line(x + spread * .8, canopyY + size*.2, x + size*.16, y - size*.72, "#f7f5e6", 2);
    line(x, canopyY, x, y - size*.72, "#f7f5e6", 1.5);
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.moveTo(x - spread, canopyY + size*.2);
    ctx.quadraticCurveTo(x, canopyY - size*.85 * opening, x + spread, canopyY + size*.2);
    ctx.quadraticCurveTo(x + spread*.53, canopyY + size*.03, x + spread*.3, canopyY + size*.2);
    ctx.quadraticCurveTo(x, canopyY - size*.02, x - spread*.3, canopyY + size*.2);
    ctx.quadraticCurveTo(x - spread*.58, canopyY + size*.04, x - spread, canopyY + size*.2);
    ctx.fill();
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(x - spread*.3, canopyY + size*.2);
    ctx.quadraticCurveTo(x, canopyY - size*.88*opening, x + spread*.3, canopyY + size*.2);
    ctx.quadraticCurveTo(x, canopyY - size*.02, x - spread*.3, canopyY + size*.2);
    ctx.fill();
    line(x-spread, canopyY+size*.2, x+spread, canopyY+size*.2, "#fff1d0", 2);
  }
  function drawObject(object) {
    const x = px(object.x), y = py(object.y);
    const scale = clamp((1.18 - object.y) * 0.9, 0.43, 1.08);
    const size = 52 * scale;
    if (object.type === "hazard") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(ambientTime * 3 + object.phase) * 0.12);
      rounded(-27*scale, -27*scale, 54*scale, 54*scale, 7*scale, "#583e65");
      rounded(-22*scale, -22*scale, 44*scale, 44*scale, 4*scale, "#f78770");
      for (let i = -1; i <= 1; i++) line((-12+i*12)*scale, 15*scale, (i*12+8)*scale, -15*scale, "#ffe5a3", 6*scale);
      ctx.restore();
      if (object.y < .75) label("DODGE!", x, y-36*scale, 11*scale, "#fff7ec");
      return;
    }
    if (object.type === "chute") drawParachute(x, y, size*.85, ["#ff8d82", "#ffe2a3"], 1);
    else {
      oval(x, y-size*.3, size*.69, size*.86, "#fff7e043");
      if (object.y < .8) label("BRO!", x, y-size*1.15, 12*scale, "#fff8e9");
    }
    drawHuman(x, y, size*.65, object.crew, false);
  }
  function drawEffects() {
    for (const effect of effects) {
      const x = px(effect.x), y = py(effect.y);
      if (effect.type === "rescue") {
        const progress = effect.age / 1.4;
        const lift = progress * height * 0.28;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        for (let i = 0; i < 10; i++) {
          const angle = i * Math.PI * 2 / 10;
          oval(x + Math.cos(angle)*(25+progress*55), y-lift + Math.sin(angle)*(20+progress*35), 4+i%3, 4+i%3, i%2 ? "#ffe4a0" : "#f9faf2");
        }
        drawParachute(x, y-lift, 46, ["#ffdc88", "#ff8d82"], clamp(effect.age*4, 0.12, 1));
        drawHuman(x, y-lift, 36, effect.crew, false);
        if (effect.age < 0.8) label("+1 SAVED", x, y-lift-95, 16, "#fffdf1");
        ctx.restore();
      } else {
        const progress = effect.age / .55;
        ctx.save();
        ctx.globalAlpha = 1-progress;
        for (let i = 0; i < 8; i++) {
          const a = i*Math.PI/4;
          line(x+Math.cos(a)*15, y+Math.sin(a)*15, x+Math.cos(a)*(25+progress*35), y+Math.sin(a)*(25+progress*35), "#ffead7", 3);
        }
        ctx.restore();
      }
    }
  }
  function render() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    drawBackdrop();
    drawPlane();
    const visible = objects.slice().sort((a,b) => a.y - b.y);
    for (const object of visible) drawObject(object);
    if (state === "start" || state === "running" || state === "paused") {
      drawHuman(px(heroX), py(PLAYER_Y + Math.sin(ambientTime*5)*.006), Math.min(72, width*.13), { skin: "#b8795c", shirt: "#ffcd77", hair: "#273453" }, true);
    }
    drawEffects();
  }
  function frame(now) {
    const dt = Math.min(.04, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    ambientTime += dt;
    if (state === "running") update(dt);
    if (messageTime > 0) {
      messageTime -= dt;
      if (messageTime <= 0) ui.message.classList.remove("show");
    }
    render();
    requestAnimationFrame(frame);
  }
  function setPointerTarget(event) {
    const box = stage.getBoundingClientRect();
    targetX = clamp((event.clientX - box.left) / box.width, .11, .89);
  }
  stage.addEventListener("pointerdown", (event) => {
    if (state !== "running" || event.target.closest("button")) return;
    pointerActive = true;
    stage.setPointerCapture(event.pointerId);
    setPointerTarget(event);
  });
  stage.addEventListener("pointermove", (event) => {
    if (state === "running" && (pointerActive || event.pointerType === "mouse")) setPointerTarget(event);
  });
  stage.addEventListener("pointerup", () => { pointerActive = false; });
  stage.addEventListener("pointercancel", () => { pointerActive = false; });
  document.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    if (event.target.closest("button") && ["Space", "Enter"].includes(event.code)) return;
    if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = true;
    if (event.code === "KeyP" || event.code === "Escape") {
      if (state === "running") pauseGame();
      else if (state === "paused") resumeGame();
    }
    if (event.code === "Enter" && state === "start") beginRound(0);
  });
  document.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = false;
  });
  $("leftButton").addEventListener("pointerdown", (event) => { event.preventDefault(); targetX = clamp(targetX-.22,.11,.89); });
  $("rightButton").addEventListener("pointerdown", (event) => { event.preventDefault(); targetX = clamp(targetX+.22,.11,.89); });
  $("startButton").addEventListener("click", () => beginRound(0));
  $("resultButton").addEventListener("click", () => beginRound(resultType === "clear" ? round+1 : resultType === "win" ? 0 : round));
  $("pauseButton").addEventListener("click", pauseGame);
  $("resumeButton").addEventListener("click", resumeGame);
  ui.music.addEventListener("click", () => {
    musicOn = !musicOn;
    ui.music.setAttribute("aria-pressed", String(musicOn));
    ui.music.setAttribute("aria-label", musicOn ? "Turn music off" : "Turn music on");
    ui.musicLabel.textContent = musicOn ? "MUSIC ON" : "MUSIC OFF";
    syncMusic();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
  window.addEventListener("resize", resize);
  stage.setAttribute("tabindex", "-1");
  resize();
  requestAnimationFrame(frame);
})();
