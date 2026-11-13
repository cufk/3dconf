import {
  PARTS, ACCESSORIES, SIZES, MATERIALS,
  paletteFor, colorName, partDef, accessoryDef, sizeDef,
  ruleFor, targetKey, computePrice
} from './config.js';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function section(title, idx, open = true) {
  const s = el(`<section class="section${open ? '' : ' collapsed'}"><header><span>${idx} · ${title}</span><span class="chev">▼</span></header><div class="body"></div></section>`);
  s.querySelector('header').addEventListener('click', () => s.classList.toggle('collapsed'));
  return s;
}

function swatch(hex, action, scope, extra = '') {
  return `<button class="swatch" data-action="${action}" data-${scope}-hex="${hex}" style="background:${hex}" title="${colorName(hex)}" ${extra}></button>`;
}

export function createUI(root, handlers, presets) {
  root.innerHTML = '';

  const secSize = section('Bredd', '01');
  const sizeSeg = el(`<div class="seg" data-role="sizes"></div>`);
  for (const s of SIZES) {
    const b = el(`<button data-action="size" data-id="${s.id}">${s.label} · ${s.price.toLocaleString('sv-SE')} kr</button>`);
    sizeSeg.appendChild(b);
  }
  secSize.querySelector('.body').appendChild(sizeSeg);
  root.appendChild(secSize);

  const secParts = section('Ytor & material', '02');
  const partsBody = secParts.querySelector('.body');
  for (const p of PARTS) {
    const palette = paletteFor(p.palette);
    const matButtons = p.materials
      .map((m) => `<button data-action="mat" data-part="${p.id}" data-mat="${m}" title="${MATERIALS[m].desc}${MATERIALS[m].price ? ` (+${MATERIALS[m].price} kr)` : ''}">${MATERIALS[m].label}</button>`)
      .join('');
    const swatches = p.locked
      ? ''
      : `<div class="swatches" data-role="sw-${p.id}">
          ${palette.map((c) => swatch(c.hex, 'color', 'part', `data-part="${p.id}"`)).join('')}
          <button class="swatch custom" data-action="custom" data-part="${p.id}" title="Egen färg…"><input type="color" data-action="customcolor" data-part="${p.id}" value="#888888"></button>
        </div>`;
    const row = el(`
      <div class="row" data-part-row="${p.id}">
        <div class="row-label"><span>${p.label}</span><span class="val" data-role="colorname-${p.id}"></span></div>
        ${p.materials.length > 1 ? `<div class="seg" data-role="mats-${p.id}" style="margin-bottom:7px">${matButtons}</div>` : ''}
        ${swatches}
        <div data-role="note-${p.id}"></div>
      </div>`);
    partsBody.appendChild(row);
  }
  root.appendChild(secParts);

  const secAcc = section('Tillval', '03');
  const accBody = secAcc.querySelector('.body');
  for (const a of ACCESSORIES) {
    const row = el(`
      <div class="row" data-acc-row="${a.id}">
        <label class="check" data-role="check-${a.id}">
          <input type="checkbox" data-action="acc" data-id="${a.id}">
          <span>${a.label}</span>
          <span class="price">+${a.price} kr</span>
        </label>
        ${a.colorable ? `
        <div class="swatches" data-role="sw-acc-${a.id}" style="margin:6px 0 2px 4px">
          ${paletteFor(a.palette).map((c) => swatch(c.hex, 'acccolor', 'acc', `data-acc-id="${a.id}"`)).join('')}
          <button class="swatch custom" data-action="custom" data-acc-id="${a.id}" title="Egen färg…"><input type="color" data-action="acccustom" data-acc-id="${a.id}" value="#888888"></button>
        </div>` : ''}
        <div data-role="note-acc-${a.id}"></div>
      </div>`);
    accBody.appendChild(row);
  }
  root.appendChild(secAcc);

  const secQ = section('Renderingskvalitet', '04', false);
  const qBody = secQ.querySelector('.body');
  const presetSeg = el(`<div class="seg" data-role="presets" style="margin-bottom:12px"></div>`);
  for (const [id, p] of Object.entries(presets)) {
    presetSeg.appendChild(el(`<button data-action="preset" data-id="${id}">${p.label}</button>`));
  }
  qBody.appendChild(el(`<div class="row"><div class="row-label"><span>Förinställning</span></div></div>`));
  qBody.appendChild(presetSeg);

  const sliderRow = (label, key, min, max, step, fmt) => `
    <div class="row">
      <div class="row-label"><span>${label}</span><span class="val" data-role="qv-${key}"></span></div>
      <input type="range" data-action="q" data-key="${key}" min="${min}" max="${max}" step="${step}" data-fmt="${fmt || ''}">
    </div>`;
  const selectRow = (label, key, options) => `
    <div class="row">
      <div class="row-label"><span>${label}</span></div>
      <select data-action="qsel" data-key="${key}">
        ${options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>`;
  const checkRow = (label, key) => `
    <div class="row">
      <label class="check"><input type="checkbox" data-action="qcheck" data-key="${key}"><span>${label}</span></label>
    </div>`;

  qBody.appendChild(el(`
    ${sliderRow('Upplösning (supersampling)', 'renderScale', 0.5, 3, 0.05, 'x')}
    ${selectRow('Skuggkvalitet', 'shadowMap', [[1024, 'Låg – 1024'], [2048, 'Medel – 2048'], [4096, 'Hög – 4096']])}
    ${selectRow('Skuggtyp', 'shadowType', [['pcfsoft', 'Mjuk (PCFSoft)'], ['vsm', 'Extra mjuk (VSM)']])}
    ${checkRow('Skuggor på', 'shadowsEnabled')}
    ${checkRow('Bloom (glöd i högdagrar)', 'bloom')}
    ${sliderRow('Bloom-styrka', 'bloomStrength', 0, 1.5, 0.05, '')}
    ${sliderRow('Bloom-radie', 'bloomRadius', 0, 1.2, 0.05, '')}
    ${checkRow('SSAO (kontaktskuggor i skrymslen)', 'ssao')}
    ${sliderRow('SSAO-radie', 'ssaoRadius', 1, 14, 0.5, '')}
    ${checkRow('Skärpedjup (DOF) – fokus följer kameran', 'dof')}
    ${sliderRow('Bländare (DOF)', 'dofAperture', 0, 0.002, 0.00005, '')}
    ${sliderRow('Max oskärpa (DOF)', 'dofMaxblur', 0, 0.03, 0.0005, '')}
    ${checkRow('FXAA kantutjämning (bra vid låg upplösning)', 'fxaa')}
    ${sliderRow('Vignett', 'vignette', 0, 1, 0.01, '')}
    ${sliderRow('Filmgranularitet', 'grain', 0, 0.05, 0.001, '')}
    ${selectRow('Ljusmiljö (IBL)', 'env', [['kokdag', 'Kök – dagsljus'], ['kokkvall', 'Kök – kväll (varm belysning)'], ['studio', 'Fotostudio']])}
    ${sliderRow('Miljöintensitet', 'envIntensity', 0, 2, 0.05, 'x')}
    ${sliderRow('Exponering', 'exposure', 0.5, 1.6, 0.01, '')}
    ${selectRow('Tonmappning', 'toneMapping', [['aces', 'ACES Filmic (rekommenderas)'], ['neutral', 'Neutral'], ['none', 'Av']])}
    ${checkRow('Autorotera modellen', 'autoRotate')}
    <div class="row" style="margin-top:12px">
      <div class="row-label"><span>Exportera stillbild</span></div>
      <div class="btn-row">
        <button class="btn" data-action="export" data-px="2048">PNG 2K</button>
        <button class="btn" data-action="export" data-px="4096">PNG 4K</button>
      </div>
    </div>
  `));
  root.appendChild(secQ);

  const secSum = section('Sammanfattning & offert', '05');
  const sumBody = secSum.querySelector('.body');
  sumBody.appendChild(el(`
    <div class="summary-lines" data-role="summary"></div>
    <div class="btn-row">
      <button class="btn" data-action="share">Kopiera delbar länk</button>
      <button class="btn" data-action="save">Spara lokalt</button>
    </div>
    <div class="btn-row">
      <button class="btn" data-action="json">Ladda ner konfiguration (JSON)</button>
    </div>
    <button class="btn primary block" data-action="quote">Skicka offert →</button>
  `));
  root.appendChild(secSum);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    const a = b.dataset.action;
    if (a === 'size') handlers.onSize(b.dataset.id);
    else if (a === 'mat') handlers.onPartMaterial(b.dataset.part, b.dataset.mat);
    else if (a === 'color') handlers.onPartColor(b.dataset.part, b.dataset.partHex);
    else if (a === 'acccolor') handlers.onAccColor(b.dataset.accId, b.dataset.accHex);
    else if (a === 'acc') handlers.onAccToggle(b.dataset.id);
    else if (a === 'preset') handlers.onPreset(b.dataset.id);
    else if (a === 'export') handlers.onExportPNG(Number(b.dataset.px));
    else if (a === 'share') handlers.onShare();
    else if (a === 'save') handlers.onSaveLocal();
    else if (a === 'json') handlers.onDownloadJSON();
    else if (a === 'quote') handlers.onQuote();
  });

  root.addEventListener('change', (e) => {
    const t = e.target;
    const a = t.dataset.action;
    if (!t.dataset || !a) return;
    if (a === 'acc') handlers.onAccToggle(t.dataset.id);
    else if (a === 'customcolor') handlers.onPartColor(t.dataset.part, t.value);
    else if (a === 'acccustom') handlers.onAccColor(t.dataset.accId, t.value);
    else if (a === 'q') handlers.onQualityPatch({ [t.dataset.key]: Number(t.value) });
    else if (a === 'qsel') handlers.onQualityPatch({ [t.dataset.key]: isNaN(Number(t.value)) ? t.value : Number(t.value) });
    else if (a === 'qcheck') handlers.onQualityPatch({ [t.dataset.key]: t.checked });
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.action === 'q') {
      handlers.onQualityPatch({ [t.dataset.key]: Number(t.value) }, true);
    }
  });

  function fmtVal(key, v) {
    if (key === 'renderScale' || key === 'envIntensity') return `${v}x`;
    if (key === 'exposure' || key === 'vignette') return v.toFixed(2);
    if (key === 'dofAperture') return v.toFixed(5);
    if (key === 'dofMaxblur' || key === 'grain') return v.toFixed(3);
    return String(v);
  }

  function setNote(role, msg) {
    const n = root.querySelector(`[data-role="${role}"]`);
    if (n) n.innerHTML = msg ? `<div class="rule-note">⚠ ${msg}</div>` : '';
  }

  function update(state, ctx) {
    for (const s of SIZES) {
      const b = root.querySelector(`[data-action="size"][data-id="${s.id}"]`);
      if (b) b.classList.toggle('active', state.size === s.id);
    }

    for (const p of PARTS) {
      const sel = state.parts[p.id];
      const matsBox = root.querySelector(`[data-role="mats-${p.id}"]`);
      if (matsBox) {
        for (const btn of matsBox.querySelectorAll('button')) {
          const m = btn.dataset.mat;
          btn.classList.toggle('active', sel.material === m);
          const rule = ruleFor(state, { kind: 'partMaterial', part: p.id, material: m });
          btn.disabled = !!rule;
          btn.title = rule ? rule.msg : (MATERIALS[m].desc || '');
        }
      }
      const swBox = root.querySelector(`[data-role="sw-${p.id}"]`);
      if (swBox) {
        for (const sw of swBox.querySelectorAll('.swatch[data-action="color"]')) {
          sw.classList.toggle('active', sw.dataset.partHex.toLowerCase() === sel.color.toLowerCase());
        }
      }
      const cn = root.querySelector(`[data-role="colorname-${p.id}"]`);
      if (cn) cn.textContent = p.locked ? MATERIALS[sel.material].label : colorName(sel.color);
      const rule = ruleFor(state, { kind: 'partMaterial', part: p.id, material: sel.material });
      setNote(`note-${p.id}`, rule ? rule.msg : '');
    }

    for (const a of ACCESSORIES) {
      const cb = root.querySelector(`input[data-action="acc"][data-id="${a.id}"]`);
      const label = root.querySelector(`[data-role="check-${a.id}"]`);
      const on = !!state.acc[a.id];
      if (cb && document.activeElement !== cb) cb.checked = on;
      const rule = ruleFor(state, { kind: 'accessory', id: a.id });
      if (label) label.classList.toggle('disabled', !!rule);
      if (cb) cb.disabled = !!rule;
      setNote(`note-acc-${a.id}`, rule ? rule.msg : '');
      if (a.colorable) {
        const swBox = root.querySelector(`[data-role="sw-acc-${a.id}"]`);
        if (swBox) {
          for (const sw of swBox.querySelectorAll('.swatch[data-action="acccolor"]')) {
            sw.classList.toggle('active', sw.dataset.accHex.toLowerCase() === (state.accColors[a.id] || '').toLowerCase());
          }
        }
      }
    }

    for (const [id, p] of Object.entries(presets)) {
      const b = root.querySelector(`[data-action="preset"][data-id="${id}"]`);
      if (b) b.classList.toggle('active', ctx.quality.preset === id);
    }
    const q = ctx.quality;
    for (const input of root.querySelectorAll('input[data-action="q"]')) {
      const key = input.dataset.key;
      if (document.activeElement !== input) input.value = q[key];
      const val = root.querySelector(`[data-role="qv-${key}"]`);
      if (val) val.textContent = fmtVal(key, q[key]);
    }
    for (const sel of root.querySelectorAll('select[data-action="qsel"]')) {
      const key = sel.dataset.key;
      if (document.activeElement !== sel) sel.value = String(q[key]);
    }
    for (const cb of root.querySelectorAll('input[data-action="qcheck"]')) {
      const key = cb.dataset.key;
      if (document.activeElement !== cb) cb.checked = !!q[key];
    }

    const price = computePrice(state);
    const sum = root.querySelector('[data-role="summary"]');
    sum.innerHTML =
      price.lines.map((l) => `<div class="line"><span>${l.label}</span><span>${l.amount.toLocaleString('sv-SE')} kr</span></div>`).join('') +
      `<div class="line total"><span>Totalt</span><span>${price.total.toLocaleString('sv-SE')} kr</span></div>`;

    const badge = document.getElementById('price-badge');
    badge.textContent = `${price.total.toLocaleString('sv-SE')} kr`;
  }

  return { update };
}
