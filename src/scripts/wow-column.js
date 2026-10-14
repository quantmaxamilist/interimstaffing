import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const SECTORS = 4, COLS = 9, ROWS = 3, PER = COLS * ROWS, N = SECTORS * PER;
const SLAB_W = 1.5, SLAB_H = 1.0, SLAB_D = 0.62, GAP = 0.1;
const STRAND_W = (SLAB_W / COLS) * 0.78, STRAND_D = (SLAB_D / ROWS) * 0.78;
const DURATION = 2.6; // seconds, whole assembly
const ease = (t) => 1 - Math.pow(1 - t, 4);
const easeIO = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);

export function init(sec) {
  const host = sec.querySelector('[data-wc-canvas]');
  const poster = sec.querySelector('[data-wc-poster]');
  const list = sec.querySelector('[data-wc-list]');
  const replay = sec.querySelector('[data-wc-replay]');
  const pins = [...sec.querySelectorAll('[data-wc-pin]')];
  const items = [...sec.querySelectorAll('[data-wc-item]')];
  const mobile = matchMedia('(max-width: 860px)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.4, 13);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xfff1d6, 2.2); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.PointLight(0xc0143c, 40, 14); rim.position.set(-3.5, 1, -5); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x3b1418, 0.6));

  const geo = new THREE.BoxGeometry(STRAND_W, SLAB_H, STRAND_D);
  const mat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.3 });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const group = new THREE.Group(); group.add(mesh); scene.add(group);

  // Targets: four stacked slabs, sector 0 at the top.
  const totalH = SECTORS * SLAB_H + (SECTORS - 1) * GAP;
  const target = [], start = [], startQ = [], delay = [];
  const rnd = mulberry32(7);
  for (let s = 0; s < SECTORS; s++) {
    const y = totalH / 2 - SLAB_H / 2 - s * (SLAB_H + GAP);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = -SLAB_W / 2 + (c + 0.5) * (SLAB_W / COLS);
      const z = -SLAB_D / 2 + (r + 0.5) * (SLAB_D / ROWS);
      target.push(new THREE.Vector3(x, y, z));
      const a = rnd() * Math.PI * 2, rad = 4 + rnd() * 4;
      start.push(new THREE.Vector3(Math.cos(a) * rad, (rnd() - 0.5) * 7, Math.sin(a) * rad * 0.6 - 1));
      startQ.push(new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)));
      delay.push(s * 0.12 + rnd() * 0.28);
    }
  }
  const idQ = new THREE.Quaternion();
  const colors = new Float32Array(N * 3).fill(1);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);

  let t = 0, playing = false, visible = false, raf = 0, last = 0, hot = -1;
  const curCol = new Float32Array(N).fill(1), tgtCol = new Float32Array(N).fill(1);

  function pose(time) {
    for (let i = 0; i < N; i++) {
      const k = ease(Math.min(1, Math.max(0, (time - delay[i]) / (DURATION - 0.75))));
      p.lerpVectors(start[i], target[i], k);
      p.y += Math.sin(k * Math.PI) * 0.6; // slight arc
      q.slerpQuaternions(startQ[i], idQ, k);
      m4.compose(p, q, one); mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.rotation.y = -1.1 + 1.45 * easeIO(Math.min(1, time / DURATION));
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1.05 ? 12.5 : 10;
    camera.updateProjectionMatrix();
    render();
  }

  function render() { renderer.render(scene, camera); placePins(); }

  const v = new THREE.Vector3();
  function placePins() {
    if (mobile || t < DURATION) return;
    const w = host.clientWidth, h = host.clientHeight;
    pins.forEach((pin, s) => {
      const y = totalH / 2 - SLAB_H / 2 - s * (SLAB_H + GAP);
      v.set(SLAB_W / 2 + 0.02, y, SLAB_D / 2).applyMatrix4(group.matrixWorld).project(camera);
      pin.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
    });
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    let busy = false;
    if (playing) {
      t = Math.min(DURATION, t + dt);
      pose(t);
      if (t >= DURATION) { playing = false; finish(); } else busy = true;
    }
    // ease highlight colours
    let dirty = false;
    for (let i = 0; i < N; i++) {
      const d = tgtCol[i] - curCol[i];
      if (Math.abs(d) > 0.004) { curCol[i] += d * Math.min(1, dt * 12 || 0.2); dirty = true; }
      else curCol[i] = tgtCol[i];
      const c = curCol[i]; colors[i * 3] = c; colors[i * 3 + 1] = c > 1 ? c * 0.96 : c * 0.85; colors[i * 3 + 2] = c > 1 ? c * 0.9 : c * 0.85;
    }
    if (dirty) { mesh.instanceColor.needsUpdate = true; busy = true; }
    render();
    if (busy && visible) kick();
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function finish() {
    list.classList.add('is-in');
    pins.forEach((pin) => pin.classList.add('is-on'));
    replay.hidden = false;
  }

  function play() {
    t = 0; playing = true; replay.hidden = true;
    pins.forEach((pin) => pin.classList.remove('is-on'));
    kick();
  }

  function setHot(s) {
    if (s === hot) return; hot = s;
    for (let i = 0; i < N; i++) tgtCol[i] = s < 0 ? 1 : Math.floor(i / PER) === s ? 1.35 : 0.42;
    items.forEach((it, i) => it.classList.toggle('is-hot', i === s));
    pins.forEach((pin, i) => pin.classList.toggle('is-hot', i === s));
    kick();
  }

  // Hover: list ↔ model
  items.forEach((it, i) => {
    it.addEventListener('pointerenter', () => t >= DURATION && setHot(i));
    it.addEventListener('pointerleave', () => setHot(-1));
    it.addEventListener('focus', () => t >= DURATION && setHot(i));
    it.addEventListener('blur', () => setHot(-1));
  });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (t < DURATION || mobile) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObject(mesh)[0];
    setHot(hit ? Math.floor(hit.instanceId / PER) : -1);
    renderer.domElement.style.cursor = hit ? 'pointer' : '';
  });
  renderer.domElement.addEventListener('pointerleave', () => setHot(-1));
  renderer.domElement.addEventListener('click', () => { if (hot >= 0) items[hot].click(); });
  replay.addEventListener('click', play);

  // Initial pose + shader pre-compile before the section arrives.
  pose(0);
  renderer.compile(scene, camera);
  resize();
  poster.classList.add('is-gone');
  new ResizeObserver(resize).observe(host);

  // Play when ≥50% visible; pause off screen.
  let started = false;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (e.intersectionRatio >= 0.5 && !started) { started = true; play(); }
    if (visible && playing) kick();
  }, { threshold: [0, 0.5] });
  io.observe(host);

  addEventListener('pagehide', () => {
    io.disconnect(); cancelAnimationFrame(raf);
    geo.dispose(); mat.dispose(); env.dispose(); pmrem.dispose(); renderer.dispose();
  }, { once: true });
}

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
