export const PRODUCT_NAME = 'Vägghängd köksfläkt';

export const FINISH_COLORS = [
  { id: 'stainless', name: 'Rostfritt stål', hex: '#c9ced4' },
  { id: 'black', name: 'Matt svart', hex: '#1b1c20' },
  { id: 'white', name: 'Högblank vit', hex: '#f2f3ef' },
  { id: 'copper', name: 'Koppar', hex: '#b87333', premium: true }
];

export const LED_COLORS = [
  { id: 'varm', name: 'Varmvitt 2700K', hex: '#ffd9a0' },
  { id: 'kall', name: 'Kallvitt 4000K', hex: '#d6e6ff' },
  { id: 'av', name: 'Av', hex: '#26282e' }
];

export const LED_OFF_HEX = '#26282e';

const PALETTES = {
  finish: FINISH_COLORS,
  led: LED_COLORS
};

export const MATERIALS = {
  stainless: { label: 'Rostfritt stål', price: 0, color: '#c9ced4', desc: 'Borstat rostfritt stål, klassisk kökslook' },
  black: { label: 'Matt svart', price: 350, color: '#1b1c20', desc: 'Matt svartlackerad metall' },
  white: { label: 'Högblank vit', price: 350, color: '#f2f3ef', desc: 'Högblank vitlackerad yta' },
  copper: { label: 'Koppar', price: 1400, color: '#b87333', desc: 'Solid koppar som åldras vackert' },
  alu: { label: 'Aluminiumfilter', price: 0, color: '#a8adb5', desc: 'Metallnät, diskmaskinståligt' },
  carbon: { label: 'Kolfilter', price: 250, color: '#26262a', desc: 'Aktivt kolfilter för recirkulation' },
  glassdark: { label: 'Svart kontrollglas', price: 0, color: '#141519', desc: 'Härdat svart glas med touchknappar' },
  led: { label: 'LED-belysning', price: 199, color: '#ffd9a0', desc: 'Justerbar LED under kåpan' }
};

export const PREMIUM_COLOR_PRICE = 150;

export const SIZES = [
  { id: 'w60', label: '60 cm', volume: '60 cm', width: 6.0, scale: 1.0, price: 2995 },
  { id: 'w70', label: '70 cm', volume: '70 cm', width: 7.0, scale: 1.0, price: 3495 },
  { id: 'w90', label: '90 cm', volume: '90 cm', width: 9.0, scale: 1.0, price: 4295 }
];

export const PARTS = [
  { id: 'canopy', label: 'Kåpa', materials: ['stainless', 'black', 'white', 'copper'], locked: true, defaultMaterial: 'stainless', defaultColor: '#c9ced4' },
  { id: 'chimney', label: 'Skorsten', materials: ['stainless', 'black', 'white'], locked: true, defaultMaterial: 'stainless', defaultColor: '#c9ced4' },
  { id: 'filter', label: 'Fettfilter', materials: ['alu', 'carbon'], locked: true, defaultMaterial: 'alu', defaultColor: '#a8adb5' },
  { id: 'controls', label: 'Kontrollpanel', materials: ['glassdark'], locked: true, defaultMaterial: 'glassdark', defaultColor: '#141519' },
  { id: 'led', label: 'Belysning', materials: ['led'], locked: false, palette: 'led', defaultMaterial: 'led', defaultColor: '#ffd9a0' }
];

export const ACCESSORIES = [
  { id: 'glasfront', label: 'Glasfront i härdat glas', price: 599, colorable: false },
  { id: 'chimneyExt', label: 'Skorstensförlängning 50 cm', price: 399, colorable: false },
  { id: 'mountRail', label: 'Monteringsskena i stål', price: 149, colorable: false }
];

export const RULES = [
  {
    target: { kind: 'partMaterial', part: 'canopy', material: 'copper' },
    when: (s) => s.size !== 'w60',
    msg: 'Kåpa i koppar finns bara i 70 och 90 cm – 60 cm klarar inte vikten.'
  },
  {
    target: { kind: 'accessory', id: 'glasfront' },
    when: (s) => s.size !== 'w60',
    msg: 'Glasfront finns bara i 70 och 90 cm.'
  },
  {
    target: { kind: 'partMaterial', part: 'chimney', material: 'white' },
    when: (s) => ['white', 'black'].includes(s.parts.canopy.material),
    msg: 'Vitlackerad skorsten passar bara ihop med vit eller svart kåpa.'
  },
  {
    target: { kind: 'partMaterial', part: 'filter', material: 'carbon' },
    when: (s) => s.parts.canopy.material !== 'copper',
    msg: 'Kolfilter monteras inte i kombination med koppar-kåpa.'
  }
];

export function paletteFor(kind) {
  return PALETTES[kind] || FINISH_COLORS;
}

export function allColors() {
  return Object.values(PALETTES).flat();
}

export function colorName(hex) {
  if (!hex) return '';
  const hit = allColors().find((c) => c.hex.toLowerCase() === String(hex).toLowerCase());
  return hit ? hit.name : hex;
}

export function isPremiumColor(hex) {
  const hit = allColors().find((c) => c.hex.toLowerCase() === String(hex).toLowerCase());
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
    size: 'w70',
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
    shadowType: 'pcfsoft',
    bloom: true,
    bloomStrength: 0.3,
    bloomRadius: 0.55,
    bloomThreshold: 0.85,
    ssao: true,
    ssaoRadius: 7,
    dof: false,
    dofAperture: 0.00035,
    dofMaxblur: 0.01,
    fxaa: false,
    vignette: 0.32,
    grain: 0.008,
    env: 'kokdag',
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
      const candidate = p.materials.find((m) => {
        const test = { ...state, parts: { ...state.parts, [p.id]: { ...cur, material: m } } };
        return isTargetAllowed(test, { kind: 'partMaterial', part: p.id, material: m });
      });
      cur.material = candidate || p.materials[0];
      changed.push({ target: r.target, msg: r.msg });
    }
  }
  return changed;
}

export function computePrice(state) {
  const lines = [];
  const size = sizeDef(state.size);
  lines.push({ label: `${PRODUCT_NAME} ${size.volume} (grundpris)`, amount: size.price });
  for (const p of PARTS) {
    const sel = state.parts[p.id];
    const mat = MATERIALS[sel.material];
    if (mat && mat.price > 0) {
      lines.push({ label: `${p.label} – ${mat.label}`, amount: mat.price });
    }
    if (isPremiumColor(sel.color)) {
      lines.push({ label: `${p.label} – premiumfärg ${colorName(sel.color)}`, amount: PREMIUM_COLOR_PRICE });
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
  const rows = [`Produkt: ${PRODUCT_NAME} ${size.volume}`];
  for (const p of PARTS) {
    const sel = state.parts[p.id];
    rows.push(`${p.label}: ${MATERIALS[sel.material].label}${p.locked ? '' : `, ${colorName(sel.color)}`}`);
  }
  const on = ACCESSORIES.filter((a) => state.acc[a.id]);
  rows.push('Tillval: ' + (on.length ? on.map((a) => a.label).join(', ') : 'inga'));
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
