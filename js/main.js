import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  defaultState, sanitizeState, encodeState, decodeState,
  computePrice, summarize, enforceRules, sizeDef,
  partDef, MATERIALS, PRODUCT_NAME
} from './config.js';
import { createProduct } from './product.js';
import { createQualityManager, QUALITY_PRESETS } from './quality.js';
import { createUI } from './ui.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
camera.position.set(8, 11.5, 9.5);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 9.8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 5;
controls.maxDistance = 32;
controls.maxPolarAngle = 1.62;
controls.autoRotateSpeed = 1.0;

const hemi = new THREE.HemisphereLight(0xbfd0e8, 0x2a2620, 0.32);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(-7, 17, 6);
keyLight.castShadow = true;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 24;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.camera.near = 2;
keyLight.shadow.camera.far = 45;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9db8ff, 0.7);
rimLight.position.set(7, 8, -7);
scene.add(rimLight);

const product = createProduct();

const quality = createQualityManager(renderer, scene, camera, keyLight);

let state = loadInitialState();

function loadInitialState() {
  const hash = location.hash.replace(/^#cfg=/, '');
  if (hash) {
    const s = decodeState(hash);
    if (s) return s;
  }
  try {
    const saved = localStorage.getItem('3dconfig-state');
    if (saved) {
      const s = sanitizeState(JSON.parse(saved));
      if (s) return s;
    }
  } catch (e) { /* ignore */ }
  return defaultState();
}

const tweens = [];

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

const fx = {
  tweenColor(material, hex) {
    if (!material || !material.color) return;
    const to = new THREE.Color(hex);
    if (material.color.equals(to)) return;
    tweens.push({ type: 'color', material, from: material.color.clone(), to, t: 0, dur: 0.35, ease: easeOutCubic });
  },
  lerpScale(obj, s) {
    tweens.push({ type: 'scale', obj, from: obj.scale.x, to: s, t: 0, dur: 0.5, ease: easeOutCubic });
  },
  pop(obj) {
    obj.visible = true;
    obj.scale.setScalar(0.01);
    tweens.push({ type: 'scaleObj', obj, from: 0.01, to: 1, t: 0, dur: 0.45, ease: easeOutBack });
  }
};

function applyStateToModel() {
  product.apply(state, fx);
  const g = product.getGroup();
  if (g && g.parent !== scene) scene.add(g);
}

function persist() {
  try {
    localStorage.setItem('3dconfig-state', JSON.stringify(state));
  } catch (e) { /* ignore */ }
  history.replaceState(null, '', `#cfg=${encodeState(state)}`);
}

function refreshUI() {
  ui.update(state, { quality: quality.state });
}

function currentShareURL() {
  return `${location.origin}${location.pathname}#cfg=${encodeState(state)}`;
}

function commit(changedRules) {
  enforceRules(state);
  applyStateToModel();
  persist();
  refreshUI();
  if (changedRules && changedRules.length) {
    toast(`Regel: ${changedRules[0].msg}`);
  }
}

let toastTimer = null;
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);background:#2a2f3b;border:1px solid #3a4150;color:#e8ebf0;padding:9px 16px;border-radius:10px;font-size:13px;z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .3s;opacity:0;pointer-events:none;max-width:80vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 3200);
}

const ui = createUI(document.getElementById('panel-sections'), {
  onSize(id) {
    const before = JSON.stringify(state);
    state.size = id;
    const changed = enforceRules(state);
    applyStateToModel();
    persist();
    refreshUI();
    if (JSON.stringify(state) !== before) {
      toast(changed.length ? `Regel: ${changed[0].msg}` : 'Bredd ändrad');
    }
  },
  onPartMaterial(part, mat) {
    state.parts[part].material = mat;
    const def = partDef(part);
    if (def && def.locked && MATERIALS[mat]) {
      state.parts[part].color = MATERIALS[mat].color;
    }
    commit();
  },
  onPartColor(part, hex) {
    state.parts[part].color = hex;
    commit();
  },
  onAccToggle(id) {
    state.acc[id] = !state.acc[id];
    commit();
  },
  onAccColor(id, hex) {
    state.accColors[id] = hex;
    commit();
  },
  onQualityPatch(patch, live) {
    quality.applyPatch(patch);
    product.setEnvTint(quality.state.env);
    if (!live) persist();
    refreshUI();
  },
  onPreset(name) {
    quality.setFromPreset(name);
    persist();
    refreshUI();
    toast(`Kvalitetsförinställning: ${QUALITY_PRESETS[name].label}`);
  },
  onExportPNG(px) {
    exportPNG(px);
  },
  onShare() {
    const url = currentShareURL();
    copyText(url).then((ok) => toast(ok ? 'Delbar länk kopierad till urklipp' : url));
  },
  onSaveLocal() {
    persist();
    toast('Konfiguration sparad lokalt i webbläsaren');
  },
  onDownloadJSON() {
    const price = computePrice(state);
    const payload = {
      produkt: PRODUCT_NAME,
      konfiguration: state,
      sammanfattning: summarize(state).split('\n'),
      pris: { linjer: price.lines, totalt: price.total, valuta: 'SEK' },
      delbar_lank: currentShareURL()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, '3dconfig-konfiguration.json');
  },
  onQuote() {
    openQuoteModal();
  }
}, QUALITY_PRESETS);

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

