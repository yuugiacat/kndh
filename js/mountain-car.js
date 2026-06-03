/**
 * mountain-car.js
 * Three.js 3D interactive mountain scene for the problem-solution section.
 * - Draws a 3D mountain slope.
 * - A draggable red car moves along the slope.
 * - ≥50% up the slope → label "Tương lai" + ảnh images.jpg
 * - <50%  up the slope → label "Hiện tại"  + ảnh images (1).jpg
 * - Image panel floats above the car (always upright).
 */

(function () {
  'use strict';

  const CANVAS_ID = 'mountain-car-canvas';
  const IMG_FUTURE = 'assets/images/index_future.jpg';
  const IMG_PRESENT = 'assets/images/index_present.jpg';

  // ─── Boot: load Three.js if needed, then init ────────────────────────────
  function boot() {
    if (window.THREE) {
      domReady(init);
    } else {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
      s.onload = function () { domReady(init); };
      document.head.appendChild(s);
    }
  }

  function domReady(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const canvas = document.getElementById(CANVAS_ID);
    if (!canvas) return;
    buildScene(canvas);
  }

  // ─── Main scene ───────────────────────────────────────────────────────────
  function buildScene(canvas) {
    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x091c12);
    scene.fog = new THREE.FogExp2(0x091c12, 0.038);

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
    camera.position.set(0, 4.5, 18);
    camera.lookAt(0, 2.5, 0);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const sun = new THREE.DirectionalLight(0xffe8b0, 1.6);
    sun.position.set(-5, 16, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { near: 0.5, far: 80, left: -28, right: 28, top: 28, bottom: -28 });
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6ec6f5, 0.35);
    fill.position.set(10, 5, -5);
    scene.add(fill);

    // ── Stars ─────────────────────────────────────────────────────────────
    {
      const N = 700, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 130;
        pos[i * 3 + 1] = Math.random() * 45 + 8;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 70 - 15;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16 })));
    }

    // ── Moon ──────────────────────────────────────────────────────────────
    const moonMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5f0d8, transparent: true, opacity: 0.90 })
    );
    moonMesh.position.set(-12, 13, -55);
    scene.add(moonMesh);

    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5f0d8, transparent: true, opacity: 0.07, side: THREE.DoubleSide })
    );
    halo.position.copy(moonMesh.position);
    scene.add(halo);

    // ── Ground ────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 40),
      new THREE.MeshLambertMaterial({ color: 0x162c1e })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Slope curve ───────────────────────────────────────────────────────
    // t=0: valley (left), t=1: peak (right)
    const SLOPE_POINTS = [
      new THREE.Vector3(-8.0, 0.0, 0),
      new THREE.Vector3(-5.5, 1.0, 0),
      new THREE.Vector3(-2.5, 3.2, 0),
      new THREE.Vector3(0.5, 5.6, 0),
      new THREE.Vector3(3.8, 7.0, 0),
    ];
    const slopeCurve = new THREE.CatmullRomCurve3(SLOPE_POINTS);

    // ── Mountain body ─────────────────────────────────────────────────────
    // Build extruded shape following the slope then closing at bottom
    const slopePts = slopeCurve.getPoints(50);
    const mShape = new THREE.Shape();
    mShape.moveTo(-10.5, -0.3);
    slopePts.forEach(p => mShape.lineTo(p.x, p.y));
    mShape.lineTo(5.5, -0.3);
    mShape.closePath();

    const mGeo = new THREE.ExtrudeGeometry(mShape, { depth: 4, bevelEnabled: false });
    const mMat = new THREE.MeshLambertMaterial({ color: 0x2a6048 });
    const mountainMesh = new THREE.Mesh(mGeo, mMat);
    mountainMesh.position.set(0, 0, -2);
    mountainMesh.castShadow = mountainMesh.receiveShadow = true;
    scene.add(mountainMesh);

    // Mountain dark face side
    const mDark = new THREE.Mesh(mGeo, new THREE.MeshLambertMaterial({ color: 0x193d2a }));
    mDark.position.copy(mountainMesh.position);
    scene.add(mDark);

    // Snow cap
    const snow = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.6),
      new THREE.MeshLambertMaterial({ color: 0xeef2f5 })
    );
    snow.position.set(3.8, 7.3, 0);
    scene.add(snow);

    // Background mountain cones
    [
      [-15, 5.2, 0x193322], [13, 5.8, 0x163020], [-22, 4.0, 0x112418],
      [20, 3.5, 0x0f1f14], [-30, 6.5, 0x0c1a10],
    ].forEach(([x, h, c]) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(h * 0.65, h, 7),
        new THREE.MeshLambertMaterial({ color: c })
      );
      m.position.set(x, h / 2 - 0.3, -7);
      scene.add(m);
    });

    // ── Road / track ──────────────────────────────────────────────────────
    const roadPts = slopeCurve.getPoints(80).map(p => new THREE.Vector3(p.x, p.y + 0.10, 0.04));
    const roadCurve = new THREE.CatmullRomCurve3(roadPts);
    scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(roadCurve, 80, 0.07, 7, false),
      new THREE.MeshLambertMaterial({ color: 0x7a6545 })
    ));

    // Distance markers (50% point marker)
    const midPt = slopeCurve.getPoint(0.5);
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
      new THREE.MeshBasicMaterial({ color: 0xffa500 })
    );
    marker.position.set(midPt.x, midPt.y + 0.6, 0.1);
    scene.add(marker);
    // Flag on top of marker
    const flagGeo = new THREE.PlaneGeometry(0.5, 0.3);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xffa500, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(midPt.x + 0.25, midPt.y + 1.3, 0.11);
    scene.add(flag);

    // ── CAR ───────────────────────────────────────────────────────────────
    const carGroup = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.44, 0.72),
      new THREE.MeshPhongMaterial({ color: 0xe8402a, shininess: 130 })
    );
    body.position.y = 0.22;
    body.castShadow = true;
    carGroup.add(body);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.36, 0.64),
      new THREE.MeshPhongMaterial({ color: 0xc0351e, shininess: 80 })
    );
    cabin.position.set(-0.1, 0.62, 0);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Windshield front
    const winMat = new THREE.MeshPhongMaterial({
      color: 0x9fd7f5, transparent: true, opacity: 0.65, shininess: 220
    });
    const winFront = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.24), winMat);
    winFront.position.set(-0.1, 0.62, 0.325);
    carGroup.add(winFront);
    const winBack = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.24), winMat);
    winBack.position.set(-0.1, 0.62, -0.325);
    carGroup.add(winBack);

    // Wheels
    const tireMat2 = new THREE.MeshPhongMaterial({ color: 0x181818 });
    const hubMat = new THREE.MeshPhongMaterial({ color: 0x3a4a5a });
    [[-0.44, 0, 0.42], [0.44, 0, 0.42], [-0.44, 0, -0.42], [0.44, 0, -0.42]].forEach(([x, y, z]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.13, 12), tireMat2);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(x, y + 0.18, z);
      carGroup.add(wh);
      const hb = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), hubMat);
      hb.rotation.y = Math.PI / 2;
      hb.position.set(x + (z > 0 ? 0.075 : -0.075), y + 0.18, z);
      carGroup.add(hb);
    });

    // Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffff99 });
    [-0.28, 0.28].forEach(dx => {
      const hl = new THREE.Mesh(new THREE.CircleGeometry(0.075, 8), hlMat);
      hl.position.set(dx, 0.24, 0.37);
      carGroup.add(hl);
    });

    scene.add(carGroup);

    // ── HTML elements for image display (right column) ───────────────────
    const labelEl   = document.getElementById('mc-status-label');
    const displayImg = document.getElementById('mc-display-img');
    const colImage   = document.querySelector('.ps-col-image');

    // Set initial data-state
    if (colImage) colImage.dataset.state = 'present';

    // ── State ─────────────────────────────────────────────────────────────
    let t = 0.15;
    let isDragging = false;
    let isFuture = false;

    // ── Smooth image crossfade ─────────────────────────────────────────────
    function switchImage(src, alt) {
      if (!displayImg) return;
      displayImg.classList.add('is-switching');
      setTimeout(() => {
        displayImg.src = src;
        displayImg.alt = alt;
        displayImg.classList.remove('is-switching');
      }, 280);
    }

    // ── Update positions each frame ───────────────────────────────────────
    function updateCar() {
      const pt = slopeCurve.getPoint(t);
      const tan = slopeCurve.getTangent(t);

      // Car position & rotation along slope
      carGroup.position.set(pt.x, pt.y, 0);
      carGroup.rotation.z = Math.atan2(tan.y, tan.x);

      // Switch HTML image & label at 50%
      const newFuture = t >= 0.5;
      if (newFuture !== isFuture) {
        isFuture = newFuture;
        switchImage(
          isFuture ? IMG_FUTURE : IMG_PRESENT,
          isFuture ? 'Tương lai' : 'Hiện tại'
        );
        if (labelEl) {
          labelEl.textContent = isFuture ? 'Tương lai' : 'Hiện tại';
          labelEl.className = 'mc-label ' + (isFuture ? 'mc-label--future' : 'mc-label--present');
        }
        if (colImage) colImage.dataset.state = isFuture ? 'future' : 'present';
      }
    }


    updateCar();

    // ── Drag logic ────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse2 = new THREE.Vector2();
    const hitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hitPt = new THREE.Vector3();

    function carScreenPos() {
      const wp = new THREE.Vector3();
      carGroup.getWorldPosition(wp);
      wp.project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: (wp.x * 0.5 + 0.5) * r.width + r.left, y: (-wp.y * 0.5 + 0.5) * r.height + r.top };
    }

    function toNDC(cx, cy) {
      const r = canvas.getBoundingClientRect();
      mouse2.x = ((cx - r.left) / r.width) * 2 - 1;
      mouse2.y = -((cy - r.top) / r.height) * 2 + 1;
    }

    function onDown(e) {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const sp = carScreenPos();
      if (Math.hypot(cx - sp.x, cy - sp.y) < 60) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    }

    function onMove(e) {
      if (!isDragging) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      toNDC(cx, cy);
      raycaster.setFromCamera(mouse2, camera);
      raycaster.ray.intersectPlane(hitPlane, hitPt);
      // Nearest t
      let best = t, bDist = Infinity;
      for (let i = 0; i <= 100; i++) {
        const ti = i / 100;
        const d = hitPt.distanceTo(slopeCurve.getPoint(ti));
        if (d < bDist) { bDist = d; best = ti; }
      }
      t = Math.max(0.01, Math.min(0.99, best));
      updateCar();
    }

    function onUp() { isDragging = false; canvas.style.cursor = 'grab'; }

    canvas.addEventListener('mousedown', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    canvas.style.cursor = 'grab';

    // ── Resize ────────────────────────────────────────────────────────────
    function resize() {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Animate ───────────────────────────────────────────────────────────
    let lastT = 0;
    function animate(ts) {
      requestAnimationFrame(animate);

      // Gentle idle sway when not dragging
      if (!isDragging) {
        const dt = (ts - lastT) * 0.001;
        const bob = Math.sin(ts * 0.0012) * 0.003 * dt;
        t = Math.max(0.01, Math.min(0.99, t + bob));
        updateCar();
      }
      lastT = ts;

      // Subtle camera drift
      camera.position.x = Math.sin(ts * 0.00025) * 0.4;
      camera.lookAt(Math.sin(ts * 0.0002) * 0.2, 2.5, 0);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  boot();

})();
