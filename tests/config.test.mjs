import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState, computePrice, summarize, encodeState, decodeState, sanitizeState,
  enforceRules, violations, ruleFor, isTargetAllowed,
  PARTS, ACCESSORIES, SIZES, MATERIALS, PRODUCT_NAME
} from '../js/config.js';

test('defaultläge är giltigt och har alla delar/tillval', () => {
  const s = defaultState();
  assert.equal(s.size, 'w70');
  assert.equal(violations(s).length, 0);
  for (const p of PARTS) assert.ok(s.parts[p.id], `saknar del ${p.id}`);
  for (const a of ACCESSORIES) assert.equal(typeof s.acc[a.id], 'boolean');
});

test('grundpris = breddens pris + LED-tillval', () => {
  const s = defaultState();
  const price = computePrice(s);
  const base = SIZES.find((x) => x.id === s.size).price;
  const led = MATERIALS.led.price;
  assert.equal(price.total, base + led);
});

test('regler: koppar-kåpa och glasfront blockeras i 60 cm', () => {
  const s = defaultState();
  s.size = 'w60';
  s.parts.canopy.material = 'copper';
  s.acc.glasfront = true;
  const v = violations(s);
  assert.equal(v.length, 2);
  const changed = enforceRules(s);
  assert.equal(changed.length, 2);
  assert.equal(s.parts.canopy.material, 'stainless');
  assert.equal(s.acc.glasfront, false);
  assert.equal(violations(s).length, 0);
});

test('regler: vit skorsten kräver vit eller svart kåpa', () => {
  const s = defaultState();
  s.parts.chimney.material = 'white';
  s.parts.canopy.material = 'stainless';
  assert.ok(ruleFor(s, { kind: 'partMaterial', part: 'chimney', material: 'white' }));
  s.parts.canopy.material = 'black';
  assert.equal(ruleFor(s, { kind: 'partMaterial', part: 'chimney', material: 'white' }), null);
  assert.ok(isTargetAllowed(s, { kind: 'partMaterial', part: 'chimney', material: 'white' }));
});

test('regler: kolfilter ej ihop med koppar-kåpa', () => {
  const s = defaultState();
  s.size = 'w90';
  s.parts.canopy.material = 'copper';
  s.parts.filter.material = 'carbon';
  assert.ok(violations(s).some((v) => v.msg.includes('Kolfilter')));
});

test('prissättning: koppar + premium + tillval', () => {
  const s = defaultState();
  s.size = 'w90';
  s.parts.canopy.material = 'copper';
  s.acc.glasfront = true;
  s.acc.chimneyExt = true;
  const price = computePrice(s);
  const expected =
    SIZES.find((x) => x.id === 'w90').price +
    MATERIALS.copper.price +
    MATERIALS.led.price +
    ACCESSORIES.find((a) => a.id === 'glasfront').price +
    ACCESSORIES.find((a) => a.id === 'chimneyExt').price;
  assert.equal(price.total, expected);
});

test('encode/decode roundtrip och sanering av skräp', () => {
  const s = defaultState();
  s.size = 'w90';
  s.parts.canopy.material = 'copper';
  s.acc.glasfront = true;
  const back = decodeState(encodeState(s));
  assert.deepEqual(back, sanitizeState(s));
  assert.equal(decodeState('!!!inte-base64!!!'), null);
  const bad = sanitizeState({ size: 'zz', parts: { canopy: { material: 'gold', color: 'röd' } }, acc: { glasfront: 'ja' } });
  assert.equal(bad.size, 'w70');
  assert.equal(bad.parts.canopy.material, 'stainless');
  assert.equal(bad.acc.glasfront, false);
});

test('sammanfattning innehåller produktnamn och total', () => {
  const s = defaultState();
  const text = summarize(s);
  assert.ok(text.includes(PRODUCT_NAME));
  assert.ok(text.includes('Totalt:'));
  assert.ok(text.includes('70 cm'));
});
