export const FABRIC_COLORS = [
  { id: 'graphite', name: 'Grafit', hex: '#2e3138' },
  { id: 'black', name: 'Svart', hex: '#17181c' },
  { id: 'navy', name: 'Marinblå', hex: '#1f3a5f' },
  { id: 'forest', name: 'Skogsgrön', hex: '#2f4f3e' },
  { id: 'burgundy', name: 'Bordeaux', hex: '#6e2b3a', premium: true },
  { id: 'ochre', name: 'Ockra', hex: '#c98a2d', premium: true },
  { id: 'sand', name: 'Sand', hex: '#d8c9a3' },
  { id: 'sky', name: 'Himmel', hex: '#8fb6d9' },
  { id: 'coral', name: 'Korall', hex: '#e0655a', premium: true },
  { id: 'cream', name: 'Grädde', hex: '#f2ede2' }
];

export const METAL_COLORS = [
  { id: 'silver', name: 'Silver', hex: '#c9ced8' },
  { id: 'brass', name: 'Mässing', hex: '#b08d4f', premium: true },
  { id: 'gunmetal', name: 'Vapensvart', hex: '#26272c' }
];

export const MATERIALS = {
  canvas: { label: 'Vaxad bomullsduk', price: 0, desc: 'Matt, slitstark och väderbeständig duk' },
  nylon: { label: 'Teknisk nylon', price: 250, desc: 'Lätt, glatt och vattenavvisande' },
  leather: { label: 'Vegetabiliskt läder', price: 700, desc: 'Åldras vackert, patina och glans' },
  metal: { label: 'Metall', price: 0, desc: 'Blixtlås och beslag i metall' }
};

export const PREMIUM_COLOR_PRICE = 150;

export const SIZES = [
  { id: 's16', label: '16 L – Kompakt', volume: '16 L', scale: 0.86, price: 1295 },
  { id: 'm21', label: '21 L – Standard', volume: '21 L', scale: 1.0, price: 1595 },
  { id: 'l28', label: '28 L – Expedition', volume: '28 L', scale: 1.13, price: 1895 }
];

export const PARTS = [
  { id: 'body', label: 'Kropp', palette: 'fabric', materials: ['canvas', 'nylon', 'leather'], defaultMaterial: 'canvas', defaultColor: '#2e3138' },
  { id: 'pocket', label: 'Framficka', palette: 'fabric', materials: ['canvas', 'nylon', 'leather'], defaultMaterial: 'canvas', defaultColor: '#1f3a5f' },
  { id: 'bottom', label: 'Botten', palette: 'fabric', materials: ['canvas', 'leather'], defaultMaterial: 'leather', defaultColor: '#17181c' },
  { id: 'straps', label: 'Axelremmar', palette: 'fabric', materials: ['canvas', 'nylon'], defaultMaterial: 'canvas', defaultColor: '#17181c' },
  { id: 'handle', label: 'Handtag', palette: 'fabric', materials: ['leather', 'canvas'], defaultMaterial: 'leather', defaultColor: '#17181c' },
  { id: 'logo', label: 'Logotyp', palette: 'fabric', materials: ['metal'], defaultMaterial: 'metal', defaultColor: '#f2ede2' },
  { id: 'zipper', label: 'Blixtlås', palette: 'metal', materials: ['metal'], defaultMaterial: 'metal', defaultColor: '#c9ced8' }
];

export const ACCESSORIES = [
  { id: 'seatPad', label: 'Sittunderlag', price: 249, colorable: true, palette: 'fabric', defaultColor: '#d8c9a3' },
  { id: 'bottleHolder', label: 'Flaskhållare', price: 149, colorable: true, palette: 'fabric', defaultColor: '#2f4f3e' },
  { id: 'chestStrap', label: 'Bröstrem med spänne', price: 99, colorable: false },
  { id: 'keyRing', label: 'Nyckelring i läder', price: 79, colorable: false }
];

