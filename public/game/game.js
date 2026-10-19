(() => {
  const canvas = document.getElementById("gameCanvas");
  const stage = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const ui = {
    start: $("startScreen"),
    pause: $("pauseScreen"),
    end: $("endScreen"),
    hud: $("gameHud"),
    controls: $("mobileControls"),
    meter: $("duckMeter"),
    meterFill: $("meterFill"),
    duckStatus: $("duckStatus"),
    distance: $("distanceValue"),
    bros: $("brosValue"),
    finalDistance: $("finalDistance"),
    finalBros: $("finalBros"),
    bestDistance: $("bestDistance"),
    announcement: $("announcement"),
    sound: $("soundButton"),
    soundIcon: $("soundIcon"),
  };
  const characters = [
    { shirt: "#ef714c", skin: "#a66a4a", hair: "#29242f", name: "Jax" },
    { shirt: "#4297a5", skin: "#e7a072", hair: "#533b31", name: "Milo" },
    { shirt: "#e3af47", skin: "#704a3a", hair: "#172237", name: "Beau" },
  ];
  const buddies = [
    { shirt: "#4a9eaa", skin: "#da956b", hair: "#372b30" },
    { shirt: "#f4bd5c", skin: "#6c4438", hair: "#182237" },
    { shirt: "#8f83c8", skin: "#a76d51", hair: "#302b39" },
    { shirt: "#ee8b80", skin: "#e5a37c", hair: "#584238" },
    { shirt: "#6fae77", skin: "#8e5a43", hair: "#1d2632" },
  ];
  const WORLD = 1200;
  const COLLISION = 230;
  const MAX_STACK = 9;
  const DUCK_TIME = 1.15;
  const DUCK_COOLDOWN = 2.4;
  let width = 0,
    height = 0,
    dpr = 1;
  let state = "start",
    lane = 0,
    selected = 0,
    riders = [],
    entities = [];
  let distance = 0,
    picked = 0,
    speed = 370,
    spawnTravel = 0,
    row = 0;
  let duckTime = 0,
    duckCooldown = 0,
    time = 0,
    lastTime = 0;
  let messageTimer = 0,
    soundOn = false,
    audioContext = null;
  let musicBus = null,
    musicTimer = null,
    musicStep = 0,
    nextBeatTime = 0;
  const MUSIC_BEAT = 60 / 116 / 2;
  const melody = [
    659, 0, 784, 880, 0, 784, 659, 0, 587, 0, 659, 784, 0, 659, 587, 0, 523, 0,
    659, 784, 0, 784, 880, 0, 784, 0, 659, 587, 0, 523, 587, 659,
  ];
  const bassNotes = [131, 110, 87, 98];
  let best = Number(localStorage.getItem("carry-my-bro-best") || 0);
  let touchStart = null;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  function rand(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  function roundRect(x, y, w, h, r, color) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
    ctx.fill();
  }
  function oval(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function line(x1, y1, x2, y2, color, weight = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function announce(text) {
    ui.announcement.textContent = text;
    ui.announcement.classList.add("show");
    messageTimer = 1.35;
  }
  function getAudioContext() {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      return audioContext;
    } catch (_) {
      return null;
    }
  }
  function sound(freq, duration, type = "sine", volume = 0.055) {
    if (!soundOn) return;
    try {
      const audio = getAudioContext();
      if (!audio) return;
      const oscillator = audio.createOscillator(),
        gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(60, freq * 0.68),
        audio.currentTime + duration,
      );
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + duration,
      );
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch (_) {
      /* Sound is optional. */
    }
  }
  function musicTone(freq, at, duration, type, volume, fall = 1) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, at);
    if (fall !== 1)
      oscillator.frequency.exponentialRampToValueAtTime(
        freq * fall,
        at + duration,
      );
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(musicBus);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }
  function scheduleMusic() {
    if (!soundOn || state !== "running" || !musicTimer) return;
    const audio = getAudioContext();
    if (!audio) return;
    while (nextBeatTime < audio.currentTime + 0.15) {
      const step = musicStep % melody.length;
      const at = nextBeatTime;
      if (melody[step])
        musicTone(melody[step], at, MUSIC_BEAT * 0.78, "triangle", 0.018);
      if (step % 8 === 0) {
        const bass = bassNotes[Math.floor(step / 8)];
        musicTone(bass, at, MUSIC_BEAT * 5.5, "sine", 0.028);
        musicTone(bass * 2, at, MUSIC_BEAT * 3.7, "triangle", 0.006);
      }
      if (step % 4 === 0) musicTone(105, at, 0.15, "triangle", 0.025, 0.55);
      if (step % 2 === 0) musicTone(1600, at, 0.025, "square", 0.002, 0.75);
      nextBeatTime += MUSIC_BEAT;
      musicStep++;
    }
  }
  function syncMusic() {
    if (!soundOn || state !== "running") {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
      if (musicBus && audioContext)
        musicBus.gain.setTargetAtTime(0, audioContext.currentTime, 0.012);
      return;
    }
    const audio = getAudioContext();
    if (!audio) return;
    if (!musicBus) {
      musicBus = audio.createGain();
      musicBus.connect(audio.destination);
    }
    musicBus.gain.setTargetAtTime(1, audio.currentTime, 0.025);
    if (musicTimer) return;
    musicStep = 0;
    nextBeatTime = audio.currentTime + 0.06;
    musicTimer = setInterval(scheduleMusic, 80);
    scheduleMusic();
  }
  function start() {
    state = "running";
    lane = 0;
    riders = [];
    entities = [];
    distance = 0;
    picked = 0;
    speed = 370;
    spawnTravel = 0;
    row = 0;
    duckTime = 0;
    duckCooldown = 0;
    time = 0;
    entities.push({ type: "bro", lane: 0, z: 540, buddy: buddies[0] });
    entities.push({ type: "bro", lane: -1, z: 850, buddy: buddies[1] });
    ui.start.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.end.classList.add("hidden");
    ui.hud.hidden = false;
    ui.controls.hidden = false;
    ui.meter.hidden = false;
    ui.distance.innerHTML = "0<span>m</span>";
    ui.bros.textContent = "0";
    announce("CATCH YOUR CREW!");
    sound(490, 0.12);
    syncMusic();
    lastTime = performance.now();
  }
  function setPause(paused) {
    if (paused && state === "running") {
      state = "paused";
      ui.pause.classList.remove("hidden");
      syncMusic();
    } else if (!paused && state === "paused") {
      state = "running";
      ui.pause.classList.add("hidden");
      syncMusic();
      lastTime = performance.now();
    }
  }
  function finish() {
    state = "ended";
    syncMusic();
    ui.hud.hidden = true;
    ui.controls.hidden = true;
    ui.meter.hidden = true;
    const meters = Math.floor(distance);
    if (meters > best) {
      best = meters;
      localStorage.setItem("carry-my-bro-best", String(best));
      $("endSticker").textContent = "✦ NEW PERSONAL BEST ✦";
    } else $("endSticker").textContent = "✦ NICE RUN ✦";
    $("endTitle").textContent = meters > 600 ? "What a ride!" : "Run it back!";
    $("endMessage").textContent =
      `You carried ${picked} ${picked === 1 ? "bro" : "bros"} along the way. The crew is ready for another lap.`;
    ui.finalDistance.textContent = `${meters}m`;
    ui.finalBros.textContent = String(picked);
    ui.bestDistance.textContent = `${best}m`;
    ui.end.classList.remove("hidden");
    sound(170, 0.4, "triangle", 0.09);
  }
  function move(direction) {
    if (state !== "running") return;
    const next = clamp(lane + direction, -1, 1);
    if (next !== lane) {
      lane = next;
      sound(290, 0.07, "triangle", 0.025);
    }
  }
  function duck() {
    if (state !== "running" || duckCooldown > 0) return;
    duckTime = DUCK_TIME;
    duckCooldown = DUCK_COOLDOWN;
    announce("DUCK, BRO!");
    sound(420, 0.18, "sawtooth", 0.035);
  }
  function spawn() {
    row++;
    const z = WORLD + 80;
    if (row % 5 === 0) {
      entities.push({ type: "bridge", z, clearance: rand([1, 2, 3]) });
      if (Math.random() < 0.72)
        entities.push({
          type: "bro",
          lane: rand([-1, 0, 1]),
          z: z - 170,
          buddy: rand(buddies),
        });
      return;
    }
    const open = rand([-1, 0, 1]);
    if (row % 3 === 0) {
      entities.push({ type: "barrier", lane: open, z });
      entities.push({
        type: "bro",
        lane: open === -1 ? 1 : -1,
        z: z + 30,
        buddy: rand(buddies),
      });
    } else {
      entities.push({ type: "bro", lane: open, z, buddy: rand(buddies) });
      if (Math.random() < 0.4)
        entities.push({
          type: "bro",
          lane: open === 1 ? -1 : 1,
          z: z + 40,
          buddy: rand(buddies),
        });
      if (Math.random() < 0.32)
        entities.push({
          type: "barrier",
          lane: open === -1 ? 1 : -1,
          z: z - 15,
        });
    }
  }
  function hit(entity) {
    if (entity.type === "bro") {
      if (entity.lane !== lane) return;
      picked++;
      if (riders.length < MAX_STACK) riders.push(entity.buddy);
      else distance += 25;
      ui.bros.textContent = String(riders.length);
      announce(rand(["BRO ACQUIRED!", "THE CREW GROWS!", "HOP ON, BRO!"]));
      sound(630, 0.12, "sine", 0.08);
      setTimeout(() => sound(880, 0.13, "sine", 0.055), 80);
    } else if (entity.type === "barrier") {
      if (entity.lane !== lane) return;
      if (riders.length === 0) {
        finish();
        return;
      }
      riders.splice(Math.max(0, riders.length - 2), 2);
      ui.bros.textContent = String(riders.length);
      announce("OOPS! 2 BROS DOWN");
      sound(125, 0.3, "sawtooth", 0.06);
    } else if (entity.type === "bridge") {
      if (duckTime > 0) {
        announce("SAVED THE STACK!");
        distance += 20;
        sound(760, 0.16, "sine", 0.06);
        return;
      }
      const lost = Math.max(0, riders.length + 1 - entity.clearance);
      if (lost > 0) {
        riders.splice(-lost, lost);
        ui.bros.textContent = String(riders.length);
        announce(`${lost} ${lost === 1 ? "BRO" : "BROS"} GOT CLIPPED!`);
        sound(145, 0.35, "sawtooth", 0.065);
      } else {
        announce("CLEAN PASS!");
        distance += 10;
        sound(520, 0.12, "sine", 0.04);
      }
    }
  }
  function update(dt) {
    time += dt;
    const travel = speed * dt;
    distance += travel / 12;
    speed = Math.min(680, 370 + distance * 0.12);
    spawnTravel += travel;
    while (spawnTravel >= 260) {
      spawnTravel -= 260;
      spawn();
    }
    duckTime = Math.max(0, duckTime - dt);
    duckCooldown = Math.max(0, duckCooldown - dt);
    for (const entity of entities) {
      entity.z -= travel;
      if (!entity.hit && entity.z < COLLISION) {
        entity.hit = true;
        hit(entity);
        if (state !== "running") break;
      }
    }
    entities = entities.filter((e) => e.z > -100);
    ui.distance.innerHTML = `${Math.floor(distance)}<span>m</span>`;
    ui.meterFill.style.transform = `scaleX(${duckTime > 0 ? duckTime / DUCK_TIME : 1 - duckCooldown / DUCK_COOLDOWN})`;
    ui.duckStatus.textContent =
      duckTime > 0 ? "SLIDING" : duckCooldown > 0 ? "WAIT" : "READY";
    if (messageTimer > 0) {
      messageTimer -= dt;
      if (messageTimer <= 0) ui.announcement.classList.remove("show");
    }
  }
  function project(z, laneValue = 0) {
    const t = clamp(1 - z / WORLD, 0, 1.12);
    const depth = Math.pow(t, 1.42);
    const horizon = height * 0.265;
    const roadY = horizon + height * 0.78 * depth;
    const halfRoad = width * (0.115 + 0.49 * depth);
    return {
      x: width / 2 + laneValue * halfRoad * 0.58,
      y: roadY,
      scale: 0.25 + depth * 1.12,
      halfRoad,
      depth,
    };
  }
  function drawCloud(x, y, s, alpha = 1) {
    ctx.globalAlpha = alpha;
    oval(x, y, 34 * s, 11 * s, "#fffdf3");
    oval(x - 18 * s, y - 7 * s, 18 * s, 15 * s, "#fffdf3");
    oval(x + 9 * s, y - 10 * s, 23 * s, 18 * s, "#fffdf3");
    ctx.globalAlpha = 1;
  }
  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#8dd2df");
    sky.addColorStop(0.55, "#d2eedd");
    sky.addColorStop(1, "#f8e5bd");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    oval(width * 0.78, height * 0.15, width * 0.09, width * 0.09, "#ffe49a");
    const drift = (time * 9) % (width + 170);
    drawCloud(
      ((width * 0.1 + drift) % (width + 170)) - 85,
      height * 0.11,
      0.82,
      0.8,
    );
    drawCloud(
      ((width * 0.65 + drift * 0.48) % (width + 170)) - 85,
      height * 0.21,
      0.57,
      0.68,
    );
    const h = height * 0.28;
    ctx.fillStyle = "#a9cfbd";
    ctx.beginPath();
    ctx.moveTo(0, h + 35);
    for (let x = 0; x <= width + 60; x += 60)
      ctx.lineTo(x, h + 20 - Math.sin(x * 0.022) * 22);
    ctx.lineTo(width, h + 90);
    ctx.lineTo(0, h + 90);
    ctx.fill();
    ctx.fillStyle = "#76b8a9";
    ctx.beginPath();
    ctx.moveTo(0, h + 54);
    for (let x = 0; x <= width + 40; x += 45)
      ctx.lineTo(x, h + 42 - Math.sin(x * 0.037 + 1) * 15);
    ctx.lineTo(width, h + 100);
    ctx.lineTo(0, h + 100);
    ctx.fill();
    ctx.fillStyle = "#8ec9a1";
    ctx.fillRect(0, h + 42, width, height - h);
  }
  function drawRoad() {
    const far = project(WORLD),
      near = project(-100);
    ctx.fillStyle = "#f4cc9a";
    ctx.beginPath();
    ctx.moveTo(width / 2 - far.halfRoad - 12, far.y);
    ctx.lineTo(width / 2 + far.halfRoad + 12, far.y);
    ctx.lineTo(width / 2 + near.halfRoad + 25, near.y);
    ctx.lineTo(width / 2 - near.halfRoad - 25, near.y);
    ctx.fill();
    ctx.fillStyle = "#475d68";
    ctx.beginPath();
    ctx.moveTo(width / 2 - far.halfRoad, far.y);
    ctx.lineTo(width / 2 + far.halfRoad, far.y);
    ctx.lineTo(width / 2 + near.halfRoad, near.y);
    ctx.lineTo(width / 2 - near.halfRoad, near.y);
    ctx.fill();
    line(
      width / 2 - far.halfRoad,
      far.y,
      width / 2 - near.halfRoad,
      near.y,
      "#f5d280",
      5,
    );
    line(
      width / 2 + far.halfRoad,
      far.y,
      width / 2 + near.halfRoad,
      near.y,
      "#f5d280",
      5,
    );
    for (let laneEdge of [-1, 1]) {
      for (let i = 0; i < 11; i++) {
        const z = i * 150 + ((distance * 12) % 150);
        const a = project(z),
          b = project(z + 68);
        const ax = width / 2 + (laneEdge * a.halfRoad) / 3,
          bx = width / 2 + (laneEdge * b.halfRoad) / 3;
        line(
          ax,
          a.y,
          bx,
          b.y,
          "rgba(255,255,255,.67)",
          Math.max(2, a.scale * 3),
        );
      }
    }
    for (let i = 0; i < 12; i++) {
      const p = project(i * 145 + ((distance * 12) % 145));
      for (const side of [-1, 1]) {
        const x = width / 2 + side * (p.halfRoad + 19 * p.scale);
        oval(x, p.y, 10 * p.scale, 4 * p.scale, "#6ca97d");
        line(
          x,
          p.y,
          x - 2 * p.scale,
          p.y - 22 * p.scale,
          "#437c66",
          Math.max(2, 4 * p.scale),
        );
        oval(
          x - 8 * p.scale,
          p.y - 24 * p.scale,
          11 * p.scale,
          7 * p.scale,
          "#41966d",
        );
        oval(
          x + 5 * p.scale,
          p.y - 27 * p.scale,
          10 * p.scale,
          8 * p.scale,
          "#53a77a",
        );
      }
    }
  }
  function drawPerson(x, bottom, size, data, bob = 0, carrying = false) {
    const s = size / 50,
      y = bottom + bob;
    oval(x, y + 2 * s, 17 * s, 5 * s, "rgba(21,39,47,.28)");
    const legs = carrying ? 3 * s : Math.sin(time * 17) * 5 * s;
    line(x - 7 * s, y - 17 * s, x - 10 * s - legs, y, "#172438", 5 * s);
    line(x + 7 * s, y - 17 * s, x + 10 * s - legs, y, "#172438", 5 * s);
    roundRect(x - 15 * s, y - 48 * s, 30 * s, 31 * s, 8 * s, data.shirt);
    line(
      x - 14 * s,
      y - 43 * s,
      x - 22 * s,
      y - 29 * s + Math.sin(time * 17) * 3 * s,
      data.skin,
      5 * s,
    );
    line(
      x + 14 * s,
      y - 43 * s,
      x + 22 * s,
      y - 29 * s - Math.sin(time * 17) * 3 * s,
      data.skin,
      5 * s,
    );
    oval(x, y - 59 * s, 13 * s, 14 * s, data.skin);
    ctx.fillStyle = data.hair;
    ctx.beginPath();
    ctx.arc(x, y - 64 * s, 13 * s, Math.PI, Math.PI * 2);
    ctx.lineTo(x + 13 * s, y - 59 * s);
    ctx.lineTo(x + 8 * s, y - 66 * s);
    ctx.lineTo(x - 9 * s, y - 66 * s);
    ctx.lineTo(x - 13 * s, y - 59 * s);
    ctx.fill();
    oval(x - 4 * s, y - 58 * s, 1.2 * s, 1.5 * s, "#24303b");
    oval(x + 4 * s, y - 58 * s, 1.2 * s, 1.5 * s, "#24303b");
    line(x - 3 * s, y - 52 * s, x + 3 * s, y - 52 * s, "#733e3d", 1.4 * s);
  }
  function drawBro(entity) {
    const p = project(entity.z, entity.lane),
      size = clamp(51 * p.scale, 13, 66);
    oval(p.x, p.y + 3, 17 * p.scale, 5 * p.scale, "rgba(20,37,48,.24)");
    oval(
      p.x,
      p.y - size * 1.13,
      Math.max(5, 27 * p.scale),
      Math.max(5, 27 * p.scale),
      "rgba(255,255,255,.35)",
    );
    drawPerson(
      p.x,
      p.y,
      size,
      entity.buddy,
      Math.sin(time * 5 + entity.z * 0.01) * 2 * p.scale,
    );
    if (p.scale > 0.65) {
      ctx.font = `900 ${Math.max(9, 11 * p.scale)}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText("BRO!", p.x, p.y - size * 1.65);
    }
  }
  function drawBarrier(entity) {
    const p = project(entity.z, entity.lane),
      s = p.scale;
    oval(p.x, p.y + 3, 29 * s, 7 * s, "rgba(20,37,48,.28)");
    roundRect(p.x - 23 * s, p.y - 37 * s, 46 * s, 34 * s, 5 * s, "#f58d57");
    roundRect(p.x - 23 * s, p.y - 37 * s, 46 * s, 7 * s, 3 * s, "#ffe7a9");
    for (let i = -1; i <= 1; i++)
      line(
        p.x + i * 15 * s - 4 * s,
        p.y - 10 * s,
        p.x + i * 15 * s + 8 * s,
        p.y - 29 * s,
        "#fff5d1",
        5 * s,
      );
    roundRect(p.x - 29 * s, p.y - 5 * s, 58 * s, 7 * s, 3 * s, "#293848");
  }
  function drawBridge(entity) {
    const p = project(entity.z),
      s = p.scale;
    const roadWidth = p.halfRoad * 2;
    const beamY = p.y - (entity.clearance * 50 + 33) * s;
    const left = width / 2 - roadWidth * 0.54,
      right = width / 2 + roadWidth * 0.54;
    roundRect(left - 11 * s, beamY, 16 * s, p.y - beamY, 3 * s, "#e9ac65");
    roundRect(right - 5 * s, beamY, 16 * s, p.y - beamY, 3 * s, "#e9ac65");
    roundRect(
      left - 13 * s,
      beamY - 16 * s,
      right - left + 26 * s,
      24 * s,
      4 * s,
      "#f5c280",
    );
    roundRect(
      left - 13 * s,
      beamY - 16 * s,
      right - left + 26 * s,
      5 * s,
      2 * s,
      "#ffe7aa",
    );
    const signWidth = clamp(59 * s, 20, 100);
    roundRect(
      width / 2 - signWidth / 2,
      beamY - 13 * s,
      signWidth,
      17 * s,
      3 * s,
      "#233b4c",
    );
    if (s > 0.55) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff3d7";
      ctx.font = `900 ${Math.max(8, 11 * s)}px Outfit,sans-serif`;
      ctx.fillText("DUCK!", width / 2, beamY, signWidth);
    }
  }
  function drawPlayer() {
    const p = project(COLLISION, lane);
    const x = p.x,
      ground = height * 0.835;
    const squash = duckTime > 0 ? 0.55 : 1;
    const total = riders.length;
    const unit = clamp((height * 0.34) / Math.max(3, total + 1), 31, 48);
    oval(x, ground + 8, 33, 10, "rgba(11,28,38,.25)");
    ctx.save();
    ctx.translate(x, ground);
    ctx.scale(1, squash);
    ctx.translate(-x, -ground);
    drawPerson(x, ground, unit, characters[selected], Math.sin(time * 16) * 2);
    for (let i = 0; i < total; i++) {
      const wobble = Math.sin(time * 7 + i * 0.7) * (i + 1) * 1.4;
      drawPerson(
        x + wobble,
        ground - (i + 1) * unit * 0.78,
        unit * 0.85,
        riders[i],
        Math.sin(time * 8 + i) * 2,
        true,
      );
    }
    ctx.restore();
  }
  function render() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawRoad();
    const visible = entities
      .filter((e) => e.z < WORLD + 100 && e.z > -100)
      .sort((a, b) => b.z - a.z);
    for (const entity of visible) {
      if (entity.type === "bridge") drawBridge(entity);
      else if (entity.type === "bro") drawBro(entity);
      else drawBarrier(entity);
    }
    drawPlayer();
    if (state === "start") {
      const p = project(700, -1);
      drawPerson(p.x, p.y, 32, buddies[1], 0);
      const p2 = project(500, 1);
      drawPerson(p2.x, p2.y, 39, buddies[2], 0);
    }
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    if (state === "running") update(dt);
    else if (state === "start") time += dt * 0.4;
    render();
    requestAnimationFrame(frame);
  }
  document.querySelectorAll(".character").forEach((button) =>
    button.addEventListener("click", () => {
      selected = Number(button.dataset.character);
      document.querySelectorAll(".character").forEach((b) => {
        const active = b === button;
        b.classList.toggle("selected", active);
        b.setAttribute("aria-pressed", String(active));
      });
      sound(440 + selected * 90, 0.09);
    }),
  );
  $("startButton").addEventListener("click", start);
  $("againButton").addEventListener("click", start);
  $("pauseButton").addEventListener("click", () => setPause(true));
  $("resumeButton").addEventListener("click", () => setPause(false));
  $("leftButton").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    move(-1);
  });
  $("rightButton").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    move(1);
  });
  $("duckButton").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    duck();
  });
  ui.sound.addEventListener("click", () => {
    soundOn = !soundOn;
    ui.sound.setAttribute("aria-pressed", String(soundOn));
    ui.sound.setAttribute(
      "aria-label",
      soundOn ? "Turn sound off" : "Turn sound on",
    );
    ui.sound.querySelector(".sound-label").textContent = soundOn
      ? "SOUND ON"
      : "SOUND OFF";
    ui.soundIcon.textContent = soundOn ? "♫" : "♪";
    sound(620, 0.1);
    syncMusic();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("button") && ["Space", "Enter"].includes(e.code))
      return;
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
        e.code,
      )
    )
      e.preventDefault();
    if (e.repeat) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") move(-1);
    if (e.code === "ArrowRight" || e.code === "KeyD") move(1);
    if (["Space", "ArrowDown", "ArrowUp", "KeyS", "KeyW"].includes(e.code))
      duck();
    if (e.code === "KeyP" || e.code === "Escape") setPause(state === "running");
    if (e.code === "Enter" && state === "start") start();
    else if (e.code === "Enter" && state === "ended") start();
  });
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    touchStart = { x: e.clientX, y: e.clientY };
  });
  stage.addEventListener("pointerup", (e) => {
    if (!touchStart || e.target.closest("button")) {
      touchStart = null;
      return;
    }
    const dx = e.clientX - touchStart.x,
      dy = e.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1);
    else if (dy > 35 && dy > Math.abs(dx)) duck();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) setPause(true);
  });
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
