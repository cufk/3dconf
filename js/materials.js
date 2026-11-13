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

function brushedMetalMaps() {
  const key = 'brushed';
  if (texCache.has(key)) return texCache.get(key);
  const bump = makeCanvas(1024, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 2) {
      const v = 90 + Math.random() * 80;
      g.fillStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.35})`;
      g.fillRect(x, 0, 1, s);
    }
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, Math.random() * 40);
    }
  });
  const rough = makeCanvas(512, (g, s) => {
    g.fillStyle = '#4d4d4d';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 3) {
      const v = 60 + Math.random() * 50;
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.fillRect(x, 0, 1, s);
    }
  });
  const set = { bump, rough };
  texCache.set(key, set);
  return set;
}

function meshGridMaps() {
  const key = 'mesh';
  if (texCache.has(key)) return texCache.get(key);
  const cell = 8;
  const map = makeCanvas(512, (g, s) => {
    g.fillStyle = '#e2e5ea';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#4c515a';
    for (let i = 0; i < s; i += cell) {
      g.fillRect(i, 0, 2, s);
      g.fillRect(0, i, s, 2);
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = makeCanvas(512, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#303030';
    for (let i = 0; i < s; i += cell) {
      g.fillRect(i, 0, 2, s);
      g.fillRect(0, i, s, 2);
    }
  });
  const set = { map, bump };
  texCache.set(key, set);
  return set;
}

function noiseMap(strength = 0.06, size = 512) {
  const key = `noise-${strength}-${size}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = makeCanvas(size, (g, s) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 14000; i++) {
      const v = 255 - Math.random() * 255 * strength * 2;
      g.fillStyle = `rgba(${v},${v},${v},0.6)`;
      g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

function stoneMaps() {
  const key = 'stone';
  if (texCache.has(key)) return texCache.get(key);
  const map = makeCanvas(1024, (g, s) => {
    g.fillStyle = '#c9c6bf';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 5200; i++) {
      const v = 150 + Math.random() * 90;
      g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.12 + Math.random() * 0.2})`;
      g.beginPath();
      g.ellipse(Math.random() * s, Math.random() * s, 2 + Math.random() * 20, 1 + Math.random() * 10, Math.random() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 120; i++) {
      g.strokeStyle = `rgba(120,118,112,${0.08 + Math.random() * 0.1})`;
      g.lineWidth = 0.8 + Math.random();
      g.beginPath();
      const x = Math.random() * s;
      const y = Math.random() * s;
      g.moveTo(x, y);
      g.lineTo(x + 80 - Math.random() * 160, y + 50 - Math.random() * 100);
      g.stroke();
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = makeCanvas(512, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4200; i++) {
      const v = 100 + Math.random() * 60;
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.beginPath();
      g.arc(Math.random() * s, Math.random() * s, 0.8 + Math.random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
  const set = { map, bump };
  texCache.set(key, set);
  return set;
}

function badgeTexture() {
  const key = 'badge';
  if (texCache.has(key)) return texCache.get(key);
  const t = makeCanvas(512, (g, s) => {
    g.fillStyle = '#d6d9de';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 3) {
      const v = 190 + Math.random() * 50;
      g.fillStyle = `rgba(${v},${v},${v},0.35)`;
      g.fillRect(x, 0, 1, s);
    }
    g.fillStyle = '#23252a';
    g.font = `700 ${s * 0.34}px Arial, Helvetica, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('3DC', s / 2, s / 2 + s * 0.02);
  });
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

function withAnisotropy(mat) {
  if ('anisotropy' in mat) mat.anisotropy = maxAniso;
  return mat;
}

export function makeMaterial(kind, hex) {
  const color = new THREE.Color(hex);
  switch (kind) {
    case 'stainless': {
      const b = brushedMetalMaps();
      return withAnisotropy(new THREE.MeshPhysicalMaterial({
        color,
        metalness: 1.0,
        roughness: 0.28,
        bumpMap: b.bump,
        bumpScale: 0.25,
        roughnessMap: b.rough,
        envMapIntensity: 1.45,
        clearcoat: 0.25,
        clearcoatRoughness: 0.2
      }));
    }
    case 'copper': {
      const b = brushedMetalMaps();
      return withAnisotropy(new THREE.MeshPhysicalMaterial({
        color,
        metalness: 1.0,
        roughness: 0.3,
        bumpMap: b.bump,
        bumpScale: 0.3,
        roughnessMap: b.rough,
        clearcoat: 0.45,
        clearcoatRoughness: 0.35,
        envMapIntensity: 1.4
      }));
    }
    case 'black':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.65,
        roughness: 0.42,
        clearcoat: 0.6,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.95
      });
    case 'white':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.0,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.05
      });
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.0,
        roughness: 0.03,
        transmission: 1.0,
        thickness: 0.08,
        ior: 1.5,
        envMapIntensity: 1.9,
        specularIntensity: 1.0
      });
    case 'glassdark':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.2,
        roughness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.3
      });
    case 'alu': {
      const m = meshGridMaps();
      return withAnisotropy(new THREE.MeshStandardMaterial({
        color,
        metalness: 1.0,
        roughness: 0.45,
        map: m.map,
        bumpMap: m.bump,
        bumpScale: 0.4,
        envMapIntensity: 1.15
      }));
    }
    case 'carbon':
      return new THREE.MeshStandardMaterial({ color, metalness: 0.0, roughness: 0.96, map: noiseMap(0.12, 256) });
    case 'led':
      return new THREE.MeshBasicMaterial({ color });
    case 'window':
      return new THREE.MeshBasicMaterial({ color });
    case 'wall':
      return new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.95, map: noiseMap(0.05) });
    case 'stone': {
      const s = stoneMaps();
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 0.22,
        clearcoat: 0.4,
        clearcoatRoughness: 0.15,
        map: s.map,
        bumpMap: s.bump,
        bumpScale: 0.35
      });
    }
    case 'wood':
      return new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.7, map: noiseMap(0.1, 256) });
    case 'badge':
      return new THREE.MeshStandardMaterial({ color: '#d6d9de', map: badgeTexture(), metalness: 0.9, roughness: 0.35, envMapIntensity: 1.2 });
    case 'plastic':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex || '#1d1f24'),
        roughness: 0.45,
        metalness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.4
      });
    default:
      return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  }
}