export const RULES = [
  {
    target: { kind: 'accessory', id: 'seatPad' },
    when: (s) => s.size !== 's16',
    msg: 'Sittunderlaget passar bara 21 L och 28 L – ryggsäcken blir för smal i 16 L.'
  },
  {
    target: { kind: 'partMaterial', part: 'pocket', material: 'leather' },
    when: (s) => s.size !== 's16',
    msg: 'Framficka i läder finns bara i 21 L och 28 L.'
  },
  {
    target: { kind: 'partMaterial', part: 'body', material: 'leather' },
    when: (s) => s.size !== 's16',
    msg: 'Helt kropp i läder finns bara i 21 L och 28 L.'
  },
  {
    target: { kind: 'partMaterial', part: 'handle', material: 'leather' },
    when: () => true,
    msg: ''
  }
];

export function paletteFor(kind) {
  return kind === 'metal' ? METAL_COLORS : FABRIC_COLORS;
}

export function colorName(hex) {
  if (!hex) return '';
  const all = [...FABRIC_COLORS, ...METAL_COLORS];
  const hit = all.find((c) => c.hex.toLowerCase() === String(hex).toLowerCase());
  return hit ? hit.name : hex;
}

export function isPremiumColor(hex) {
  const all = [...FABRIC_COLORS, ...METAL_COLORS];
  const hit = all.find((c) => c.hex.toLowerCase() === String(hex).toLowerCase());
  return !!(hit && hit.premium);
}

export function partDef(id) {
  return PARTS.find((p) => p.id === id);
}

export function accessoryDef(id) {
  return ACCESSORIES.find((a) => a.id === id);
}

export function sizeDef(id) {
  return SIZES.find((s) => s.id === id) || SIZES[1];
}

export function defaultState() {
  const parts = {};
  for (const p of PARTS) {
    parts[p.id] = { material: p.defaultMaterial, color: p.defaultColor };
  }
  const acc = {};
  const accColors = {};
  for (const a of ACCESSORIES) {
    acc[a.id] = false;
    if (a.colorable) accColors[a.id] = a.defaultColor;
  }
  return {
    v: 1,
    size: 'm21',
    parts,
    acc,
    accColors,
    quality: defaultQuality()
  };
}

export function defaultQuality() {
  return {
    preset: 'hog',
    renderScale: 1.5,
    shadowMap: 2048,
    shadowsEnabled: true,
    bloom: true,
    bloomStrength: 0.35,
    bloomRadius: 0.55,
    bloomThreshold: 0.82,
    ssao: true,
    ssaoRadius: 7,
    env: 'studio',
    envIntensity: 1.0,
    exposure: 1.05,
    toneMapping: 'aces',
    autoRotate: false
  };
}

export function targetKey(t) {
  if (t.kind === 'accessory') return `acc:${t.id}`;
  return `mat:${t.part}:${t.material}`;
}

export function ruleFor(state, target) {
  for (const r of RULES) {
    if (targetKey(r.target) === targetKey(target)) {
      if (!r.when(state)) return r;
    }
  }
  return null;
}

export function isTargetAllowed(state, target) {
  return ruleFor(state, target) === null;
}

export function violations(state) {
  const out = [];
  for (const a of ACCESSORIES) {
    const r = ruleFor(state, { kind: 'accessory', id: a.id });
    if (r && state.acc[a.id]) out.push({ target: r.target, msg: r.msg });
  }
  for (const p of PARTS) {
    for (const m of p.materials) {
      const r = ruleFor(state, { kind: 'partMaterial', part: p.id, material: m });
      if (r && state.parts[p.id].material === m) out.push({ target: r.target, msg: r.msg });
    }
  }
  return out;
}

