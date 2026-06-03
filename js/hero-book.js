/**
 * hero-book.js  v3 — Dramatic spotlight from h1 → book
 *
 * Visual narrative:
 *  scroll = 0  → Pitch-dark book, invisible
 *  scroll ↑    → Spotlight cone materialises from h1 title, crashes onto book
 *                Light splashes outward, background blooms, particles erupt
 *  scroll = 1  → Full theatrical brilliance — book blazes, scene lit
 */
(function () {
  'use strict';

  const canvas  = document.getElementById('hero-book-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const section = document.getElementById('hero');

  let W = 0, H = 0;
  let scrollProgress = 0;

  /* ─── Resize ─── */
  function resize() {
    W = canvas.width  = section.offsetWidth;
    H = canvas.height = section.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ─── Scroll ─── */
  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    scrollProgress = Math.max(0, Math.min(1, -rect.top / (H * 0.80)));
  }, { passive: true });

  /* ─── Utils ─── */
  const easeOut  = t => 1 - Math.pow(1 - t, 2.2);
  const easeOut3 = t => 1 - Math.pow(1 - t, 3);
  const lerp     = (a, b, t) => a + (b - a) * t;
  const clamp    = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ─── Shared geometry (updated each frame) ─── */
  let bookX, bookY, bookW, bookH, spineW, pageW;
  let lightX, lightY;   // source = centre of h1 title

  /* ─── Particles ─── */
  class Particle {
    constructor() { this._init(); }

    _init() {
      // Spawn along the full beam AND around the book surface
      const spawnMode = Math.random();
      if (spawnMode < 0.4) {
        // Along beam
        const t  = 0.4 + Math.random() * 0.6;
        this.x   = lerp(lightX, bookX, t) + (Math.random() - 0.5) * lerp(10, bookW * 0.8, t);
        this.y   = lerp(lightY, bookY - bookH * 0.1, t) + (Math.random() - 0.5) * 20;
        this.vy  = -(0.15 + Math.random() * 0.6);
      } else {
        // Exploding from book
        const angle = -Math.PI - Math.random() * Math.PI;   // upward fan
        const speed = 0.4 + Math.random() * 1.4;
        this.x   = bookX + (Math.random() - 0.5) * bookW * 0.7;
        this.y   = bookY - bookH * (0.1 + Math.random() * 0.4);
        this.vy  = Math.sin(angle) * speed;
      }
      this.vx    = (Math.random() - 0.5) * 0.9;
      this.life  = 1;
      this.decay = 0.003 + Math.random() * 0.008;
      this.r     = 1.8 + Math.random() * 5;
      const roll = Math.random();
      if      (roll < 0.5)  { this.h = 45  + Math.random() * 15; this.s = 100; this.l = 72 + Math.random() * 22; } // gold
      else if (roll < 0.78) { this.h = 130 + Math.random() * 20; this.s = 80;  this.l = 65 + Math.random() * 20; } // green
      else                  { this.h = 55;                        this.s = 20;  this.l = 92 + Math.random() * 8;  } // white
    }

    update() {
      const wob = Math.sin(performance.now() * 0.0015 + this.y * 0.025) * 0.28;
      this.x   += this.vx + wob;
      this.y   += this.vy;
      this.vy  *= 0.997;
      this.life -= this.decay;
    }

    draw() {
      const a = clamp(this.life * easeOut(scrollProgress) * 0.95, 0, 1);
      if (a < 0.01) return;
      const col = `hsla(${this.h},${this.s}%,${this.l}%,${a})`;
      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur  = 18;
      ctx.fillStyle   = col;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * this.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() { return this.life <= 0; }
  }

  const particles = [];
  const MAX_P = 220;

  /* ════════════════════════════════════════════════
     1. BACKGROUND BLOOM
     ════════════════════════════════════════════════ */
  function drawBackground(p) {
    if (p < 0.03) return;
    const ep = easeOut(p);

    // Wide green ambient bloom centred on book
    const R1  = Math.min(W, H) * 0.92;
    const bg1 = ctx.createRadialGradient(bookX, bookY, 0, bookX, bookY, R1);
    bg1.addColorStop(0,    `rgba(60, 190, 100, ${ep * 0.50})`);
    bg1.addColorStop(0.22, `rgba(30, 140,  60, ${ep * 0.32})`);
    bg1.addColorStop(0.55, `rgba(12,  70,  30, ${ep * 0.16})`);
    bg1.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = bg1;
    ctx.beginPath();
    ctx.ellipse(bookX, bookY, R1, R1 * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warm golden bloom where beam meets book
    const R2  = Math.min(W, H) * 0.60;
    const bg2 = ctx.createRadialGradient(bookX, bookY - bookH * 0.15, 0, bookX, bookY, R2);
    bg2.addColorStop(0,    `rgba(255, 230, 80,  ${ep * 0.40})`);
    bg2.addColorStop(0.30, `rgba(255, 200, 50,  ${ep * 0.22})`);
    bg2.addColorStop(0.65, `rgba(220, 160, 30,  ${ep * 0.08})`);
    bg2.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = bg2;
    ctx.beginPath();
    ctx.ellipse(bookX, bookY, R2, R2 * 0.60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Upward streak along the beam path
    const R3  = H * 0.65;
    const bg3 = ctx.createRadialGradient(lightX, lightY, 0, lightX, H * 0.50, R3);
    bg3.addColorStop(0,    `rgba(255, 252, 180, ${ep * 0.28})`);
    bg3.addColorStop(0.35, `rgba(255, 230, 100, ${ep * 0.12})`);
    bg3.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = bg3;
    ctx.fillRect(0, 0, W, H);
  }

  /* ════════════════════════════════════════════════
     2. SPOTLIGHT CONE  (h1 → book)
     ════════════════════════════════════════════════ */
  function drawSpotlight(p) {
    if (p < 0.02) return;
    const ep = easeOut(p);

    const sx = lightX, sy = lightY;
    const tx = bookX,  ty = bookY - bookH * 0.08;

    /* ── Main cone ── */
    const topW = clamp(8 + 18 * ep, 4, 30);
    const botW = (bookW * 0.95) * clamp(ep, 0, 1);

    const coneGrad = ctx.createLinearGradient(sx, sy, tx, ty);
    coneGrad.addColorStop(0,    `rgba(255, 252, 200, ${ep * 0.85})`);
    coneGrad.addColorStop(0.25, `rgba(255, 245, 160, ${ep * 0.60})`);
    coneGrad.addColorStop(0.60, `rgba(255, 230, 100, ${ep * 0.38})`);
    coneGrad.addColorStop(1,    `rgba(255, 210,  60, ${ep * 0.12})`);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';   // additive blending → intense
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(sx - topW, sy);
    ctx.lineTo(sx + topW, sy);
    ctx.lineTo(tx + botW, ty);
    ctx.lineTo(tx - botW, ty);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    /* ── Edge rays (softened borders of cone) ── */
    for (let side = -1; side <= 1; side += 2) {
      const edgeGrad = ctx.createLinearGradient(sx, sy, tx + side * botW, ty);
      edgeGrad.addColorStop(0,   `rgba(255,248,180,${ep * 0.55})`);
      edgeGrad.addColorStop(0.5, `rgba(255,240,120,${ep * 0.25})`);
      edgeGrad.addColorStop(1,   'rgba(255,240,120,0)');
      ctx.save();
      ctx.strokeStyle = edgeGrad;
      ctx.lineWidth   = 3 * ep;
      ctx.beginPath();
      ctx.moveTo(sx + side * topW, sy);
      ctx.lineTo(tx + side * botW, ty);
      ctx.stroke();
      ctx.restore();
    }

    /* ── Animated shimmer bands inside cone ── */
    const now = performance.now() * 0.00028;
    for (let i = 0; i < 8; i++) {
      const t     = ((now + i * 0.14) % 1);
      const midX  = lerp(sx, tx, t);
      const midY  = lerp(sy, ty, t);
      const hw    = lerp(topW, botW, t) * 0.55;
      const alpha = ep * 0.45 * Math.sin(t * Math.PI);

      const shimmer = ctx.createLinearGradient(midX - hw, midY, midX + hw, midY);
      shimmer.addColorStop(0,   'rgba(255,255,220,0)');
      shimmer.addColorStop(0.5, `rgba(255,255,220,${alpha})`);
      shimmer.addColorStop(1,   'rgba(255,255,220,0)');

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = shimmer;
      ctx.fillRect(midX - hw, midY - 3, hw * 2, 6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    /* ── Source glow at h1 (origin point) ── */
    if (p > 0.06) {
      const srcR  = 90 * ep;
      const srcGl = ctx.createRadialGradient(sx, sy, 0, sx, sy, srcR);
      srcGl.addColorStop(0,   `rgba(255, 255, 230, ${ep * 0.85})`);
      srcGl.addColorStop(0.2, `rgba(255, 250, 180, ${ep * 0.55})`);
      srcGl.addColorStop(0.5, `rgba(255, 235, 100, ${ep * 0.20})`);
      srcGl.addColorStop(1,   'rgba(255,235,100,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = srcGl;
      ctx.beginPath();
      ctx.arc(sx, sy, srcR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    /* ── Impact splash where beam hits book top ── */
    if (p > 0.10) {
      const impX  = tx;
      const impY  = ty;
      const impR  = botW * 1.1 * ep;
      const splash = ctx.createRadialGradient(impX, impY, 0, impX, impY, impR);
      splash.addColorStop(0,   `rgba(255, 255, 210, ${ep * 0.95})`);
      splash.addColorStop(0.2, `rgba(255, 248, 160, ${ep * 0.65})`);
      splash.addColorStop(0.55,`rgba(255, 230,  80, ${ep * 0.25})`);
      splash.addColorStop(1,   'rgba(255,230,80,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = splash;
      ctx.beginPath();
      ctx.ellipse(impX, impY, impR, impR * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  }

  /* ════════════════════════════════════════════════
     3. OPEN BOOK
     ════════════════════════════════════════════════ */
  function drawBook(p) {
    const ep = easeOut3(p);

    const scale = Math.min(W, H) / 820;
    bookW   = 340 * scale;
    bookH   = 220 * scale;
    spineW  = 24  * scale;
    pageW   = (bookW - spineW) / 2;
    bookX   = W / 2;
    bookY   = H * 0.625;

    const lx = bookX + spineW / 2;          // left edge of right page
    const rx = bookX - spineW / 2 - pageW;  // left edge of cover
    const ty = bookY - bookH / 2;

    /* ── Drop shadow ── */
    const shR = bookW * 0.75;
    const sh  = ctx.createRadialGradient(bookX, bookY + bookH / 2 + 6 * scale, 0,
                                          bookX, bookY + bookH / 2 + 6 * scale, shR);
    sh.addColorStop(0, `rgba(0,0,0,${lerp(0.15, 0.55, ep)})`);
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(bookX, bookY + bookH / 2 + 8 * scale, shR, 16 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    /* ── Right page ── */
    for (let i = 5; i >= 1; i--) {
      ctx.fillStyle = `rgba(${Math.round(lerp(80,248,ep))},${Math.round(lerp(70,232,ep))},${Math.round(lerp(40,172,ep))},${lerp(0.25,0.75,ep)})`;
      ctx.fillRect(lx + i * 1.8, ty + i * 1.5, pageW, bookH);
    }

    const pgGrad = ctx.createLinearGradient(lx, ty, lx + pageW, ty + bookH);
    pgGrad.addColorStop(0, `rgb(${Math.round(lerp(60,255,ep))},${Math.round(lerp(52,248,ep))},${Math.round(lerp(30,190,ep))})`);
    pgGrad.addColorStop(1, `rgb(${Math.round(lerp(40,215,ep))},${Math.round(lerp(34,200,ep))},${Math.round(lerp(20,145,ep))})`);
    ctx.fillStyle = pgGrad;
    ctx.fillRect(lx, ty, pageW, bookH);

    /* Page inner glow — light flooding from spotlight impact */
    if (p > 0.04) {
      const pg2 = ctx.createRadialGradient(lx + pageW * 0.3, ty + bookH * 0.15, 0,
                                            lx + pageW * 0.4, bookY, pageW);
      pg2.addColorStop(0,    `rgba(255,255,230,${ep * 1.0})`);
      pg2.addColorStop(0.35, `rgba(255,248,185,${ep * 0.75})`);
      pg2.addColorStop(0.75, `rgba(255,240,140,${ep * 0.30})`);
      pg2.addColorStop(1,    'rgba(255,240,140,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = pg2;
      ctx.fillRect(lx, ty, pageW, bookH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    /* Text lines */
    ctx.save();
    ctx.strokeStyle = `rgba(50,30,5,${lerp(0.04,0.20,ep)})`;
    ctx.lineWidth   = 0.7 * scale;
    for (let i = 0; i < 11; i++) {
      const lw = pageW * (0.35 + (i % 3) * 0.16);
      ctx.beginPath();
      ctx.moveTo(lx + 12 * scale, ty + 22 * scale + i * 13 * scale);
      ctx.lineTo(lx + 12 * scale + lw, ty + 22 * scale + i * 13 * scale);
      ctx.stroke();
    }
    ctx.restore();

    /* ── Spine ── */
    const sp = ctx.createLinearGradient(bookX - spineW / 2, 0, bookX + spineW / 2, 0);
    sp.addColorStop(0,   `rgb(${Math.round(lerp(6,18,ep))},${Math.round(lerp(16,68,ep))},${Math.round(lerp(8,38,ep))})`);
    sp.addColorStop(0.5, `rgb(${Math.round(lerp(20,85,ep))},${Math.round(lerp(52,210,ep))},${Math.round(lerp(30,115,ep))})`);
    sp.addColorStop(1,   `rgb(${Math.round(lerp(6,18,ep))},${Math.round(lerp(16,68,ep))},${Math.round(lerp(8,38,ep))})`);
    ctx.fillStyle = sp;
    ctx.fillRect(bookX - spineW / 2, ty, spineW, bookH);

    /* Spine bloom */
    if (p > 0.06) {
      const sg = ctx.createLinearGradient(bookX, ty, bookX, ty + bookH);
      sg.addColorStop(0,   `rgba(230,255,190,${ep * 1.0})`);
      sg.addColorStop(0.5, `rgba(190,255,150,${ep * 0.75})`);
      sg.addColorStop(1,   `rgba(230,255,190,${ep * 1.0})`);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = sg;
      ctx.fillRect(bookX - spineW / 2, ty, spineW, bookH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    /* ── Left cover ── */
    const cv = ctx.createLinearGradient(rx, ty, rx + pageW, ty + bookH);
    cv.addColorStop(0, `rgb(${Math.round(lerp(10,48,ep))},${Math.round(lerp(26,125,ep))},${Math.round(lerp(14,70,ep))})`);
    cv.addColorStop(1, `rgb(${Math.round(lerp(5,18,ep))}, ${Math.round(lerp(12,60,ep))}, ${Math.round(lerp(6,32,ep))})`);
    ctx.fillStyle = cv;
    ctx.fillRect(rx, ty, pageW, bookH);

    /* Cover lit by reflected light */
    if (ep > 0.05) {
      const cTop = ctx.createLinearGradient(rx, ty, rx, ty + bookH * 0.55);
      cTop.addColorStop(0,  `rgba(160,255,130,${ep * 0.45})`);
      cTop.addColorStop(0.5,`rgba(100,220,80, ${ep * 0.18})`);
      cTop.addColorStop(1,  'rgba(0,0,0,0)');
      ctx.fillStyle = cTop;
      ctx.fillRect(rx, ty, pageW, bookH);

      // Rim light on left edge
      const rim = ctx.createLinearGradient(rx, 0, rx + pageW * 0.10, 0);
      rim.addColorStop(0, `rgba(255,255,200,${ep * 0.40})`);
      rim.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rim;
      ctx.fillRect(rx, ty, pageW * 0.10, bookH);
    }

    /* Cover border & title lines */
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${lerp(0.03, 0.28, ep)})`;
    ctx.lineWidth   = 1 * scale;
    const pad = 12 * scale;
    ctx.strokeRect(rx + pad, ty + pad, pageW - pad * 2, bookH - pad * 2);
    ctx.lineWidth = 1.2 * scale;
    const lws = [0.60, 0.40, 0.52];
    for (let i = 0; i < 3; i++) {
      const lw   = (pageW - pad * 2) * lws[i];
      const lxs  = rx + pad + ((pageW - pad * 2) - lw) / 2;
      const yPos = bookY - 20 * scale + i * 14 * scale;
      ctx.beginPath();
      ctx.moveTo(lxs, yPos);
      ctx.lineTo(lxs + lw, yPos);
      ctx.stroke();
    }
    ctx.restore();

    /* ── Top specular highlight (beam hits top edge) ── */
    if (ep > 0.2) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const spec = ctx.createLinearGradient(rx, ty, bookX + spineW / 2 + pageW, ty);
      spec.addColorStop(0,    'rgba(255,255,220,0)');
      spec.addColorStop(0.3,  `rgba(255,255,220,${ep * 0.85})`);
      spec.addColorStop(0.5,  `rgba(255,255,255,${ep * 0.95})`);
      spec.addColorStop(0.7,  `rgba(255,255,220,${ep * 0.85})`);
      spec.addColorStop(1,    'rgba(255,255,220,0)');
      ctx.strokeStyle = spec;
      ctx.lineWidth   = 2.5 * scale;
      ctx.beginPath();
      ctx.moveTo(rx, ty + 1.5);
      ctx.lineTo(bookX + spineW / 2 + pageW, ty + 1.5);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  }

  /* ════════════════════════════════════════════════
     4. MAIN LOOP
     ════════════════════════════════════════════════ */
  let frame = 0;

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Light source ≈ centre of h1 title
    // hero-content: padding-top 140px, tagline ~55px, so h1 sits ~200–240px from top
    lightX = W / 2;
    lightY = H * 0.27;

    // Set book geometry so Particle constructor can use it
    const scale = Math.min(W, H) / 820;
    bookW  = 340 * scale;
    bookH  = 220 * scale;
    spineW = 24  * scale;
    pageW  = (bookW - spineW) / 2;
    bookX  = W / 2;
    bookY  = H * 0.625;

    const ep = easeOut(scrollProgress);

    /* Background bloom */
    drawBackground(scrollProgress);

    /* Spawn + update particles */
    const target = Math.floor(MAX_P * ep);
    if (particles.length < target && frame % 2 === 0) {
      particles.push(new Particle());
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].isDead()) {
        if (scrollProgress > 0.04) {
          particles[i] = new Particle();
        } else {
          particles.splice(i, 1);
        }
      } else {
        particles[i].draw();
      }
    }

    /* Spotlight cone */
    drawSpotlight(scrollProgress);

    /* Book */
    drawBook(scrollProgress);
  }

  animate();
})();