function exportPNG(targetWidth) {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  const scale = targetWidth / cssW;
  const prevPR = renderer.getPixelRatio();
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(cssW * scale), Math.round(cssH * scale), false);
  quality.setSize(Math.round(cssW * scale), Math.round(cssH * scale));
  quality.render();
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `3dconfig-${targetWidth}px.png`);
    renderer.setPixelRatio(prevPR);
    renderer.setSize(cssW, cssH, false);
    const s = renderer.getSize(new THREE.Vector2());
    quality.setSize(s.x, s.y);
    toast(`Bild exporterad (${targetWidth}px bred)`);
  }, 'image/png');
}

const modalBackdrop = document.getElementById('modal-backdrop');
const modalBody = document.getElementById('modal-body');

function openQuoteModal() {
  const price = computePrice(state);
  const size = sizeDef(state.size);
  modalBody.innerHTML = `
    <div><strong>Offertförfrågan – ${PRODUCT_NAME}</strong></div>
    <div class="muted">Genererad ${new Date().toLocaleString('sv-SE')} · 3DConfig</div>
    <div style="height:10px"></div>
    <div>${summarize(state).split('\n').join('<br>')}</div>
    <div style="height:10px"></div>
    <div><strong>Totalt: ${price.total.toLocaleString('sv-SE')} kr</strong> (${size.volume}, inkl. tillval och ytfinish)</div>
    <div class="muted" style="margin-top:10px">Delbar länk till denna konfiguration:<br>${currentShareURL()}</div>
  `;
  modalBackdrop.hidden = false;
  document.getElementById('modal-copy').onclick = async () => {
    const text = `Offertförfrågan – ${PRODUCT_NAME}\n${summarize(state)}\nTotalt: ${price.total.toLocaleString('sv-SE')} kr\nLänk: ${currentShareURL()}`;
    const ok = await copyText(text);
    toast(ok ? 'Offert kopierad till urklipp' : 'Kunde inte kopiera');
  };
}

document.getElementById('modal-close').addEventListener('click', () => { modalBackdrop.hidden = true; });
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) modalBackdrop.hidden = true; });
document.getElementById('btn-quote').addEventListener('click', openQuoteModal);

const btnMenu = document.getElementById('btn-menu');
btnMenu.addEventListener('click', () => document.body.classList.toggle('panel-open'));

window.addEventListener('hashchange', () => {
  const hash = location.hash.replace(/^#cfg=/, '');
  if (!hash) return;
  const s = decodeState(hash);
  if (s) {
    state = s;
    quality.applyPatch(state.quality);
    product.setEnvTint(quality.state.env);
    commit();
  }
});

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  const size = renderer.getSize(new THREE.Vector2());
  quality.setSize(size.x, size.y);
}
window.addEventListener('resize', resize);
resize();

quality.applyPatch(state.quality);
commit();
product.setEnvTint(quality.state.env);

let last = performance.now();
let frames = 0;
let fpsTime = last;
const fpsChip = document.getElementById('fps-chip');

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt / tw.dur;
    const k = tw.ease(Math.min(1, tw.t));
    if (tw.type === 'color') {
      tw.material.color.lerpColors(tw.from, tw.to, k);
    } else if (tw.type === 'scale') {
      tw.obj.scale.setScalar(tw.from + (tw.to - tw.from) * k);
    } else if (tw.type === 'scaleObj') {
      tw.obj.scale.setScalar(tw.from + (tw.to - tw.from) * k);
    }
    if (tw.t >= 1) tweens.splice(i, 1);
  }

  controls.autoRotate = quality.state.autoRotate;
  controls.update();
  quality.setFocus(camera.position.distanceTo(controls.target));
  quality.render();

  frames++;
  if (now - fpsTime > 1000) {
    const fps = Math.round((frames * 1000) / (now - fpsTime));
    fpsChip.textContent = `${fps} FPS · ${quality.state.preset} · ${renderer.getPixelRatio().toFixed(2)}x`;
    frames = 0;
    fpsTime = now;
  }
}
requestAnimationFrame(animate);