export function enforceRules(state) {
  const changed = [];
  for (const a of ACCESSORIES) {
    const r = ruleFor(state, { kind: 'accessory', id: a.id });
    if (r && state.acc[a.id]) {
      state.acc[a.id] = false;
      changed.push({ target: r.target, msg: r.msg });
    }
  }
  for (const p of PARTS) {
    const cur = state.parts[p.id];
    const r = ruleFor(state, { kind: 'partMaterial', part: p.id, material: cur.material });
    if (r) {
      cur.material = p.materials.find((m) => isTargetAllowed({ ...state, parts: { ...state.parts, [p.id]: { ...cur, material: m } } }, { kind: 'partMaterial', part: p.id, material: m })) || p.materials[0];
      changed.push({ target: r.target, msg: r.msg });
    }
  }
  return changed;
}

export function computePrice(state) {
  const lines = [];
  const size = sizeDef(state.size);
  lines.push({ label: `Ryggsäck ${size.volume} (grundpris)`, amount: size.price });
  for (const p of PARTS) {
    const sel = state.parts[p.id];
    const mat = MATERIALS[sel.material];
    if (mat && mat.price > 0) {
      lines.push({ label: `${p.label} – ${mat.label}`, amount: mat.price });
    }
    if (isPremiumColor(sel.color) && p.palette === 'fabric') {
      lines.push({ label: `${p.label} – premiumfärg ${colorName(sel.color)}`, amount: PREMIUM_COLOR_PRICE });
    }
    if (isPremiumColor(sel.color) && p.palette === 'metal') {
      lines.push({ label: `${p.label} – ${colorName(sel.color)}`, amount: PREMIUM_COLOR_PRICE });
    }
  }
  for (const a of ACCESSORIES) {
    if (state.acc[a.id]) {
      lines.push({ label: a.label, amount: a.price });
    }
  }
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, total };
}

export function summarize(state) {
  const size = sizeDef(state.size);
  const rows = [`Storlek: ${size.label}`];
  for (const p of PARTS) {
    const sel = state.parts[p.id];
    rows.push(`${p.label}: ${MATERIALS[sel.material].label}, ${colorName(sel.color)}`);
  }
  const on = ACCESSORIES.filter((a) => state.acc[a.id]);
  if (on.length) {
    rows.push('Tillval: ' + on.map((a) => (a.colorable ? `${a.label} (${colorName(state.accColors[a.id])})` : a.label)).join(', '));
  } else {
    rows.push('Tillval: inga');
  }
  const price = computePrice(state);
  rows.push(`Totalt: ${price.total.toLocaleString('sv-SE')} kr`);
  return rows.join('\n');
}

export function sanitizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const out = defaultState();
  if (SIZES.some((s) => s.id === raw.size)) out.size = raw.size;
  if (raw.parts && typeof raw.parts === 'object') {
    for (const p of PARTS) {
      const sel = raw.parts[p.id];
      if (!sel) continue;
      if (p.materials.includes(sel.material)) out.parts[p.id].material = sel.material;
      if (typeof sel.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(sel.color)) out.parts[p.id].color = sel.color;
    }
  }
  if (raw.acc && typeof raw.acc === 'object') {
    for (const a of ACCESSORIES) {
      if (typeof raw.acc[a.id] === 'boolean') out.acc[a.id] = raw.acc[a.id];
    }
  }
  if (raw.accColors && typeof raw.accColors === 'object') {
    for (const a of ACCESSORIES) {
      if (a.colorable && typeof raw.accColors[a.id] === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.accColors[a.id])) {
        out.accColors[a.id] = raw.accColors[a.id];
      }
    }
  }
  if (raw.quality && typeof raw.quality === 'object') {
    out.quality = { ...defaultQuality(), ...raw.quality };
  }
  enforceRules(out);
  return out;
}

export function encodeState(state) {
  const json = JSON.stringify(state);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeState(str) {
  try {
    const json = decodeURIComponent(escape(atob(str)));
    return sanitizeState(JSON.parse(json));
  } catch (e) {
    return null;
  }
}
