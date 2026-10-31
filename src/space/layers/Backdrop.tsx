import { useMemo } from "react";
import { Vector2 } from "three";
import { glsl, shared, useColor, useResolutionUniform } from "../engine";

export type BackdropKind = "nebula" | "aurora" | "grid" | "sun" | "blackhole";

export interface BackdropProps {
  kind: BackdropKind;
  colors: [string, string, string];
  intensity?: number;
  speed?: number;
  scale?: number;
  center?: [number, number];
  radius?: number;
  octaves: number;
  layers?: number;
}

const header = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime; uniform float uBoost; uniform vec2 uPointer; uniform vec2 uResolution;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
  uniform float uIntensity; uniform float uSpeed; uniform float uScale; uniform vec2 uCenter; uniform float uRadius;
  ${glsl.noise2}
  float aspect() { return uResolution.x / uResolution.y; }
`;

const fragments: Record<BackdropKind, string> = {
  nebula: /* glsl */ `
    void main() {
      vec2 p = (vUv - 0.5) * vec2(aspect(), 1.0) * uScale + uPointer * 0.05;
      float t = uTime * uSpeed;
      vec2 q = vec2(fbm(p + vec2(0.0, t * 0.6)), fbm(p + vec2(5.2, 1.3) - t * 0.4));
      vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.3), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.25));
      float f = fbm(p + 3.0 * r);
      vec3 col = mix(uColorA, uColorB, clamp(f * f * 2.4, 0.0, 1.0));
      col = mix(col, uColorC, clamp(length(q) * 0.95 - 0.25, 0.0, 1.0));
      float density = smoothstep(0.22, 0.95, f);
      col *= density * uIntensity * (1.0 + uBoost * 0.22);
      col *= 0.55 + 0.45 * smoothstep(0.2, 0.75, fbm(p * 2.6 - r));
      float vignette = smoothstep(1.3, 0.15, length((vUv - 0.5) * vec2(1.25, 1.0)));
      gl_FragColor = vec4(col * vignette, 1.0);
    }
  `,
  aurora: /* glsl */ `
    void main() {
      vec2 uv = vUv;
      vec2 p = vec2((uv.x - 0.5) * aspect() + uPointer.x * 0.04, uv.y);
      float t = uTime * uSpeed;
      vec3 col = mix(uColorC * 0.22, vec3(0.004, 0.008, 0.02), smoothstep(0.0, 0.9, uv.y));
      for (int i = 0; i < LAYERS; i++) {
        float fi = float(i);
        float x = p.x * (1.1 + fi * 0.35) + fi * 1.7;
        float curve = 0.5 + fi * 0.045 + 0.11 * sin(x * 1.25 + t * 0.55 + fi) + 0.09 * fbm(vec2(x * 0.8, t * 0.12 + fi));
        float d = uv.y - curve;
        float rays = fbm(vec2(x * 7.5, t * 0.32 + fi * 3.0));
        rays = pow(rays, 1.5) * 1.9;
        float curtain = smoothstep(-0.025, 0.012, d) * exp(-max(d, 0.0) * (4.6 + fi * 1.8)) * rays;
        vec3 c = mix(uColorA, uColorB, clamp(d * 3.2 + 0.15, 0.0, 1.0));
        col += c * curtain * (0.6 / (1.0 + fi * 0.55)) * uIntensity * (1.0 + uBoost * 0.3);
      }
      col += uColorA * 0.07 * exp(-abs(uv.y - 0.16) * 9.0);
      col *= 0.85 + 0.15 * smoothstep(0.0, 0.25, uv.y);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  grid: /* glsl */ `
    void main() {
      vec2 uv = vUv;
      float horizon = 0.44 + uPointer.y * 0.015;
      float t = uTime * uSpeed;
      vec3 col = uColorC * 0.16 * smoothstep(1.0, horizon, uv.y);
      if (uv.y < horizon) {
        float y = horizon - uv.y;
        float z = 0.32 / (y + 0.0008);
        float x = (uv.x - 0.5 - uPointer.x * 0.02) * aspect() * z;
        vec2 g = vec2(x * 1.1, z + t * 1.4);
        vec2 w = fwidth(g);
        vec2 grid = abs(fract(g) - 0.5) / max(w, vec2(0.0001));
        float line = 1.0 - min(min(grid.x, grid.y), 1.0);
        float fade = smoothstep(0.0, 0.22, y) * exp(-z * 0.035);
        float lane = floor(g.x + 0.5);
        float onLane = 1.0 - min(grid.x, 1.0);
        float pulse = smoothstep(0.93, 1.0, fract(g.y * 0.09 - t * 0.35 + hash(vec2(lane, 3.0)) * 7.0));
        pulse *= step(0.55, hash(vec2(lane, 9.0)));
        col += uColorA * line * fade * 0.5 * uIntensity;
        col += uColorB * pulse * onLane * fade * 2.2 * uIntensity * (1.0 + uBoost * 0.8);
      } else {
        vec2 sky = vec2((uv.x - 0.5) * aspect(), uv.y) * 14.0;
        float cols = smoothstep(0.985, 1.0, fract(sky.x + 0.5)) * smoothstep(1.0, horizon, uv.y) * 0.08;
        col += uColorA * cols * (0.5 + 0.5 * sin(t * 0.7 + floor(sky.x) * 1.7));
      }
      col += uColorA * exp(-abs(uv.y - horizon) * 70.0) * 0.55 * uIntensity;
      col += uColorB * exp(-abs(uv.y - horizon) * 7.0) * 0.12 * uIntensity;
      col += uColorA * 0.05 * exp(-abs(uv.y - fract(uTime * 0.04)) * 90.0);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  sun: /* glsl */ `
    void main() {
      float t = uTime * uSpeed;
      vec2 p = (vUv - uCenter) * vec2(aspect(), 1.0) + uPointer * 0.015;
      float r = length(p);
      float R = uRadius;
      vec3 col = vec3(0.0);
      float n = fbm(p * 9.0 + vec2(t * 0.3, -t * 0.2));
      float n2 = fbm(p * 24.0 - t * 0.35);
      float disk = smoothstep(R, R - 0.005, r);
      vec3 surface = mix(uColorA, uColorB, n) * (0.75 + 0.65 * n2);
      surface *= 1.0 - 0.45 * smoothstep(R * 0.4, R, r);
      col += surface * disk * 1.35;
      vec2 dir = p / max(r, 0.0001);
      float rays = fbm(dir * 3.0 + vec2(r * 2.5 - t * 0.45)) * fbm(dir * 7.0 - vec2(t * 0.18));
      float flare = pow(0.5 + 0.5 * sin(t * 0.42), 10.0);
      float corona = exp(-(r - R) * (5.2 - flare * 1.6)) * (1.0 - disk);
      col += mix(uColorB, uColorC, clamp((r - R) * 2.2, 0.0, 1.0)) * corona * (0.5 + rays * 1.7) * uIntensity * (1.0 + uBoost * 0.3 + flare * 0.7);
      vec2 q = (vUv - 0.5) * vec2(aspect(), 1.0) * 1.7;
      float currents = fbm(q + vec2(fbm(q * 1.4 + t * 0.09), t * 0.07));
      col += uColorC * 0.14 * smoothstep(0.45, 0.92, currents) * uIntensity;
      col += uColorB * 0.22 * exp(-r * 2.1);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  blackhole: /* glsl */ `
    mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
    void main() {
      float t = uTime * uSpeed;
      vec2 p = (vUv - uCenter) * vec2(aspect(), 1.0) + uPointer * 0.02;
      float r = length(p);
      float Rs = uRadius;
      vec2 bent = p * (1.0 + (Rs * Rs * 1.6) / (r * r + 0.0004));
      vec2 sp = bent * 55.0; vec2 id = floor(sp); vec2 f = fract(sp) - 0.5;
      float h = hash(id);
      vec2 offset = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
      float star = smoothstep(0.09, 0.0, length(f - offset)) * step(0.935, h);
      vec3 col = vec3(star) * (0.35 + 0.65 * h) * 0.9;
      col += uColorC * 0.14 * fbm(bent * 2.5 + t * 0.03);
      vec2 d = p; d.y /= 0.27;
      float dr = length(d);
      float ring = smoothstep(Rs * 1.3, Rs * 1.65, dr) * smoothstep(Rs * 3.8, Rs * 1.9, dr);
      vec2 rp = rot(t * 0.55 / (dr + 0.08)) * d;
      float swirl = fbm(rp * 9.0);
      float doppler = 0.55 + 0.6 * (-d.x / max(dr, 0.0001));
      vec3 diskCol = mix(uColorA, uColorB, smoothstep(Rs * 3.2, Rs * 1.5, dr));
      float disk = ring * (0.3 + swirl * 1.3) * doppler * uIntensity * (1.0 + uBoost * 0.35);
      float arc = exp(-pow((r - Rs * 1.5) / (Rs * 0.22), 2.0)) * smoothstep(-0.2, 0.7, p.y / max(r, 0.0001));
      col += diskCol * arc * (0.25 + fbm(rot(t * 0.4) * p * 12.0) * 0.9) * uIntensity * 0.85;
      col += uColorB * exp(-abs(r - Rs * 1.12) * 60.0) * 0.95 * uIntensity;
      col += uColorA * 0.08 * exp(-r * 3.0);
      float shadow = smoothstep(Rs * 1.03, Rs * 0.97, r);
      col *= 1.0 - shadow;
      float front = step(d.y, 0.0);
      col += diskCol * disk * mix(1.0 - shadow, 1.0, front);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export default function Backdrop({ kind, colors, intensity = 1, speed = 0.05, scale = 2.2, center = [0.5, 0.5], radius = 0.12, octaves, layers = 3 }: BackdropProps) {
  const colorA = useColor(colors[0]);
  const colorB = useColor(colors[1]);
  const colorC = useColor(colors[2]);
  const resolution = useResolutionUniform();

  const uniforms = useMemo(
    () => ({
      uTime: shared.uTime,
      uBoost: shared.uBoost,
      uPointer: shared.uPointer,
      uResolution: resolution,
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uColorC: { value: colorC },
      uIntensity: { value: intensity },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uCenter: { value: new Vector2(center[0], center[1]) },
      uRadius: { value: radius },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorA, colorB, colorC, intensity, speed, scale, center[0], center[1], radius, resolution],
  );

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        key={`${kind}-${octaves}-${layers}`}
        vertexShader={glsl.fullscreenVertex}
        fragmentShader={header + fragments[kind]}
        uniforms={uniforms}
        defines={{ OCTAVES: octaves, LAYERS: layers }}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}