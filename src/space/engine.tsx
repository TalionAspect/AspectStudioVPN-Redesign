import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Vector2 } from "three";

/** Uniform objects shared by every space material so one update drives all layers. */
export const shared = {
  uTime: { value: 0 },
  uBoost: { value: 0 },
  uPointer: { value: new Vector2() },
};

const pointerTarget = new Vector2();
let boostTarget = 0;
let pointerListeners = 0;

function onPointerMove(event: PointerEvent) {
  pointerTarget.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
}

/** 0 = idle, ~0.5 = working, 1 = connected. Drives subtle brightness in every scene. */
export function setSceneBoost(value: number) {
  boostTarget = value;
}

export function usePointerTracking() {
  useEffect(() => {
    if (pointerListeners++ === 0) window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      if (--pointerListeners === 0) window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);
}

/**
 * Renders on demand at a capped frame rate. When paused, the last frame stays on screen
 * and no GPU work is scheduled, which keeps the client quiet while a game is running.
 */
export function FrameDriver({ fps, paused }: { fps: number; paused: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    if (paused || fps <= 0) return;
    const interval = 1000 / fps;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last >= interval - 1) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, paused, invalidate]);
  return null;
}

let timeOrigin = performance.now();
let lastTick = 0;

/** Advances shared time/pointer/boost. Mount once per canvas; extra mounts are harmless. */
export function SceneClock({ parallax = 1 }: { parallax?: number }) {
  useFrame((state) => {
    const now = performance.now();
    // Clamp large gaps (window restored after minimise) so motion resumes instead of jumping.
    if (lastTick && now - lastTick > 250) timeOrigin += now - lastTick - 16;
    lastTick = now;
    shared.uTime.value = (now - timeOrigin) / 1000;
    shared.uPointer.value.lerp(pointerTarget, 0.06);
    shared.uBoost.value += (boostTarget - shared.uBoost.value) * 0.04;
    if (parallax > 0) {
      const camera = state.camera;
      camera.position.x += (shared.uPointer.value.x * 0.35 * parallax - camera.position.x) * 0.08;
      camera.position.y += (shared.uPointer.value.y * 0.22 * parallax - camera.position.y) * 0.08;
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

export function useColor(hex: string) {
  return useMemo(() => new Color(hex), [hex]);
}

export function useResolutionUniform() {
  const size = useThree((state) => state.size);
  const uniform = useMemo(() => ({ value: new Vector2(1, 1) }), []);
  uniform.value.set(size.width, size.height);
  return uniform;
}

export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const glsl = {
  noise2: /* glsl */ `
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }
  `,
  noise3: /* glsl */ `
    float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float noise3(vec3 x) {
      vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm3(vec3 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < OCTAVES; i++) { v += a * noise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
      return v;
    }
  `,
  fullscreenVertex: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
};