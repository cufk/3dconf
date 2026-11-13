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

export function createProduct() {
  let group = null;
  let currentW = 0;
  const refs = { parts: {}, acc: {}, ledLights: [], ledMat: null };
  const mats = {};
  const kinds = {};

  for (const p of PARTS) {
    const k = kindFor(p.id, p.defaultMaterial);
    mats[p.id] = makeMaterial(k, p.defaultColor);
    kinds[p.id] = k;
  }

  const ledMat = makeMaterial('led', '#ffd9a0');
  const wallMat = makeMaterial('wall', '#e9e5dd');
  const stoneMat = makeMaterial('stone', '#b9b6ae');
  const cabinetMat = makeMaterial('wall', '#dcd6cb');
  const potMat = makeMaterial('stainless', '#4c5058');
  const btnMat = makeMaterial('plastic', '#0c0d10');
  const dispMat = makeMaterial('led', '#bfe0ff');
  const glassMat = makeMaterial('glass', '#0c0d10');

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

    const canopy = mesh(new RoundedBoxGeometry(W, CANOPY_H, DEPTH, 4, 0.12), mats.canopy, 0, cy, 0);
    const under = mesh(new RoundedBoxGeometry(W * 0.94, 0.1, DEPTH * 0.92, 3, 0.05), mats.canopy, 0, CANOPY_BOTTOM + 0.05, 0);
    g.add(canopy, under);
    parts.canopy = [canopy, under];

    const nF = W >= 9 ? 3 : 2;
    const fW = (W * 0.9) / nF - 0.15;
    const filters = [];
    for (let i = 0; i < nF; i++) {
      const x = (i - (nF - 1) / 2) * (fW + 0.15);
      filters.push(mesh(new THREE.BoxGeometry(fW, 0.06, 1.7), mats.filter, x, CANOPY_BOTTOM - 0.03, 0.2));
    }
    g.add(...filters);
    parts.filter = filters;

    const strips = [];
    for (const sx of [-W * 0.25, W * 0.25]) {
      strips.push(mesh(new THREE.BoxGeometry(W * 0.4, 0.08, 0.12), ledMat, sx, CANOPY_BOTTOM - 0.02, DEPTH / 2 - 0.3, false));
    }
    g.add(...strips);
    parts.led = strips;

    const panel = mesh(new THREE.BoxGeometry(1.3, 0.55, 0.06), mats.controls, 0, cy, DEPTH / 2 + 0.02);
    const btns = [];
    for (const bx of [-0.42, 0, 0.42]) {
      const b = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16), btnMat, bx, cy, DEPTH / 2 + 0.06);
      b.rotation.x = Math.PI / 2;
      btns.push(b);
    }
    const disp = mesh(new THREE.BoxGeometry(0.4, 0.16, 0.02), dispMat, 0, cy, DEPTH / 2 + 0.06, false);
    g.add(panel, ...btns, disp);
    parts.controls = [panel];

    const chim = mesh(new RoundedBoxGeometry(W * 0.38, CHIM_H, DEPTH, 4, 0.08), mats.chimney, 0, CANOPY_BOTTOM + CANOPY_H + CHIM_H / 2, 0);
    const bracket = mesh(new THREE.BoxGeometry(W * 0.38 + 0.12, 0.5, 0.18), mats.chimney, 0, chimTop - 0.3, -DEPTH / 2 + 0.08);
    g.add(chim, bracket);
    parts.chimney = [chim, bracket];

    const glas = mesh(new THREE.BoxGeometry(W * 0.98, CANOPY_H * 0.9, 0.06), glassMat, 0, cy, DEPTH / 2 + 0.04);
    glas.visible = false;
    g.add(glas);
    acc.glasfront = glas;

    const ext = mesh(new RoundedBoxGeometry(W * 0.38, 2.0, DEPTH, 4, 0.08), mats.chimney, 0, chimTop + 1.0, 0);
    ext.visible = false;
    g.add(ext);
    acc.chimneyExt = ext;

    const rail = mesh(new THREE.BoxGeometry(W * 0.46, 0.14, 0.12), mats.chimney, 0, chimTop - 0.25, WALL_Z + 0.1);
    rail.visible = false;
    g.add(rail);
    acc.mountRail = rail;

    const wall = mesh(new THREE.PlaneGeometry(40, 26), wallMat, 0, 13, WALL_Z, false);
    wall.receiveShadow = true;
    const counter = mesh(new THREE.BoxGeometry(18, 0.5, 6.6), stoneMat, 0, -0.25, -0.3);
    const cab = mesh(new THREE.BoxGeometry(18, 5.4, 0.12), cabinetMat, 0, -3.0, 3.0, false);
    const handle = mesh(new THREE.BoxGeometry(18, 0.08, 0.12), potMat, 0, -0.75, 3.08, false);
    const pot = mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.3, 28), potMat, 3.4, 0.65, 0.6);
    const potRim = mesh(new THREE.TorusGeometry(1.0, 0.06, 8, 28), potMat, 3.4, 1.3, 0.6);
    potRim.rotation.x = Math.PI / 2;
    g.add(wall, counter, cab, handle, pot, potRim);

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

  return {
    apply,
    getGroup: () => group,
    refs
  };
}
