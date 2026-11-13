import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { setMaxAnisotropy } from './materials.js';
import { defaultQuality } from './config.js';

export const QUALITY_PRESETS = {
  lag: {
    label: 'Låg (snabbast)',
    patch: { renderScale: 0.75, shadowMap: 1024, shadowType: 'pcfsoft', bloom: false, ssao: false, dof: false, fxaa: true, env: 'kokdag', envIntensity: 1.0, exposure: 1.05, vignette: 0.25, grain: 0 }
  },
  medel: {
    label: 'Medel',
    patch: { renderScale: 1.0, shadowMap: 2048, shadowType: 'pcfsoft', bloom: false, ssao: true, ssaoRadius: 6, dof: false, fxaa: false, env: 'kokdag', envIntensity: 1.0, exposure: 1.05, vignette: 0.3, grain: 0.006 }
  },
  hog: {
    label: 'Hög',
    patch: { renderScale: 1.5, shadowMap: 2048, shadowType: 'pcfsoft', bloom: true, bloomStrength: 0.3, bloomRadius: 0.55, bloomThreshold: 0.85, ssao: true, ssaoRadius: 7, dof: false, fxaa: false, env: 'kokdag', envIntensity: 1.0, exposure: 1.05, vignette: 0.32, grain: 0.008 }
  },
  ultra: {
    label: 'Ultra (max kvalitet)',
    patch: { renderScale: 2.5, shadowMap: 4096, shadowType: 'vsm', bloom: true, bloomStrength: 0.4, bloomRadius: 0.7, bloomThreshold: 0.8, ssao: true, ssaoRadius: 9, dof: true, dofAperture: 0.00035, fxaa: false, env: 'kokdag', envIntensity: 1.1, exposure: 1.08, vignette: 0.35, grain: 0.01 }
  }
};

const TONE_MAPPING = {
  aces: THREE.ACESFilmicToneMapping,
  neutral: THREE.NeutralToneMapping,
  none: THREE.NoToneMapping
};

const SHADOW_TYPES = {
  pcfsoft: THREE.PCFSoftShadowMap,
  vsm: THREE.VSMShadowMap
};

const FinalGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.32 },
    grain: { value: 0.008 },
    time: { value: 0 },
    lift: { value: 0.015 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float vignette;
    uniform float grain;
    uniform float time;
    uniform float lift;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float vig = 1.0 - vignette * dot(d, d) * 1.7;
      c.rgb *= vig;
      c.rgb += lift;
      c.rgb += (hash(vUv * vec2(1920.0, 1080.0) + fract(time) * 7.0) - 0.5) * grain;
      gl_FragColor = c;
    }
  `
};

function panel(w, h, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, z);
  m.lookAt(0, 10, 0);
  return m;
}

function envSceneKokDag() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x11161d);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.52, 0.47) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6;
  s.add(floor);
  s.add(panel(5.5, 8.5, new THREE.Color(11, 12.5, 15), -11, 13, 3));
  s.add(panel(18, 12, new THREE.Color(3.2, 3.7, 4.6), 8, 13, -6));
  s.add(panel(20, 5, new THREE.Color(1.7, 1.75, 1.85), 0, 18, 4));
  s.add(panel(14, 10, new THREE.Color(2.6, 2.8, 3.2), 10, 11, -4));
  s.add(panel(6, 6, new THREE.Color(1.5, 1.2, 0.85), 8, 7, 6));
  s.add(panel(8, 3, new THREE.Color(0.9, 0.85, 0.78), -4, 2, 8));
  return s;
}

function envSceneKokKväll() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0b0906);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.14, 0.12, 0.1) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6;
  s.add(floor);
  s.add(panel(5, 5, new THREE.Color(9, 5.5, 2.6), -4, 16, 2));
  s.add(panel(5, 5, new THREE.Color(8, 5, 2.4), 4, 16, 2));
  s.add(panel(2.5, 4, new THREE.Color(0.6, 0.85, 1.4), -11, 12, 2));
  s.add(panel(12, 3, new THREE.Color(0.35, 0.3, 0.26), 0, 17, -6));
  return s;
}

function envSceneStudio() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x0a0b0e);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.34, 0.38) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6;
  s.add(floor);
  s.add(panel(14, 14, new THREE.Color(7, 7, 7.2), -8, 12, -4));
  s.add(panel(10, 10, new THREE.Color(3.2, 3.4, 3.8), 9, 8, 2));
  s.add(panel(16, 4, new THREE.Color(2.4, 2.5, 2.7), 0, 16, 6));
  s.add(panel(6, 18, new THREE.Color(1.1, 1.15, 1.25), -10, 6, 6));
  s.add(panel(8, 8, new THREE.Color(0.9, 0.95, 1.1), 4, 5, -10));
  return s;
}

const ENV_BUILDERS = {
  kokdag: envSceneKokDag,
  kokkvall: envSceneKokKväll,
  studio: envSceneStudio
};

export function createQualityManager(renderer, scene, camera, keyLight) {
  const q = { ...defaultQuality() };
  let composer = null;
  let ssaoPass = null;
  let bloomPass = null;
  let dofPass = null;
  let fxaaPass = null;
  let finalPass = null;
  const envCache = new Map();
  const pmrem = new THREE.PMREMGenerator(renderer);

  function getEnv(name) {
    if (!envCache.has(name)) {
      const builder = ENV_BUILDERS[name] || ENV_BUILDERS.kokdag;
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
      ssaoPass.maxDistance = 0.15;
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
    if (q.dof) {
      dofPass = new BokehPass(scene, camera, {
        focus: 13,
        aperture: q.dofAperture,
        maxblur: q.dofMaxblur
      });
      composer.addPass(dofPass);
    } else {
      dofPass = null;
    }
    if (q.fxaa) {
      fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.material.uniforms.resolution.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
      composer.addPass(fxaaPass);
    } else {
      fxaaPass = null;
    }
    finalPass = new ShaderPass(FinalGradeShader);
    finalPass.uniforms.vignette.value = q.vignette;
    finalPass.uniforms.grain.value = q.grain;
    composer.addPass(finalPass);
    composer.addPass(new OutputPass());
  }

  function applyPatch(patch) {
    const envChanged = patch.env !== undefined && patch.env !== q.env;
    const dofChanged = patch.dof !== undefined && patch.dof !== q.dof;
    const apertureChanged = patch.dofAperture !== undefined && dofPass;
    Object.assign(q, patch);
    applyAll(envChanged, dofChanged, apertureChanged);
  }

  function applyAll(envChanged, dofChanged, apertureChanged) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    renderer.setPixelRatio(Math.max(0.5, q.renderScale * dpr));
    renderer.shadowMap.enabled = q.shadowsEnabled;
    renderer.shadowMap.type = SHADOW_TYPES[q.shadowType] || THREE.PCFSoftShadowMap;
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
        keyLight.shadow.bias = q.shadowType === 'vsm' ? 0.0 : -0.0004;
        keyLight.shadow.normalBias = q.shadowType === 'vsm' ? 0.05 : 0.02;
        keyLight.shadow.radius = q.shadowType === 'vsm' ? 8 : 1;
        if ('blurSamples' in keyLight.shadow) keyLight.shadow.blurSamples = q.shadowType === 'vsm' ? 16 : 8;
      }
    }
    scene.environment = getEnv(q.env);
    scene.environmentIntensity = q.envIntensity;
    const aniso = q.preset === 'ultra' ? 16 : q.preset === 'hog' ? 8 : q.preset === 'medel' ? 4 : 2;
    setMaxAnisotropy(aniso);
    const size = renderer.getSize(new THREE.Vector2());
    rebuildComposer(size.x, size.y);
    if (dofPass) {
      dofPass.uniforms.aperture.value = q.dofAperture;
      dofPass.uniforms.maxblur.value = q.dofMaxblur;
    }
    if (finalPass) {
      finalPass.uniforms.vignette.value = q.vignette;
      finalPass.uniforms.grain.value = q.grain;
    }
    return { envChanged };
  }

  function setFocus(distance) {
    if (dofPass) dofPass.uniforms.focus.value = distance;
  }

  function setSize(w, h) {
    if (composer) composer.setSize(w, h);
    if (fxaaPass) fxaaPass.material.uniforms.resolution.value.set(1 / Math.max(1, w), 1 / Math.max(1, h));
  }

  function render() {
    if (finalPass) finalPass.uniforms.time.value = performance.now() / 1000;
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  function setFromPreset(name) {
    const preset = QUALITY_PRESETS[name];
    if (!preset) return;
    applyPatch({ ...preset.patch, preset: name });
  }

  applyAll(false, false, false);

  return {
    state: q,
    applyPatch,
    setFromPreset,
    setSize,
    setFocus,
    render,
    presets: QUALITY_PRESETS
  };
}
