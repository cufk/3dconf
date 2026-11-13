import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import { createReadStream, existsSync, statSync, readdirSync } from 'node:fs';
import { extname, join, normalize, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

register('./loader.mjs', import.meta.url);

const root = normalize(fileURLToPath(new URL('..', import.meta.url))).replace(/[/\\]+$/, '');

function listJs(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listJs(p));
    else if (e.name.endsWith('.js') || e.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

test('syntax: alla JS-filer passerar node --check', () => {
  const files = [...listJs(join(root, 'js')), ...listJs(join(root, 'tests')), join(root, 'scripts', 'serve.mjs')];
  assert.ok(files.length >= 8, 'hittade för få JS-filer');
  for (const f of files) {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  }
});

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function startServer() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (p === '/') p = '/index.html';
    const file = normalize(join(root, p));
    if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function get(port, p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: p }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => resolve({ code: r.statusCode, body: d }));
    }).on('error', reject);
  });
}

let server;
let port;

before(async () => {
  ({ server, port } = await startServer());
});

after(() => server.close());

test('tillgångar: index.html + alla lokala resurser + hela import-kedjan svarar 200', async () => {
  const html = (await get(port, '/index.html')).body;
  assert.ok(html.includes('3DConfig'), 'index.html saknar appnamnet 3DConfig');
  const norm = (p) => posix.normalize(p.startsWith('/') ? p : '/' + p.replace(/^\./, ''));
  const refs = [...html.matchAll(/(?:src|href)="(\.[^"]+)"/g)].map((m) => norm(m[1]));
  const seen = new Set(refs);
  const queue = [...refs];
  const importRe = /from\s+'([^']+)'/g;
  while (queue.length) {
    const p = queue.shift();
    const r = await get(port, p);
    assert.equal(r.code, 200, `saknas: ${p}`);
    if (p.endsWith('.js') || p.endsWith('.mjs')) {
      for (const m of r.body.matchAll(importRe)) {
        let dep = m[1];
        if (dep.startsWith('three/addons/')) dep = '/vendor/three/addons/' + dep.slice('three/addons/'.length);
        else if (dep === 'three') dep = '/vendor/three/three.module.js';
        else if (dep.startsWith('.')) dep = posix.resolve(posix.dirname(p), dep);
        if (!seen.has(dep)) {
          seen.add(dep);
          queue.push(dep);
        }
      }
    }
  }
  assert.ok(seen.size >= 20, `för få tillgångar lösta (${seen.size})`);
});

test('vendor: three.module.js laddar headless och bygger geometri', async () => {
  const THREE = await import('../vendor/three/three.module.js');
  assert.equal(THREE.REVISION, '170');
  const box = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 0)]);
  const tube = new THREE.TubeGeometry(curve, 8, 0.1, 6);
  const inst = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial(), 5);
  assert.ok(box.attributes.position.count > 0);
  assert.ok(cyl.attributes.position.count > 0);
  assert.ok(tube.attributes.position.count > 0);
  assert.equal(inst.count, 5);
});

function stubDocument() {
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => undefined;
    },
    set() { return true; }
  });
  globalThis.document = {
    createElement: (tag) => (tag === 'canvas' ? { width: 0, height: 0, getContext: () => ctx } : {})
  };
}

test('headless: hela köksfläkten byggs, växlar bredd, yta, tillval och LED', async () => {
  stubDocument();
  const { createProduct } = await import('../js/product.js');
  const { defaultState, LED_OFF_HEX } = await import('../js/config.js');

  const product = createProduct();
  const fx = {
    tweenColor() {},
    lerpScale() {},
    pop(o) { o.visible = true; }
  };

  const s = defaultState();
  product.apply(s, fx);
  const g1 = product.getGroup();
  assert.ok(g1, 'ingen grupp byggdes');
  assert.ok(g1.children.length > 10, 'för få objekt i modellen');
  assert.ok(product.refs.parts.canopy.length >= 2);
  assert.ok(product.refs.parts.filter.length >= 2);
  assert.ok(product.refs.parts.chimney.length >= 2);
  assert.equal(product.refs.acc.glasfront.visible, false);
  assert.ok(product.refs.ledLights[0].intensity > 0, 'LED ska vara tänd vid varmvitt');

  const stainlessMat = product.refs.parts.canopy[0].material;
  s.parts.canopy.material = 'copper';
  product.apply(s, fx);
  assert.notEqual(product.refs.parts.canopy[0].material, stainlessMat, 'material ska bytas vid finishbyte');
  assert.ok(product.refs.parts.canopy[0].material.clearcoat > 0, 'koppar ska ha clearcoat');

  s.size = 'w90';
  product.apply(s, fx);
  assert.notEqual(product.getGroup(), g1, 'bredden ska bygga om modellen');

  s.acc.glasfront = true;
  s.acc.chimneyExt = true;
  s.acc.mountRail = true;
  product.apply(s, fx);
  assert.equal(product.refs.acc.glasfront.visible, true);
  assert.equal(product.refs.acc.chimneyExt.visible, true);
  assert.equal(product.refs.acc.mountRail.visible, true);

  s.parts.led.color = LED_OFF_HEX;
  product.apply(s, fx);
  assert.equal(product.refs.ledLights[0].intensity, 0, 'LED ska vara släckt vid Av');

  s.parts.filter.material = 'carbon';
  product.apply(s, fx);
  assert.equal(product.refs.parts.filter[0].material.roughness, 0.96, 'kolfilter ska vara matt');
});

test('headless: fönsterfärg följer vald ljusmiljö', async () => {
  stubDocument();
  const { createProduct } = await import('../js/product.js');
  const { defaultState } = await import('../js/config.js');
  const product = createProduct();
  product.apply(defaultState(), { tweenColor() {}, lerpScale() {}, pop(o) { o.visible = true; } });
  assert.ok(product.refs.windowPane, 'fönsterruta saknas');
  product.setEnvTint('kokkvall');
  assert.equal(product.refs.windowPane.material.color.getHex(), 0x2a3d66);
  product.setEnvTint('kokdag');
  assert.equal(product.refs.windowPane.material.color.getHex(), 0xbfd4e8);
});

test('moduler: alla app-moduler kan importeras headless', async () => {
  stubDocument();
  const ui = await import('../js/ui.js');
  const quality = await import('../js/quality.js');
  const materials = await import('../js/materials.js');
  assert.equal(typeof ui.createUI, 'function');
  assert.equal(typeof quality.createQualityManager, 'function');
  assert.equal(typeof materials.makeMaterial, 'function');
  const m = materials.makeMaterial('stainless', '#c9ced4');
  assert.equal(m.metalness, 1.0);
});
