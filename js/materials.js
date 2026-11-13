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

function brushedMetalMap() {
  const key = 'brushed';
  if (texCache.has(key)) return texCache.get(key);
  const t = makeCanvas(512, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 2) {
      const v = 90 + Math.random() * 80;
      g.fillStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.35})`;
      g.fillRect(x, 0, 1, s);
    }
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, Math.random() * 30);
    }
  });
  texCache.set(key, t);
  return t;
}

function meshGridMaps() {
  const key = 'mesh';
  if (texCache.has(key)) return texCache.get(key);
  const cell = 10;
  const map = makeCanvas(256, (g, s) => {
    g.fillStyle = '#dfe2e8';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#565b64';
    for (let i = 0; i < s; i += cell) {
      g.fillRect(i, 0, 3, s);
      g.fillRect(0, i, s, 3);
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = makeCanvas(256, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#3c3c3c';
    for (let i = 0; i < s; i += cell) {
      g.fillRect(i, 0, 3, s);
      g.fillRect(0, i, s, 3);
    }
  });
  const set = { map, bump };
  texCache.set(key, set);
  return set;
}

function noiseMap(strength = 0.06) {
  const key = `noise-${strength}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = makeCanvas(256, (g, s) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 6000; i++) {
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
  const map = makeCanvas(512, (g, s) => {
    g.fillStyle = '#c9c6bf';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const v = 150 + Math.random() * 90;
      g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.12 + Math.random() * 0.2})`;
      g.beginPath();
      g.ellipse(Math.random() * s, Math.random() * s, 2 + Math.random() * 14, 1 + Math.random() * 8, Math.random() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(120,118,112,${0.08 + Math.random() * 0.1})`;
      g.lineWidth = 0.8 + Math.random();
      g.beginPath();
      const x = Math.random() * s;
      const y = Math.random() * s;
      g.moveTo(x, y);
      g.lineTo(x + 60 - Math.random() * 120, y + 40 - Math.random() * 80);
      g.stroke();
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = makeCanvas(256, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2200; i++) {
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

export function makeMaterial(kind, hex) {
  const color = new THREE.Color(hex);
  switch (kind) {
    case 'stainless':
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 1.0,
        roughness: 0.3,
        bumpMap: brushedMetalMap(),
        bumpScale: 0.3,
        envMapIntensity: 1.35
      });
    case 'copper':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 1.0,
        roughness: 0.32,
        bumpMap: brushedMetalMap(),
        bumpScale: 0.35,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
        envMapIntensity: 1.3
      });
    case 'black':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.65,
        roughness: 0.45,
        clearcoat: 0.5,
        clearcoatRoughness: 0.45,
        envMapIntensity: 0.9
      });
    case 'white':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.0,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.0
      });
    case 'glass':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.0,
        roughness: 0.05,
        transparent: true,
        opacity: 0.28,
        envMapIntensity: 1.7,
        depthWrite: false
      });
    case 'glassdark':
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.2,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.15,
        envMapIntensity: 1.2
      });
    case 'alu': {
      const m = meshGridMaps();
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 1.0,
        roughness: 0.5,
        map: m.map,
        bumpMap: m.bump,
        bumpScale: 0.5,
        envMapIntensity: 1.1
      });
    }
    case 'carbon':
      return new THREE.MeshStandardMaterial({ color, metalness: 0.0, roughness: 0.96 });
    case 'led':
      return new THREE.MeshBasicMaterial({ color });
    case 'wall':
      return new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.95, map: noiseMap(0.05) });
    case 'stone': {
      const s = stoneMaps();
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0,
        roughness: 0.24,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2,
        map: s.map,
        bumpMap: s.bump,
        bumpScale: 0.4
      });
    }
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
