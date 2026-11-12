import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { setMaxAnisotropy } from './materials.js';
import { defaultQuality } from './config.js';

export const QUALITY_PRESETS = {
  lag: {
    label: 'Låg (snabbast)',
    patch: { renderScale: 0.75, shadowMap: 1024, bloom: false, ssao: false, env: 'studio', envIntensity: 1.0, exposure: 1.05 }
  },
  medel: {
    label: 'Medel',
    patch: { renderScale: 1.0, shadowMap: 2048, bloom: false, ssao: true, ssaoRadius: 6, env: 'studio', envIntensity: 1.0, exposure: 1.05 }
  },
  hog: {
    label: 'Hög',
    patch: { renderScale: 1.5, shadowMap: 2048, bloom: true, bloomStrength: 0.35, bloomRadius: 0.55, bloomThreshold: 0.82, ssao: true, ssaoRadius: 7, env: 'studio', envIntensity: 1.05, exposure: 1.05 }
  },
  ultra: {
    label: 'Ultra (max kvalitet)',
    patch: { renderScale: 2.5, shadowMap: 4096, bloom: true, bloomStrength: 0.45, bloomRadius: 0.7, bloomThreshold: 0.78, ssao: true, ssaoRadius: 9, env: 'studio', envIntensity: 1.1, exposure: 1.08 }
  }
};

const TONE_MAPPING = {
  aces: THREE.ACESFilmicToneMapping,
  neutral: THREE.NeutralToneMapping,
  none: THREE.NoToneMapping
};

function envSceneStudio() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0a0b0e);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.34, 0.38) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  s.add(floor);
  const box = (w, h, color, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  box(14, 14, new THREE.Color(7, 7, 7.2), -8, 9, -4);
  box(10, 10, new THREE.Color(3.2, 3.4, 3.8), 9, 5, 2);
  box(16, 4, new THREE.Color(2.4, 2.5, 2.7), 0, 11, 6);
  box(6, 18, new THREE.Color(1.1, 1.15, 1.25), -10, 3, 6, 0, 0.4);
  box(8, 8, new THREE.Color(0.9, 0.95, 1.1), 4, 2, -10);
  return s;
}

function envSceneSunset() {
  const s = new THREE.Scene();
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#2b2440');
  grad.addColorStop(0.45, '#7a3b52');
  grad.addColorStop(0.72, '#e2793f');
  grad.addColorStop(0.85, '#ffc46b');
  grad.addColorStop(1, '#3a2c28');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 16),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide })
  );
  s.add(sky);
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(18, 10, 4) })
  );
  sun.position.set(-18, 6, -50);
  sun.lookAt(0, 0, 0);
  s.add(sun);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.12, 0.12) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  s.add(floor);
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.3, 0.5) })
  );
  fill.position.set(14, 12, 10);
  fill.lookAt(0, 0, 0);
  s.add(fill);
  return s;
}

function envSceneWarehouse() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0c0e13);
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.11, 0.14) })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 14;
  s.add(ceil);
  for (let i = -2; i <= 2; i++) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 26),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 4.6, 5.0) })
    );
    strip.rotation.x = Math.PI / 2;
    strip.position.set(i * 7, 13.9, 0);
    s.add(strip);
  }
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 0.24, 0.28) })
  );
  wall.position.set(0, 4, -24);
  s.add(wall);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.21, 0.24) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  s.add(floor);
  const side = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 1.0, 1.2) })
  );
  side.position.set(-24, 6, 4);
  side.lookAt(0, 0, 0);
  s.add(side);
  return s;
}

const ENV_BUILDERS = {
  studio: envSceneStudio,
  solnedgang: envSceneSunset,
  industri: envSceneWarehouse
};

export function createQualityManager(renderer, scene, camera, keyLight) {
  const q = { ...defaultQuality() };
  let composer = null;
  let ssaoPass = null;
  let bloomPass = null;
  const envCache = new Map();
  const pmrem = new THREE.PMREMGenerator(renderer);

  function getEnv(name) {
    if (!envCache.has(name)) {
      const builder = ENV_BUILDERS[name] || ENV_BUILDERS.studio;
      envCache.set(name, pmrem.fromScene(builder(), 0.06).texture);
    }
    return envCache.get(name);
  }

  function rebuildComposer(width, height) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    if (q.ssao) {
      ssaoPass = new SSAOPass(scene, camera, Math.max(1, width), Math.max(1, height));
      ssaoPass.kernelRadius = q.ssaoRadius;
      ssaoPass.minDistance = 0.001;
      ssaoPass.maxDistance = 0.12;
      composer.addPass(ssaoPass);
    } else {
      ssaoPass = null;
    }
    if (q.bloom) {
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.max(1, width), Math.max(1, height)),
        q.bloomStrength,
        q.bloomRadius,
        q.bloomThreshold
      );
      composer.addPass(bloomPass);
    } else {
      bloomPass = null;
    }
    composer.addPass(new OutputPass());
  }

  function applyPatch(patch) {
    Object.assign(q, patch);
    applyAll();
  }

  function applyAll() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    renderer.setPixelRatio(Math.max(0.5, q.renderScale * dpr));
    renderer.shadowMap.enabled = q.shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = TONE_MAPPING[q.toneMapping] ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = q.exposure;
    if (keyLight) {
      keyLight.castShadow = q.shadowsEnabled;
      if (q.shadowsEnabled) {
        const size = q.shadowMap;
        if (keyLight.shadow.mapSize.x !== size) {
          keyLight.shadow.mapSize.set(size, size);
          if (keyLight.shadow.map) {
            keyLight.shadow.map.dispose();
            keyLight.shadow.map = null;
          }
        }
        keyLight.shadow.bias = -0.0004;
        keyLight.shadow.normalBias = 0.02;
      }
    }
    scene.environment = getEnv(q.env);
    scene.environmentIntensity = q.envIntensity;
    const aniso = q.preset === 'ultra' ? 16 : q.preset === 'hog' ? 8 : q.preset === 'medel' ? 4 : 2;
    setMaxAnisotropy(aniso);
    const size = renderer.getSize(new THREE.Vector2());
    rebuildComposer(size.x, size.y);
  }

  function setSize(w, h) {
    if (composer) composer.setSize(w, h);
  }

  function render() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  function setFromPreset(name) {
    const preset = QUALITY_PRESETS[name];
    if (!preset) return;
    applyPatch({ ...preset.patch, preset: name });
  }

  applyAll();

  return {
    state: q,
    applyPatch,
    setFromPreset,
    setSize,
    render,
    presets: QUALITY_PRESETS
  };
}
