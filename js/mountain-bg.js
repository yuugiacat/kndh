/**
 * mountain-bg.js
 * Three.js dynamic background for .about-video-section
 * Features: procedural mountains, floating hearts, fog, stars, aurora-like glow
 */
(function () {
  'use strict';

  /* ─── Wait until THREE is loaded ─── */
  function init() {
    const section = document.querySelector('.about-video-section');
    if (!section) return;

    /* ─── Canvas Setup ─── */
    const canvas = document.getElementById('mountain-canvas');
    if (!canvas) return;

    const W = section.offsetWidth;
    const H = section.offsetHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x0a1a10, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1a10, 0.018);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 4, 18);
    camera.lookAt(0, 1, 0);

    /* ─── Sky gradient background ─── */
    const skyGeo = new THREE.PlaneGeometry(400, 200);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec3 bottom = vec3(0.04, 0.12, 0.07);
          vec3 mid    = vec3(0.06, 0.22, 0.13);
          vec3 top    = vec3(0.02, 0.06, 0.06);
          float glow  = 0.12 * sin(uTime * 0.3 + vUv.x * 3.14) * (1.0 - vUv.y);
          vec3 col = mix(bottom, mid, vUv.y);
          col = mix(col, top, smoothstep(0.5, 1.0, vUv.y));
          col += vec3(0.0, glow * 0.6, glow * 0.3);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.set(0, 40, -80);
    sky.renderOrder = -1;
    scene.add(sky);

    /* ─── Stars ─── */
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3]     = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 1] = Math.random() * 40 + 5;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ─── Moon ─── */
    const moonGeo = new THREE.CircleGeometry(1.8, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf5f0d8, transparent: true, opacity: 0.92 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-12, 14, -60);
    scene.add(moon);

    // Moon glow halo
    const haloGeo = new THREE.CircleGeometry(3.5, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf5f0d8, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(moon.position);
    scene.add(halo);

    /* ─── Mountain helper ─── */
    function makeMountain(opts) {
      const { segments = 80, xRange = 30, yBase = 0, yPeakMin = 4, yPeakMax = 9,
              zPos = 0, color = 0x1b4332, opacity = 1, jaggedness = 0.4 } = opts;

      const points = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * xRange;
        // Bell curve + fractal noise
        const bell  = Math.exp(-Math.pow((t - 0.5) * 3.5, 2));
        const noise = (Math.random() - 0.5) * jaggedness * bell;
        const peak  = yPeakMin + Math.random() * (yPeakMax - yPeakMin);
        const y     = yBase + bell * peak + noise;
        points.push(new THREE.Vector2(x, y));
      }
      // Close the shape at the bottom
      points.unshift(new THREE.Vector2(points[0].x - 1, yBase - 0.5));
      points.push(new THREE.Vector2(points[points.length - 1].x + 1, yBase - 0.5));

      const shape = new THREE.Shape(points);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = zPos;
      return mesh;
    }

    /* ─── Mountain layers (back → front) ─── */
    // Farthest range — light fog
    for (let i = 0; i < 3; i++) {
      const m = makeMountain({
        segments: 60, xRange: 40 + Math.random() * 10,
        yBase: -2, yPeakMin: 7, yPeakMax: 13,
        zPos: -30 - i * 5,
        color: 0x0d2b1c, opacity: 0.9, jaggedness: 0.6,
      });
      m.position.x = (Math.random() - 0.5) * 10;
      scene.add(m);
    }
    // Mid range
    for (let i = 0; i < 4; i++) {
      const m = makeMountain({
        segments: 80, xRange: 30 + Math.random() * 8,
        yBase: -2, yPeakMin: 5, yPeakMax: 10,
        zPos: -12 - i * 3,
        color: new THREE.Color().setHSL(0.38, 0.45, 0.1 + i * 0.02).getHex(),
        opacity: 1, jaggedness: 0.5,
      });
      m.position.x = (Math.random() - 0.5) * 8;
      scene.add(m);
    }
    // Foreground hills
    for (let i = 0; i < 3; i++) {
      const m = makeMountain({
        segments: 100, xRange: 28 + Math.random() * 6,
        yBase: -3, yPeakMin: 3, yPeakMax: 6,
        zPos: -2 - i * 2,
        color: new THREE.Color().setHSL(0.38, 0.5, 0.08 + i * 0.015).getHex(),
        opacity: 1, jaggedness: 0.3,
      });
      m.position.x = (Math.random() - 0.5) * 5;
      scene.add(m);
    }
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(80, 20);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x0a2416 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.2;
    scene.add(ground);

    /* ─── Firefly particles (tiny glowing dots in forest) ─── */
    const ffCount = 60;
    const ffPos = new Float32Array(ffCount * 3);
    const ffData = [];
    for (let i = 0; i < ffCount; i++) {
      ffPos[i * 3]     = (Math.random() - 0.5) * 24;
      ffPos[i * 3 + 1] = Math.random() * 3 - 2;
      ffPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 4;
      ffData.push({ speed: 0.3 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2 });
    }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    const ffMat = new THREE.PointsMaterial({ color: 0x90ffc0, size: 0.08, transparent: true, opacity: 0.85 });
    const fireflies = new THREE.Points(ffGeo, ffMat);
    scene.add(fireflies);

    /* ─── Heart geometry ─── */
    function makeHeartShape() {
      const s = new THREE.Shape();
      s.moveTo(0, 0.25);
      s.bezierCurveTo(0, 0.5, 0.5, 0.5, 0.5, 0.25);
      s.bezierCurveTo(0.5, -0.05, 0, -0.3, 0, -0.5);
      s.bezierCurveTo(0, -0.3, -0.5, -0.05, -0.5, 0.25);
      s.bezierCurveTo(-0.5, 0.5, 0, 0.5, 0, 0.25);
      return new THREE.ShapeGeometry(s, 8);
    }
    const heartGeo = makeHeartShape();

    /* ─── Heart pool ─── */
    const HEART_COUNT = 18;
    const hearts = [];
    const heartColors = [0xff6b9d, 0xff4d79, 0xff8fab, 0xffb3c6, 0xfc2f6b, 0xff9ec8];

    function spawnHeart() {
      const mat = new THREE.MeshBasicMaterial({
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(heartGeo, mat);
      const scale = 0.15 + Math.random() * 0.35;
      mesh.scale.set(scale, scale, scale);
      mesh.position.set(
        (Math.random() - 0.5) * 22,
        -3.5 + Math.random() * 2,        // start just above ground
        (Math.random() - 0.5) * 8 - 2
      );
      scene.add(mesh);
      return {
        mesh,
        vy:     0.012 + Math.random() * 0.018,  // rise speed
        vx:     (Math.random() - 0.5) * 0.006,  // drift
        wobble: Math.random() * Math.PI * 2,     // wobble phase
        wobbleSpeed: 0.6 + Math.random() * 0.8,
        wobbleAmp:   0.008 + Math.random() * 0.012,
        fadeInH:  5,   // units of height to fade in over
        fadeOutH: 12,  // units of height where fade out starts
        maxH:     18,
        startY: mesh.position.y,
      };
    }

    for (let i = 0; i < HEART_COUNT; i++) {
      const h = spawnHeart();
      // Stagger their start heights so they don't all appear at once
      h.mesh.position.y = -3.5 + Math.random() * 20;
      hearts.push(h);
    }

    /* ─── Lighting for future upgrade ─── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    /* ─── Resize ─── */
    window.addEventListener('resize', () => {
      const nW = section.offsetWidth;
      const nH = section.offsetHeight;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    });

    /* ─── Animate ─── */
    let clock = 0;
    function animate() {
      requestAnimationFrame(animate);
      clock += 0.016;

      skyMat.uniforms.uTime.value = clock;

      // Gentle camera sway
      camera.position.x = Math.sin(clock * 0.05) * 0.6;
      camera.lookAt(Math.sin(clock * 0.04) * 0.3, 1, 0);

      // Fireflies bob
      const ffArr = ffGeo.attributes.position.array;
      for (let i = 0; i < ffCount; i++) {
        ffArr[i * 3 + 1] += Math.sin(clock * ffData[i].speed + ffData[i].phase) * 0.003;
      }
      ffGeo.attributes.position.needsUpdate = true;
      ffMat.opacity = 0.5 + 0.4 * Math.abs(Math.sin(clock * 0.7));

      // Hearts rise and drift
      for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        h.mesh.position.y += h.vy;
        h.mesh.position.x += h.vx + h.wobbleAmp * Math.sin(clock * h.wobbleSpeed + h.wobble);
        h.mesh.rotation.z  = 0.15 * Math.sin(clock * h.wobbleSpeed * 0.7 + h.wobble);

        // Fade in / out
        const relY = h.mesh.position.y - h.startY;
        if (relY < h.fadeInH) {
          h.mesh.material.opacity = Math.min(1, relY / h.fadeInH) * 0.85;
        } else if (relY > h.fadeOutH) {
          h.mesh.material.opacity = Math.max(0, 0.85 * (1 - (relY - h.fadeOutH) / (h.maxH - h.fadeOutH)));
        } else {
          h.mesh.material.opacity = 0.85;
        }

        // Reset when gone
        if (h.mesh.position.y > h.startY + h.maxH) {
          h.mesh.position.x = (Math.random() - 0.5) * 22;
          h.mesh.position.y = -3.5 + Math.random() * 2;
          h.mesh.position.z = (Math.random() - 0.5) * 8 - 2;
          h.mesh.material.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ─── Load Three.js then init ─── */
  if (window.THREE) {
    init();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
    script.onload = init;
    document.head.appendChild(script);
  }
})();
