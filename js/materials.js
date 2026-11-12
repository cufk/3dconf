import * as THREE from 'three';

let maxAniso = 8;
const texCache = new Map();

export function setMaxAnisotropy(n) {
  maxAniso = n;
  for (const t of texCache.values()) {
    t.anisotropy = Math.min(n, maxAniso);
  }
}

function makeCanvas(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso;
  return t;
}

function weaveSet(spacing, contrast) {
  const key = `weave-${spacing}-${contrast}`;
  if (texCache.has(key)) return texCache.get(key);
  const map = makeCanvas(512, (g, s) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += spacing) {
      const dark = (i / spacing) % 2 === 0;
      g.fillStyle = dark ? `rgba(0,0,0,${contrast})` : `rgba(255,255,255,${contrast * 0.6})`;
      g.fillRect(i, 0, spacing / 2, s);
      g.fillRect(0, i, s, spacing / 2);
    }
    for (let i = 0; i < 2600; i++) {
      const v = 235 + Math.random() * 20;
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.fillRect(Math.random() * s, Math.random() * s, 1.4, 1.4);
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = makeCanvas(256, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += spacing) {
      const dark = (i / spacing) % 2 === 0;
      g.fillStyle = dark ? '#5a5a5a' : '#a5a5a5';
      g.fillRect(i, 0, Math.max(1, spacing / 3), s);
      g.fillRect(0, i, s, Math.max(1, spacing / 3));
    }
  });
  const rough = makeCanvas(256, (g, s) => {
    g.fillStyle = '#f2f2f2';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += spacing) {
      g.fillStyle = (i / spacing) % 2 === 0 ? '#d9d9d9' : '#ffffff';
      g.fillRect(i, 0, spacing / 2, s);
      g.fillRect(0, i, s, spacing / 2);
    }
  });
  const set = { map, bump, rough };
  texCache.set(key, set);
  return set;
}

function leatherMaps() {
  const key = 'leather';
  if (texCache.has(key)) return texCache.get(key);
  const map = makeCanvas(512, (g, s) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 2 + Math.random() * 9;
      const v = 225 + Math.random() * 30;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${v},${v},${v},0.55)`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 240; i++) {
      g.strokeStyle = `rgba(120,110,100,${0.05 + Math.random() * 0.08})`;
      g.lineWidth = 0.8 + Math.random();
      g.beginPath();
      const x = Math.random() * s;
      const y = Math.random() * s;
      g.moveTo(x, y);
      g.bezierCurveTo(x + 20 - Math.random() * 40, y + 20 - Math.random() * 40, x + 30 - Math.random() * 60, y + 30 - Math.random() * 60, x + 50 - Math.random() * 100, y + 50 - Math.random() * 100);
      g.stroke();
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = makeCanvas(512, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 5200; i++) {
      const v = 90 + Math.random() * 80;
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.beginPath();
      g.arc(Math.random() * s, Math.random() * s, 0.6 + Math.random() * 2.2, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = `rgba(70,64,58,${0.10 + Math.random() * 0.12})`;
      g.lineWidth = 0.7 + Math.random() * 1.2;
      g.beginPath();
      const x = Math.random() * s;
      const y = Math.random() * s;
      g.moveTo(x, y);
      g.bezierCurveTo(x + 30 - Math.random() * 60, y + 30 - Math.random() * 60, x + 50 - Math.random() * 100, y + 40 - Math.random() * 80, x + 80 - Math.random() * 160, y + 60 - Math.random() * 120);
      g.stroke();
    }
  });
  const set = { map, bump };
  texCache.set(key, set);
  return set;
}

function logoTexture() {
  const key = 'logo';
  if (texCache.has(key)) return texCache.get(key);
  const t = makeCanvas(512, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#141414';
    g.font = `700 ${s * 0.30}px Georgia, 'Times New Roman', serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('FJÄLL', s / 2, s / 2 + s * 0.02);
    g.fillRect(s * 0.18, s * 0.78, s * 0.64, s * 0.035);
  });
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

export function makeMaterial(kind, hex) {
  const color = new THREE.Color(hex);
  switch (kind) {
    case 'nylon': {
      const w = weaveSet(3, 0.16);
      return new THREE.MeshPhysicalMaterial({
        color,
        map: w.map,
        bumpMap: w.bump,
        bumpScale: 0.35,
        roughnessMap: w.rough,
        roughness: 0.62,
        metalness: 0.0,
        sheen: 0.35,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color('#cfd6e4')
      });
    }
    case 'leather': {
      const l = leatherMaps();
      return new THREE.MeshPhysicalMaterial({
        color,
        map: l.map,
        bumpMap: l.bump,
        bumpScale: 0.5,
        roughness: 0.42,
        metalness: 0.0,
        clearcoat: 0.85,
        clearcoatRoughness: 0.32
      });
    }
    case 'metal': {
      const isBrass = hex.toLowerCase() === '#b08d4f';
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 1.0,
        roughness: isBrass ? 0.34 : 0.24,
        envMapIntensity: 1.4
      });
    }
    case 'patch': {
      return new THREE.MeshStandardMaterial({
        color,
        map: logoTexture(),
        roughness: 0.85,
        metalness: 0.0
      });
    }
    case 'foam': {
      return new THREE.MeshStandardMaterial({ color, roughness: 0.98, metalness: 0.0 });
    }
    case 'plastic': {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#1d1f24'),
        roughness: 0.45,
        metalness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.4
      });
    }
    case 'canvas':
    default: {
      const w = weaveSet(4, 0.22);
      return new THREE.MeshPhysicalMaterial({
        color,
        map: w.map,
        bumpMap: w.bump,
        bumpScale: 0.6,
        roughnessMap: w.rough,
        roughness: 0.92,
        metalness: 0.0,
        sheen: 0.5,
        sheenRoughness: 0.85,
        sheenColor: new THREE.Color('#e8e2d5')
      });
    }
  }
}

export function darken(hex, factor = 0.55) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return `#${c.getHexString()}`;
}
