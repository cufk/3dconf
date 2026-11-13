import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeMaterial } from './materials.js';
import { PARTS, ACCESSORIES, MATERIALS, LED_OFF_HEX, sizeDef } from './config.js';

const DEPTH = 5.0;
const CANOPY_H = 1.2;
const CANOPY_BOTTOM = 7.5;
const CHIM_H = 8.0;
const WALL_Z = -3.0;

function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

function kindFor(id, mat) {
  if (id === 'led') return 'led';
  if (id === 'controls') return 'glassdark';
  return mat;
}

const ENV_TINTS = {
  kokdag: 0xbfd4e8,
  kokkvall: 0x2a3d66,
  studio: 0x1a1c22
};

export function createProduct() {
  let group = null;
  let currentW = 0;
  const refs = { parts: {}, acc: {}, ledLights: [], ledMat: null, windowPane: null };
  const mats = {};
  const kinds = {};

  for (const p of PARTS) {
    const k = kindFor(p.id, p.defaultMaterial);
    mats[p.id] = makeMaterial(k, p.defaultColor);
    kinds[p.id] = k;
  }

  const ledMat = makeMaterial('led', '#ffd9a0');
  const wallMat = makeMaterial('wall', '#e9e5dd');
  const splashMat = makeMaterial('wall', '#ddd7cb');
  const stoneMat = makeMaterial('stone', '#b9b6ae');
  const cabinetMat = makeMaterial('wall', '#d8d2c6');
  const frameMat = makeMaterial('plastic', '#3a3d42');
  const windowMat = makeMaterial('window', ENV_TINTS.kokdag);
  const potMat = makeMaterial('stainless', '#4c5058');
  const btnMat = makeMaterial('plastic', '#0c0d10');
  const dispMat = makeMaterial('led', '#bfe0ff');
  const badgeMat = makeMaterial('badge', '#d6d9de');
  const glassMat = makeMaterial('glass', '#0c0d10');
  const woodMat = makeMaterial('wood', '#8a6a4a');

  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }

  function build(W) {
    const g = new THREE.Group();
    const parts = {};
    const acc = {};
    const cy = CANOPY_BOTTOM + CANOPY_H / 2;
    const chimTop = CANOPY_BOTTOM + CANOPY_H + CHIM_H;

    const canopy = mesh(new RoundedBoxGeometry(W, CANOPY_H, DEPTH, 6, 0.14), mats.canopy, 0, cy, 0);
    const under = mesh(new RoundedBoxGeometry(W * 0.94, 0.1, DEPTH * 0.92, 3, 0.05), mats.canopy, 0, CANOPY_BOTTOM + 0.05, 0);
    const lip = mesh(new THREE.BoxGeometry(W, 0.1, 0.16), mats.canopy, 0, CANOPY_BOTTOM + 0.05, DEPTH / 2 - 0.04);
    g.add(canopy, under, lip);
    parts.canopy = [canopy, under, lip];

    const nF = W >= 9 ? 3 : 2;
    const fW = (W * 0.9) / nF - 0.15;
    const filters = [];
    for (let i = 0; i < nF; i++) {
      const x = (i - (nF - 1) / 2) * (fW + 0.15);
      const frame = mesh(new RoundedBoxGeometry(fW, 0.1, 1.78, 2, 0.03), mats.canopy, x, CANOPY_BOTTOM - 0.03, 0.2);
      const grid = mesh(new THREE.BoxGeometry(fW - 0.14, 0.05, 1.6), mats.filter, x, CANOPY_BOTTOM - 0.035, 0.2);
      const handle = mesh(new THREE.BoxGeometry(0.5, 0.05, 0.09), mats.canopy, x, CANOPY_BOTTOM - 0.06, 1.12, false);
      filters.push(frame, grid, handle);
    }
    g.add(...filters);
    parts.filter = filters;

    const strips = [];
    for (const sx of [-W * 0.25, W * 0.25]) {
      strips.push(mesh(new THREE.BoxGeometry(W * 0.4, 0.08, 0.12), ledMat, sx, CANOPY_BOTTOM - 0.02, DEPTH / 2 - 0.3, false));
    }
    g.add(...strips);
    parts.led = strips;

    const bezel = mesh(new THREE.BoxGeometry(1.5, 0.72, 0.06), mats.controls, 0, cy, DEPTH / 2 + 0.02);
    const inner = mesh(new THREE.BoxGeometry(1.32, 0.56, 0.04), mats.controls, 0, cy, DEPTH / 2 + 0.055);
    const btns = [];
    for (const bx of [-0.42, 0, 0.42]) {
      const b = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 16), btnMat, bx, cy, DEPTH / 2 + 0.085);
      b.rotation.x = Math.PI / 2;
      btns.push(b);
    }
    const disp = mesh(new THREE.BoxGeometry(0.4, 0.16, 0.02), dispMat, 0, cy + 0.14, DEPTH / 2 + 0.085, false);
    g.add(bezel, inner, ...btns, disp);
    parts.controls = [bezel, inner];

    const chim = mesh(new RoundedBoxGeometry(W * 0.38, CHIM_H, DEPTH, 6, 0.09), mats.chimney, 0, CANOPY_BOTTOM + CANOPY_H + CHIM_H / 2, 0);
    const cap = mesh(new RoundedBoxGeometry(W * 0.38 + 0.06, 0.12, DEPTH + 0.06, 2, 0.04), mats.chimney, 0, chimTop - 0.06, 0);
    const bracket = mesh(new THREE.BoxGeometry(W * 0.38 + 0.12, 0.5, 0.18), mats.chimney, 0, chimTop - 0.35, -DEPTH / 2 + 0.08);
    const screws = [];
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const s = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), potMat, (sx * (W * 0.38 + 0.12)) / 2 - sx * 0.06, chimTop - 0.35 + sy * 0.18, -DEPTH / 2 + 0.18);
      s.rotation.x = Math.PI / 2;
      screws.push(s);
    }
    const slots = [];
    for (let i = 0; i < 3; i++) {
      slots.push(mesh(new THREE.BoxGeometry(W * 0.3, 0.05, 0.03), btnMat, 0, chimTop - 1.0 - i * 0.28, DEPTH / 2 + 0.005, false));
    }
    const badge = mesh(new RoundedBoxGeometry(0.9, 0.34, 0.05, 2, 0.04), badgeMat, 0, chimTop - 2.1, DEPTH / 2 + 0.02);
    g.add(chim, cap, bracket, ...screws, ...slots, badge);
    parts.chimney = [chim, cap, bracket, ...screws];

    const glasGroup = new THREE.Group();
    const glas = mesh(new THREE.BoxGeometry(W * 0.98, CANOPY_H * 0.9, 0.05), glassMat, 0, 0, DEPTH / 2 + 0.05);
    const bars = [
      mesh(new THREE.BoxGeometry(W * 0.98, 0.09, 0.09), mats.canopy, 0, CANOPY_H * 0.45 + 0.02, DEPTH / 2 + 0.05),
      mesh(new THREE.BoxGeometry(W * 0.98, 0.09, 0.09), mats.canopy, 0, -CANOPY_H * 0.45 - 0.02, DEPTH / 2 + 0.05),
      mesh(new THREE.BoxGeometry(0.09, CANOPY_H * 0.9, 0.09), mats.canopy, -W * 0.49 + 0.04, 0, DEPTH / 2 + 0.05),
      mesh(new THREE.BoxGeometry(0.09, CANOPY_H * 0.9, 0.09), mats.canopy, W * 0.49 - 0.04, 0, DEPTH / 2 + 0.05)
    ];
    glasGroup.add(glas, ...bars);
    glasGroup.position.set(0, cy, 0);
    glasGroup.visible = false;
    g.add(glasGroup);
    acc.glasfront = glasGroup;

    const ext = mesh(new RoundedBoxGeometry(W * 0.38, 2.0, DEPTH, 4, 0.08), mats.chimney, 0, chimTop + 1.0, 0);
    ext.visible = false;
    g.add(ext);
    acc.chimneyExt = ext;

    const rail = mesh(new THREE.BoxGeometry(W * 0.46, 0.14, 0.12), mats.chimney, 0, chimTop - 0.3, WALL_Z + 0.1);
    rail.visible = false;
    g.add(rail);
    acc.mountRail = rail;

    const wall = mesh(new THREE.PlaneGeometry(44, 28), wallMat, 0, 14, WALL_Z, false);
    const splash = mesh(new THREE.BoxGeometry(18, 1.7, 0.08), splashMat, 0, 0.85, WALL_Z + 0.05, false);
    const counter = mesh(new THREE.BoxGeometry(18, 0.5, 6.6), stoneMat, 0, -0.25, -0.3);

    const doors = [];
    const handles = [];
    for (let i = -1; i <= 1; i++) {
      doors.push(mesh(new THREE.BoxGeometry(5.8, 5.3, 0.1), cabinetMat, i * 6.0, -3.0, 3.06, false));
      handles.push(mesh(new THREE.BoxGeometry(0.09, 1.3, 0.09), potMat, i * 6.0 + (i === 0 ? 0 : i * 2.6), -1.3, 3.16, false));
    }

    const winGroup = new THREE.Group();
    const pane = mesh(new THREE.PlaneGeometry(3.8, 5.8), windowMat, -5, 13.5, WALL_Z + 0.02, false);
    pane.receiveShadow = false;
    const wf = [
      mesh(new THREE.BoxGeometry(4.16, 0.18, 0.12), frameMat, -5, 16.39, WALL_Z + 0.06, false),
      mesh(new THREE.BoxGeometry(4.16, 0.18, 0.12), frameMat, -5, 10.61, WALL_Z + 0.06, false),
      mesh(new THREE.BoxGeometry(0.18, 6.16, 0.12), frameMat, -7.07, 13.5, WALL_Z + 0.06, false),
      mesh(new THREE.BoxGeometry(0.18, 6.16, 0.12), frameMat, -2.93, 13.5, WALL_Z + 0.06, false),
      mesh(new THREE.BoxGeometry(0.09, 5.8, 0.1), frameMat, -5, 13.5, WALL_Z + 0.07, false),
      mesh(new THREE.BoxGeometry(3.8, 0.09, 0.1), frameMat, -5, 13.5, WALL_Z + 0.07, false)
    ];
    winGroup.add(pane, ...wf);
    g.add(winGroup);
    refs.windowPane = pane;

    const pot = mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.3, 28), potMat, 3.4, 0.65, 0.6);
    const potRim = mesh(new THREE.TorusGeometry(1.0, 0.06, 8, 28), potMat, 3.4, 1.3, 0.6);
    potRim.rotation.x = Math.PI / 2;
    const potHandle = mesh(new THREE.BoxGeometry(1.6, 0.09, 0.09), potMat, 3.4, 1.15, 1.75, false);
    const board = mesh(new THREE.BoxGeometry(2.2, 0.12, 1.4), woodMat, -3.4, 0.06, 0.9);
    const jar = mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.1, 20), glassMat, -1.7, 0.55, 1.3);
    const jarLid = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 20), potMat, -1.7, 1.16, 1.3);
    g.add(wall, splash, counter, ...doors, ...handles, pot, potRim, potHandle, board, jar, jarLid);

    const l1 = new THREE.PointLight(0xffd9a0, 0, 16, 2);
    l1.position.set(-W * 0.25, CANOPY_BOTTOM - 0.3, DEPTH / 2 - 0.5);
    const l2 = new THREE.PointLight(0xffd9a0, 0, 16, 2);
    l2.position.set(W * 0.25, CANOPY_BOTTOM - 0.3, DEPTH / 2 - 0.5);
    g.add(l1, l2);

    refs.parts = parts;
    refs.acc = acc;
    refs.ledLights = [l1, l2];
    refs.ledMat = ledMat;
    return g;
  }

  function setSize(W) {
    if (group && W === currentW) return;
    if (group) {
      if (group.parent) group.parent.remove(group);
      disposeGroup(group);
    }
    group = build(W);
    currentW = W;
    for (const p of PARTS) {
      for (const m of refs.parts[p.id]) m.material = mats[p.id];
      kinds[p.id] = kindFor(p.id, p.defaultMaterial);
    }
  }

  function setPart(id, sel, fx) {
    const def = PARTS.find((p) => p.id === id);
    const kind = kindFor(id, sel.material);
    const color = def.locked ? (MATERIALS[sel.material] && MATERIALS[sel.material].color) || sel.color : sel.color;
    if (id === 'led') {
      fx.tweenColor(ledMat, sel.color);
      const c = new THREE.Color(sel.color);
      const on = sel.color.toLowerCase() !== LED_OFF_HEX;
      for (const l of refs.ledLights) {
        l.color.copy(c);
        l.intensity = on ? 6 : 0;
      }
      return;
    }
    const meshes = refs.parts[id];
    if (kinds[id] !== kind) {
      const m = makeMaterial(kind, color);
      for (const me of meshes) me.material = m;
      mats[id] = m;
      kinds[id] = kind;
    } else {
      fx.tweenColor(mats[id], color);
    }
  }

  function apply(state, fx) {
    const size = sizeDef(state.size);
    setSize(size.width);
    for (const p of PARTS) setPart(p.id, state.parts[p.id], fx);
    for (const a of ACCESSORIES) {
      const g = refs.acc[a.id];
      if (!g) continue;
      const on = !!state.acc[a.id];
      if (on && !g.visible) fx.pop(g);
      g.visible = on;
    }
  }

  function setEnvTint(env) {
    if (refs.windowPane) {
      refs.windowPane.material.color.setHex(ENV_TINTS[env] ?? ENV_TINTS.kokdag);
    }
  }

  return {
    apply,
    getGroup: () => group,
    setEnvTint,
    refs
  };
}
