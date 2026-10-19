(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const canvas = $("streetCanvas");
  const ctx = canvas.getContext("2d");
  const ui = {
    start: $("startScreen"), result: $("resultScreen"), pause: $("pauseScreen"),
    hud: $("hud"), controls: $("gameControls"), score: $("scoreValue"),
    streak: $("streakValue"), caught: $("caughtValue"), toast: $("gameToast"),
    resultScore: $("resultScore"), best: $("bestValue"), resultText: $("resultText"),
    hide: $("hideButton"), vibe: $("vibeButton"), music: $("musicButton"),
    musicLabel: $("musicLabel"),
  };
  const sequence = ["young", "elder", "kid", "young", "elder", "young", "elder", "kid", "young", "elder", "young", "kid"];
  const palette = [
    { skin: "#ae7057", shirt: "#61dfc8", hair: "#2d3052" },
    { skin: "#da9c76", shirt: "#ffd27d", hair: "#51445a" },
    { skin: "#80534a", shirt: "#a8a1ed", hair: "#1c2947" },
    { skin: "#c78b69", shirt: "#ff8a89", hair: "#4a3652" },
  ];
  const HIGH_KEY = "respect-the-elder-bro-best";
  let width = 0, height = 0, dpr = 1;
  let state = "start", mood = "vibe", elapsed = 0, ambient = 0;
  let score = 0, streak = 0, caught = 0, best = 0;
  let spawnClock = 0.65, spawnCount = 0, passers = [], effects = [];
  let toastTime = 0, shake = 0, flash = 0, lastFrame = performance.now();
  let musicOn = true, audio = null, musicTimer = null, beat = 0;
  const melody = [392, 0, 494, 587, 0, 494, 440, 0, 392, 0, 330, 392, 0, 440, 494, 0];

  try { best = Number(localStorage.getItem(HIGH_KEY)) || 0; } catch (_) { /* Storage may be unavailable. */ }
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const unit = () => clamp(width / 760, 0.64, 1.1);
  const heroX = () => width * 0.31;
  const wallY = () => height * 0.67;

  function resize() {
    const box = stage.getBoundingClientRect();
    width = box.width;
    height = box.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function round(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
  function oval(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function line(x1, y1, x2, y2, color, size) { ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function polygon(points, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]); ctx.closePath(); ctx.fill(); }
  function label(value, x, y, size, color, align) { ctx.fillStyle = color; ctx.font = "900 " + size + "px Outfit, sans-serif"; ctx.textAlign = align || "center"; ctx.fillText(value, x, y); }
  function toast(value) { ui.toast.textContent = value; ui.toast.classList.add("show"); toastTime = 1.2; }

  function audioContext() {
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      return audio;
    } catch (_) { return null; }
  }
  function tone(frequency, duration, volume, kind) {
    if (!musicOn) return;
    const source = audioContext();
    if (!source) return;
    const oscillator = source.createOscillator(), gain = source.createGain();
    oscillator.type = kind || "triangle";
    oscillator.frequency.setValueAtTime(frequency, source.currentTime);
    gain.gain.setValueAtTime(0.0001, source.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, source.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, source.currentTime + duration);
    oscillator.connect(gain); gain.connect(source.destination);
    oscillator.start(); oscillator.stop(source.currentTime + duration);
  }
  function syncMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (!musicOn || state !== "running") return;
    musicTimer = setInterval(() => {
      if (beat % 4 === 0) tone(110, 0.18, 0.024, "sine");
      if (beat % 4 === 2) tone(185, 0.07, 0.012, "sawtooth");
      const note = melody[beat % melody.length];
      if (note) tone(note, 0.16, 0.014, "triangle");
      if (beat % 8 === 0) tone(196, 0.36, 0.012, "sine");
      beat++;
    }, 225);
  }
  function syncHud() {
    ui.score.textContent = String(score);
    ui.streak.textContent = streak + " ×" + Math.min(5, 1 + Math.floor(streak / 4));
    ui.caught.textContent = caught + " / 3";
  }
  function setMood(next) {
    if (mood === next) return;
    mood = next;
    ui.hide.classList.toggle("active", mood === "hide");
    ui.vibe.classList.toggle("active", mood === "vibe");
    ui.hide.setAttribute("aria-pressed", String(mood === "hide"));
    ui.vibe.setAttribute("aria-pressed", String(mood === "vibe"));
    if (state === "running") {
      if (mood === "hide") effects.push({ kind: "puff", x: heroX() + 44 * unit(), y: wallY() - 89 * unit(), age: 0 });
      tone(mood === "hide" ? 349 : 587, 0.11, 0.025);
    }
  }
  function startGame() {
    state = "running";
    elapsed = 0; score = 0; streak = 0; caught = 0;
    spawnClock = 0.65; spawnCount = 0; passers = []; effects = [];
    shake = 0; flash = 0; beat = 0;
    setMood("vibe");
    ui.start.classList.add("hidden"); ui.result.classList.add("hidden"); ui.pause.classList.add("hidden");
    ui.hud.hidden = false; ui.controls.hidden = false;
    syncHud(); toast("READ THE STREET · MAKE THE CALL");
    tone(587, 0.17, 0.038); syncMusic();
    lastFrame = performance.now();
    stage.focus();
  }
  function endGame() {
    state = "grounded";
    syncMusic();
    ui.hud.hidden = true; ui.controls.hidden = true;
    if (score > best) {
      best = score;
      try { localStorage.setItem(HIGH_KEY, String(best)); } catch (_) { /* Storage may be unavailable. */ }
      ui.resultText.textContent = "Bro got called out three times, but that is a new neighborhood record.";
    } else {
      ui.resultText.textContent = "Three elders caught the vibe. Time to practice the innocent face.";
    }
    ui.resultScore.textContent = String(score);
    ui.best.textContent = String(best);
    ui.result.classList.remove("hidden");
    $("retryButton").focus();
    tone(220, 0.4, 0.045, "sawtooth");
  }
  function pauseGame() {
    if (state !== "running") return;
    state = "paused";
    ui.pause.classList.remove("hidden");
    syncMusic(); $("resumeButton").focus();
  }
  function resumeGame() {
    if (state !== "paused") return;
    state = "running";
    ui.pause.classList.add("hidden");
    syncMusic(); lastFrame = performance.now(); stage.focus();
  }
  function spawnPasser() {
    const kind = sequence[spawnCount % sequence.length];
    passers.push({ kind, x: width + 65 * unit(), speed: Math.max(165, width * 0.29) * (1 + Math.min(elapsed / 85, 0.48)), age: 0, judged: false, reaction: "", reactionTime: 0, style: palette[spawnCount % palette.length] });
    spawnCount++;
  }
  function judge(person) {
    person.judged = true;
    const correct = person.kind === "elder" ? mood === "hide" : mood === "vibe";
    if (correct) {
      streak++;
      const multiplier = Math.min(5, 1 + Math.floor(streak / 4));
      const points = (person.kind === "young" ? 1 : 2) * multiplier;
      score += points;
      person.reaction = person.kind === "elder" ? "RESPECT!" : person.kind === "kid" ? "HI, BRO!" : "NICE!";
      effects.push({ kind: "score", x: heroX(), y: wallY() - 130 * unit(), age: 0, text: "+" + points, color: person.kind === "elder" ? "#ffe6a2" : "#7aebd6" });
      toast((person.kind === "elder" ? "ELDER RESPECT" : person.kind === "kid" ? "LITTLE BRO APPROVES" : "GOOD VIBES") + " · +" + points);
      tone(person.kind === "elder" ? 659 : 784, 0.14, 0.037);
      setTimeout(() => tone(988, 0.13, 0.023), 85);
    } else if (person.kind === "elder") {
      caught++;
      streak = 0;
      person.reaction = "HEY!";
      shake = 0.45; flash = 0.55;
      effects.push({ kind: "caught", x: heroX(), y: wallY() - 135 * unit(), age: 0, text: "CAUGHT!", color: "#ffe3b6" });
      toast("CAUGHT BY AN ELDER · " + caught + "/3");
      tone(165, 0.3, 0.05, "sawtooth");
      if (caught >= 3) endGame();
    } else {
      streak = 0;
      person.reaction = "...";
      toast("BRO MISSED THE VIBE");
      tone(294, 0.12, 0.02);
    }
    person.reactionTime = 1.1;
    syncHud();
  }
  function update(dt) {
    elapsed += dt;
    spawnClock -= dt;
    if (spawnClock <= 0) {
      spawnPasser();
      spawnClock += clamp(2.65 - elapsed * 0.013, 1.35, 2.65);
    }
    for (const person of passers) {
      person.x -= person.speed * dt;
      person.age += dt;
      person.reactionTime = Math.max(0, person.reactionTime - dt);
      if (!person.judged && person.x <= heroX() + 5 * unit()) {
        judge(person);
        if (state !== "running") break;
      }
    }
    passers = passers.filter((person) => person.x > -85 * unit());
    for (const effect of effects) effect.age += dt;
    effects = effects.filter((effect) => effect.age < (effect.kind === "puff" ? 0.7 : 0.9));
    shake = Math.max(0, shake - dt);
    flash = Math.max(0, flash - dt);
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#27365f"); sky.addColorStop(0.49, "#997390"); sky.addColorStop(0.73, "#efab8f"); sky.addColorStop(1, "#524764");
    rect(0, 0, width, height, sky);
    const glow = ctx.createRadialGradient(width * .78, height * .28, 3, width * .78, height * .28, width * .32);
    glow.addColorStop(0, "#ffedb588"); glow.addColorStop(1, "#ffedb500");
    rect(0, 0, width, height, glow);
    oval(width * .79, height * .22, Math.min(width,height) * .085, Math.min(width,height) * .085, "#ffe5a4");
    for (let i = 0; i < 16; i++) {
      const x = width * ((i * .173 + .07) % 1), y = height * (.07 + (i * .097) % .34);
      oval(x, y, i % 4 === 0 ? 2.2 : 1.2, i % 4 === 0 ? 2.2 : 1.2, "#fff5dcbb");
    }
    const buildings = [
      [.00,.40,.14,.28,"#41446b"],[.10,.29,.13,.39,"#555176"],[.23,.36,.15,.33,"#45486e"],
      [.39,.26,.17,.42,"#5d5379"],[.56,.34,.15,.35,"#414669"],[.70,.23,.17,.47,"#4c4c73"],[.86,.36,.17,.34,"#393f68"],
    ];
    for (let i = 0; i < buildings.length; i++) {
      const [x,y,w,h,color] = buildings[i];
      rect(x*width,y*height,w*width,h*height,color);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
        if ((row + col + i) % 4 === 0) continue;
        rect(x*width+13+col*18, y*height+18+row*28, 7, 12, (row+col)%3===0 ? "#ffdba477" : "#c7c9e16b");
      }
    }
    round(width*.67,height*.38,width*.19,31*unit(),5*unit(),"#222a4b");
    label("BRO BLOCK",width*.765,height*.38+21*unit(),14*unit(),"#6ce0ce");
    line(width*.91,height*.06,width*.91,height*.58,"#252c4c",4*unit());
    oval(width*.91,height*.35,28*unit(),17*unit(),"#ffe3a9aa");
    oval(width*.91,height*.34,16*unit(),8*unit(),"#fff2c6");
    line(0,height*.58,width,height*.58,"#252e4a55",2);
    rect(0,height*.69,width,height*.1,"#b59792");
    rect(0,height*.79,width,height*.21,"#2b3456");
    line(0,height*.79,width,height*.79,"#f4d1b1",5);
    const roadMotion = state === "running" ? elapsed : ambient*.42;
    for (let i = -1; i < 6; i++) {
      const x = ((i * 180 - roadMotion * 32) % (width + 180) + width + 180) % (width + 180) - 90;
      round(x,height*.9,85*unit(),5*unit(),2*unit(),"#f3d6b57e");
    }
    for (let i = 0; i < 4; i++) {
      const x = width*(.55+i*.13);
      line(x,height*.69,x+10,height*.79,"#f5e1c74b",2);
    }
  }
  function drawWall() {
    const y = wallY();
    rect(0,y,width*.50,height*.18,"#77637b");
    rect(0,y+height*.18,width*.50,height*.08,"#534c6a");
    for (let row=0; row<5; row++) {
      const brickH=height*.034;
      for (let x=(row%2 ? -28 : 0); x<width*.50; x+=58*unit()) {
        round(x,y+row*brickH+5,52*unit(),brickH-5,3,"#a98b8e");
        line(x+4,y+row*brickH+7,x+43*unit(),y+row*brickH+7,"#c4a2a0a0",1);
      }
    }
    round(-8,y-9*unit(),width*.52,16*unit(),4*unit(),"#e6c2af");
    line(0,y+4*unit(),width*.5,y+4*unit(),"#714f68",2*unit());
    ctx.save(); ctx.translate(width*.10,y+height*.09); ctx.rotate(-.12);
    label("THE BLOCK",0,0,18*unit(),"#5de1ce8c","left");
    ctx.restore();
  }
  function drawSmoke(x,y,s) {
    ctx.save(); ctx.globalAlpha=.52;
    for (let i=0;i<3;i++) {
      const shift=Math.sin(ambient*2+i*1.8)*8*s;
      ctx.strokeStyle="#fff2df"; ctx.lineWidth=(2.4-i*.4)*s; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(x,y-i*4*s);
      ctx.bezierCurveTo(x+12*s+shift,y-15*s-i*13*s,x-9*s+shift,y-29*s-i*15*s,x+5*s+shift,y-42*s-i*18*s);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawHero() {
    const s=unit(), x=heroX(), y=wallY()-4*s;
    const kidNear=passers.some((person)=>person.kind==="kid" && Math.abs(person.x-x)<105*s);
    const smoking=mood==="vibe" && !kidNear && state!=="grounded";
    ctx.save(); ctx.translate(x,y);
    oval(5*s,11*s,55*s,10*s,"#29314950");
    line(-11*s,-4*s,-25*s,52*s,"#22304f",13*s);
    line(14*s,-4*s,31*s,49*s,"#22304f",13*s);
    round(-32*s,42*s,20*s,11*s,5*s,"#f4e7d8"); round(22*s,41*s,22*s,11*s,5*s,"#f4e7d8");
    round(-31*s,-73*s,62*s,75*s,20*s,mood==="hide" ? "#384c76" : "#5365a0");
    round(-29*s,-27*s,58*s,24*s,9*s,"#323f72");
    line(-28*s,-54*s,-52*s,-22*s,"#ad735b",11*s);
    oval(-51*s,-20*s,7*s,7*s,"#ad735b");
    if (mood==="hide") {
      line(25*s,-54*s,38*s,-20*s,"#ad735b",11*s);
      oval(39*s,-17*s,7*s,7*s,"#ad735b");
    } else if (kidNear) {
      line(26*s,-54*s,51*s,-98*s+Math.sin(ambient*9)*5*s,"#ad735b",11*s);
      oval(52*s,-99*s+Math.sin(ambient*9)*5*s,8*s,8*s,"#ad735b");
    } else {
      line(26*s,-54*s,46*s,-86*s,"#ad735b",10*s);
      oval(46*s,-87*s,7*s,7*s,"#ad735b");
    }
    oval(0,-96*s,26*s,28*s,"#ad735b");
    ctx.fillStyle="#262c4b";ctx.beginPath();ctx.arc(0,-103*s,27*s,Math.PI,Math.PI*2);ctx.lineTo(27*s,-100*s);ctx.lineTo(16*s,-116*s);ctx.lineTo(-17*s,-116*s);ctx.fill();
    polygon([[-22*s,-119*s],[7*s,-127*s],[33*s,-118*s],[6*s,-112*s]],"#f4c876");
    round(-19*s,-98*s,39*s,13*s,6*s,"#1d2944");
    oval(-10*s,-92*s,5*s,4*s,"#86dcd4"); oval(10*s,-92*s,5*s,4*s,"#86dcd4");
    line(-6*s,-75*s,8*s,-75*s,"#673f48",2*s);
    if (smoking) {
      line(46*s,-87*s,60*s,-89*s,"#fff6df",4*s);
      oval(61*s,-89*s,3*s,3*s,"#ff916d");
      drawSmoke(62*s,-91*s,s);
    }
    if (state==="grounded") { oval(29*s,-111*s,4*s,10*s,"#96dce5"); }
    ctx.restore();
    if (mood==="vibe" && !kidNear && state==="running") {
      const t=ambient*2.3;
      label("♫",x-57*s+Math.sin(t)*5*s,y-97*s-(t%1)*16*s,18*s,"#a8f4dc");
      label("✦",x+78*s,y-122*s+Math.sin(t*1.7)*6*s,16*s,"#ffe3a2");
    }
  }
  function drawPerson(person) {
    const s=unit()*(person.kind==="kid"?.70:person.kind==="elder"?.90:1);
    const y=height*.79, walk=Math.sin(person.age*11)*5*s;
    ctx.save(); ctx.translate(person.x,y);
    oval(0,4*s,35*s,7*s,"#1a244047");
    const elder=person.kind==="elder", kid=person.kind==="kid";
    const clothes=elder?"#ffe0ac":kid?"#ff9b8b":person.style.shirt;
    line(-10*s,-27*s,-17*s+walk,1*s,"#263149",8*s);
    line(10*s,-27*s,17*s-walk,1*s,"#263149",8*s);
    round(-23*s,-76*s,46*s,52*s,13*s,clothes);
    if (kid) round(14*s,-73*s,14*s,32*s,5*s,"#5d72aa");
    line(-20*s,-65*s,-36*s,-36*s+walk,"#b88166",8*s);
    line(20*s,-65*s,36*s,-38*s-walk,"#b88166",8*s);
    if (elder) {
      line(37*s,-39*s,39*s,-2*s,"#6a5365",4*s);
      oval(39*s,-39*s,5*s,4*s,"#6a5365");
    }
    oval(0,-96*s,22*s,23*s,person.style.skin);
    ctx.fillStyle=elder?"#f2edf0":person.style.hair;
    ctx.beginPath();ctx.arc(0,-101*s,22*s,Math.PI,Math.PI*2);ctx.lineTo(21*s,-97*s);ctx.lineTo(12*s,-110*s);ctx.lineTo(-17*s,-110*s);ctx.fill();
    if (elder) { oval(-8*s,-91*s,4*s,3*s,"#243152"); oval(8*s,-91*s,4*s,3*s,"#243152"); line(-2*s,-90*s,2*s,-90*s,"#243152",2*s); }
    else { oval(-7*s,-91*s,2*s,2*s,"#27324a"); oval(7*s,-91*s,2*s,2*s,"#27324a"); }
    if (!elder && !kid) polygon([[-24*s,-112*s],[10*s,-119*s],[26*s,-110*s],[11*s,-105*s]],"#ffe09b");
    if (person.reactionTime>0) {
      ctx.globalAlpha=clamp(person.reactionTime/.35,0,1);
      round(-44*s,-174*s,88*s,28*s,13*s,person.reaction==="HEY!"?"#ffe2c2":"#e3fff2");
      label(person.reaction,0,-154*s,11*s,"#29334c");
    } else if (!person.judged) {
      const caption=elder?"ELDER · HIDE":kid?"KID BRO · VIBE":"BRO · VIBE";
      const bubbleW=elder?112:kid?120:97;
      round(-bubbleW*s/2,-171*s,bubbleW*s,28*s,13*s,elder?"#ffdfc7":"#d9fff0");
      label(caption,0,-152*s,10*s,"#26334c");
      polygon([[-7*s,-143*s],[7*s,-143*s],[0,-135*s]],elder?"#ffdfc7":"#d9fff0");
    }
    ctx.restore();
  }
  function drawEffects() {
    for (const effect of effects) {
      const progress=effect.age/(effect.kind==="puff"?.7:.9);
      ctx.save();ctx.globalAlpha=1-progress;
      if (effect.kind==="puff") {
        for (let i=0;i<7;i++) {
          const angle=i*Math.PI*2/7;
          oval(effect.x+Math.cos(angle)*(7+progress*23),effect.y+Math.sin(angle)*(7+progress*18)-progress*17,4+progress*5,4+progress*5,"#fff4df");
        }
      } else {
        label(effect.text,effect.x,effect.y-progress*45,24*unit(),effect.color);
        for (let i=0;i<7;i++) {
          const angle=i*Math.PI*2/7;
          oval(effect.x+Math.cos(angle)*(28+progress*48),effect.y+Math.sin(angle)*(20+progress*35),3+progress*4,3+progress*4,effect.color);
        }
      }
      ctx.restore();
    }
  }
  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0,0,width,height);
    ctx.save();
    if (shake>0) ctx.translate(Math.sin(ambient*70)*shake*12,Math.cos(ambient*62)*shake*7);
    drawBackground(); drawWall();
    for (const person of passers) drawPerson(person);
    drawHero(); drawEffects();
    if (flash>0) rect(0,0,width,height,"#fa6d5733");
    ctx.restore();
  }
  function frame(now) {
    const dt=Math.min(.04,(now-lastFrame)/1000||0);
    lastFrame=now; ambient+=dt;
    if (state==="running") update(dt);
    if (toastTime>0) { toastTime-=dt; if (toastTime<=0) ui.toast.classList.remove("show"); }
    draw(); requestAnimationFrame(frame);
  }

  $("startButton").addEventListener("click",startGame);
  $("retryButton").addEventListener("click",startGame);
  $("pauseButton").addEventListener("click",pauseGame);
  $("resumeButton").addEventListener("click",resumeGame);
  ui.hide.addEventListener("click",()=>setMood("hide"));
  ui.vibe.addEventListener("click",()=>setMood("vibe"));
  document.addEventListener("keydown",(event)=>{
    if (["Space","ArrowLeft","ArrowRight"].includes(event.code)) event.preventDefault();
    if (event.target.closest("button") && ["Space","Enter"].includes(event.code)) return;
    if (event.code==="KeyH"||event.code==="ArrowLeft"||event.code==="Space") setMood("hide");
    if (event.code==="KeyV"||event.code==="ArrowRight") setMood("vibe");
    if (event.code==="KeyP"||event.code==="Escape") {
      if (state==="running") pauseGame(); else if (state==="paused") resumeGame();
    }
    if (event.code==="Enter" && state==="start") startGame();
  });
  ui.music.addEventListener("click",()=>{
    musicOn=!musicOn;
    ui.music.setAttribute("aria-pressed",String(musicOn));
    ui.music.setAttribute("aria-label",musicOn?"Turn music off":"Turn music on");
    ui.musicLabel.textContent=musicOn?"MUSIC ON":"MUSIC OFF";
    syncMusic();
  });
  document.addEventListener("visibilitychange",()=>{ if (document.hidden) pauseGame(); });
  window.addEventListener("resize",resize);
  resize();requestAnimationFrame(frame);
})();
