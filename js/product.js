import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeMaterial, darken } from './materials.js';
import { PARTS, ACCESSORIES, sizeDef } from './config.js';

const W = 3.0;
const H = 3.9;
const D = 1.35;

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function tube(points, radius, seg = 28, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  return new THREE.TubeGeometry(curve, seg, radius, radial, false);
}

function roundedRectPoints(w, h, r, stepsPerCorner = 5) {
  const pts = [];
  const hw = w / 2;
  const hh = h / 2;
  const corners = [
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, Math.PI / 2],
    [-hw + r, -hh + r, Math.PI],
    [hw - r, -hh + r, Math.PI * 1.5]
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= stepsPerCorner; i++) {
      const a = a0 + (i / stepsPerCorner) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
  }
  return pts;
}

function materialKindFor(partId, mat) {
  if (partId === 'logo') return 'patch';
  return mat;
}

export function createProduct() {
  const group = new THREE.Group();
  const refs = { parts: {}, mats: {}, kinds: {}, acc: {}, accMats: {}, accKinds: {} };

  const bodyMat = makeMaterial('canvas', '#2e3138');
  const pocketMat = makeMaterial('canvas', '#1f3a5f');
  const bottomMat = makeMaterial('leather', '#17181c');
  const strapMat = makeMaterial('canvas', '#17181c');
  const handleMat = makeMaterial('leather', '#17181c');
  const logoMat = makeMaterial('patch', '#f2ede2');
  const zipMat = makeMaterial('metal', '#c9ced8');
  const plasticMat = makeMaterial('plastic', '#1d1f24');
  const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b0c0f'), roughness: 0.95 });
  const stitchMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#10121a'), roughness: 0.9 });

  const body = mesh(new RoundedBoxGeometry(W, H, D, 6, 0.30), bodyMat, 0, H / 2, 0);
  group.add(body);
  refs.parts.body = [body];

  const bottom = mesh(new RoundedBoxGeometry(W * 0.99, 0.42, D * 0.99, 4, 0.15), bottomMat, 0, 0.21, 0);
  group.add(bottom);
  refs.parts.bottom = [bottom];

  const pocketW = W * 0.72;
  const pocketH = 1.35;
  const pocketD = 0.5;
  const pocketY = H * 0.32;
  const pocketZ = D / 2 + 0.24;
  const pocket = mesh(new RoundedBoxGeometry(pocketW, pocketH, pocketD, 4, 0.14), pocketMat, 0, pocketY, pocketZ);
  group.add(pocket);
  refs.parts.pocket = [pocket];

  const pocketFrontZ = pocketZ + pocketD / 2;
  const stitchCurve = new THREE.CatmullRomCurve3(roundedRectPoints(pocketW - 0.2, pocketH - 0.2, 0.12, 4), true);
  const stitchGeo = new THREE.TubeGeometry(stitchCurve, 48, 0.022, 6, true);
  const stitch = mesh(stitchGeo, stitchMat, 0, pocketY, pocketFrontZ + 0.012);
  stitch.castShadow = false;
  group.add(stitch);
  refs.stitchMat = stitchMat;

  const zipY = pocketY + pocketH / 2 - 0.14;
  const zipZ = pocketFrontZ + 0.015;
  const zipHalf = pocketW / 2 - 0.16;
  const toothCount = 34;
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.058, 0.075, 0.05), zipMat, toothCount);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < toothCount; i++) {
    m4.setPosition(-zipHalf + (i / (toothCount - 1)) * zipHalf * 2, zipY, zipZ);
    teeth.setMatrixAt(i, m4);
  }
  teeth.castShadow = true;
  teeth.receiveShadow = true;
  group.add(teeth);

  const slider = mesh(new THREE.BoxGeometry(0.16, 0.2, 0.07), zipMat, zipHalf + 0.02, zipY, zipZ + 0.01);
  const pull = mesh(new THREE.BoxGeometry(0.085, 0.24, 0.045), zipMat, zipHalf + 0.02, zipY - 0.21, zipZ + 0.01);
  const pullRing = mesh(new THREE.TorusGeometry(0.06, 0.022, 8, 18), zipMat, zipHalf + 0.02, zipY - 0.08, zipZ + 0.02);
  pullRing.rotation.x = Math.PI / 2;
  group.add(slider, pull, pullRing);
  refs.parts.zipper = [teeth, slider, pull, pullRing];

  const logo = mesh(new RoundedBoxGeometry(0.98, 0.42, 0.07, 2, 0.05), logoMat, 0, pocketY + 0.22, pocketFrontZ + 0.028);
  group.add(logo);
  refs.parts.logo = [logo];

  const inner = mesh(new THREE.BoxGeometry(W * 0.86, 0.14, D * 0.8), darkMat, 0, H - 0.05, 0);
  inner.castShadow = false;
  group.add(inner);

  const handleCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.55, H + 0.02, 0),
    new THREE.Vector3(0, H + 0.62, 0),
    new THREE.Vector3(0.55, H + 0.02, 0)
  );
  const handleTube = mesh(new THREE.TubeGeometry(handleCurve, 20, 0.085, 10), handleMat, 0, 0, 0);
  const anchorL = mesh(new THREE.BoxGeometry(0.24, 0.2, 0.32), handleMat, -0.55, H - 0.03, 0);
  const anchorR = mesh(new THREE.BoxGeometry(0.24, 0.2, 0.32), handleMat, 0.55, H - 0.03, 0);
  group.add(handleTube, anchorL, anchorR);
  refs.parts.handle = [handleTube, anchorL, anchorR];

  const strapMeshes = [];
  for (const s of [-1, 1]) {
    const pts = [
      [s * 0.95, H * 0.99, -0.58],
      [s * 1.2, H * 0.72, -0.98],
      [s * 1.24, H * 0.38, -0.95],
      [s * 0.92, 0.62, -0.72]
    ];
    const t = mesh(tube(pts, 0.175, 32, 12), strapMat, 0, 0, 0);
    t.scale.z = 0.55;
    const web = mesh(new THREE.BoxGeometry(0.17, 0.85, 0.035), strapMat, s * 0.9, 0.42, -0.7);
    const adj = mesh(new THREE.BoxGeometry(0.3, 0.44, 0.11), plasticMat, s * 0.92, 0.92, -0.78);
    adj.rotation.z = s * -0.08;
    group.add(t, web, adj);
    strapMeshes.push(t, web);
  }
  refs.parts.straps = strapMeshes;

  const chestGroup = new THREE.Group();
  const chestBand = mesh(new THREE.BoxGeometry(1.86, 0.15, 0.06), strapMat, 0, 0, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.24, 0.26, 0.12), plasticMat, 0, 0, 0.01);
  chestGroup.add(chestBand, buckle);
  chestGroup.position.set(0, H * 0.66, -1.0);
  chestGroup.visible = false;
  group.add(chestGroup);
  refs.acc.chestStrap = chestGroup;

  const padGroup = new THREE.Group();
  const padMat = makeMaterial('canvas', '#d8c9a3');
  const pad = mesh(new RoundedBoxGeometry(W * 0.82, 0.2, D * 0.78, 4, 0.09), padMat, 0, 0, 0);
  const padStrap1 = mesh(new THREE.BoxGeometry(0.2, 0.28, D * 0.9), padMat, -0.65, 0.02, 0);
  const padStrap2 = mesh(new THREE.BoxGeometry(0.2, 0.28, D * 0.9), padMat, 0.65, 0.02, 0);
  padGroup.add(pad, padStrap1, padStrap2);
  padGroup.position.set(0, H + 0.11, 0);
  padGroup.visible = false;
  group.add(padGroup);
  refs.acc.seatPad = padGroup;
  refs.accMats.seatPad = padMat;
  refs.accKinds.seatPad = 'canvas';

  const bottleGroup = new THREE.Group();
  const bottleMat = makeMaterial('canvas', '#2f4f3e');
  const holder = mesh(new THREE.CylinderGeometry(0.4, 0.44, 1.25, 26, 1, true), bottleMat, 0, 0, 0);
  holder.material.side = THREE.DoubleSide;
  const holderBottom = mesh(new THREE.CircleGeometry(0.44, 26), bottleMat, 0, -0.625, 0);
  holderBottom.rotation.x = -Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.4, 0.032, 8, 26), bottleMat, 0, 0.625, 0);
  rim.rotation.x = Math.PI / 2;
  const mount = mesh(new THREE.BoxGeometry(0.55, 0.13, 0.13), bottleMat, -0.28, 0.55, 0);
  bottleGroup.add(holder, holderBottom, rim, mount);
  bottleGroup.position.set(W / 2 + 0.32, 1.2, 0);
  bottleGroup.visible = false;
  group.add(bottleGroup);
  refs.acc.bottleHolder = bottleGroup;
  refs.accMats.bottleHolder = bottleMat;
  refs.accKinds.bottleHolder = 'canvas';

  const ringMat = makeMaterial('leather', '#17181c');
  const keyRing = mesh(new THREE.TorusGeometry(0.17, 0.04, 10, 24), ringMat, zipHalf + 0.02, zipY - 0.34, zipZ + 0.01);
  keyRing.rotation.x = Math.PI / 2;
  keyRing.visible = false;
  group.add(keyRing);
  refs.acc.keyRing = keyRing;

  refs.mats = {
    body: bodyMat,
    pocket: pocketMat,
    bottom: bottomMat,
    straps: strapMat,
    handle: handleMat,
    logo: logoMat,
    zipper: zipMat
  };
  refs.kinds = {
    body: 'canvas',
    pocket: 'canvas',
    bottom: 'leather',
    straps: 'canvas',
    handle: 'leather',
    logo: 'patch',
    zipper: 'metal'
  };

  function setPart(id, sel, fx) {
    const kind = materialKindFor(id, sel.material);
    const meshes = refs.parts[id];
    if (refs.kinds[id] !== kind) {
      const m = makeMaterial(kind, sel.color);
      for (const me of meshes) me.material = m;
      refs.mats[id] = m;
      refs.kinds[id] = kind;
    } else {
      fx.tweenColor(refs.mats[id], sel.color);
    }
    if (id === 'pocket') {
      fx.tweenColor(stitchMat, darken(sel.color, 0.5));
    }
  }

  function setAccColor(id, hex, fx) {
    fx.tweenColor(refs.accMats[id], hex);
  }

  function apply(state, fx) {
    const size = sizeDef(state.size);
    fx.lerpScale(group, size.scale);
    for (const p of PARTS) {
      setPart(p.id, state.parts[p.id], fx);
    }
    for (const a of ACCESSORIES) {
      const g = refs.acc[a.id];
      if (!g) continue;
      const on = !!state.acc[a.id];
      if (on && !g.visible) fx.pop(g);
      g.visible = on;
      if (on && a.colorable) setAccColor(a.id, state.accColors[a.id], fx);
    }
  }

  return { group, apply };
}
