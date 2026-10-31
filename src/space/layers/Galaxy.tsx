import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide } from "three";
import { seededRandom, shared, useColor } from "../engine";

const galaxyVertex = /* glsl */ `
  attribute float aRadius; attribute float aAngle; attribute float aSize; attribute vec3 aColor;
  uniform float uTime; uniform float uPixel; uniform float uSpeed; uniform float uBoost;
  varying vec3 vColor;
  void main() {
    float angle = aAngle + uTime * uSpeed / (0.35 + aRadius * 0.6);
    vec3 p = vec3(cos(angle) * aRadius, position.y, sin(angle) * aRadius);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * uPixel * (9.0 / -mv.z), 1.0, 14.0 * uPixel);
    vColor = aColor * (1.0 + uBoost * 0.2);
    gl_Position = projectionMatrix * mv;
  }
`;

const pointFragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a * 0.85);
  }
`;

export function GalaxySpiral({ count, arms = 4, radius = 4.2, core, inner, outer, speed = 0.06, tilt = 1.12 }: { count: number; arms?: number; radius?: number; core: string; inner: string; outer: string; speed?: number; tilt?: number }) {
  const dpr = useThree((state) => state.viewport.dpr);
  const geometry = useMemo(() => {
    const random = seededRandom(42);
    const coreColor = new Color(core);
    const innerColor = new Color(inner);
    const outerColor = new Color(outer);
    const positions = new Float32Array(count * 3);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const tmp = new Color();
    for (let i = 0; i < count; i++) {
      const r = Math.pow(random(), 1.7) * radius;
      const arm = ((i % arms) / arms) * Math.PI * 2;
      const scatter = (random() - 0.5) * (0.55 + 1.4 / (r + 0.6)) * 0.6;
      radii[i] = r + (random() - 0.5) * 0.18;
      angles[i] = arm + r * 1.35 + scatter;
      positions[i * 3 + 1] = (random() - 0.5) * 0.35 * Math.exp(-r * 0.55);
      sizes[i] = (random() > 0.97 ? 2.4 : 0.7 + random() * 0.9) * (1.2 - r / radius * 0.5);
      const t = r / radius;
      tmp.copy(coreColor).lerp(innerColor, Math.min(1, t * 2.2)).lerp(outerColor, Math.max(0, t * 1.4 - 0.35));
      const lum = 0.55 + random() * 0.5;
      colors[i * 3] = tmp.r * lum;
      colors[i * 3 + 1] = tmp.g * lum;
      colors[i * 3 + 2] = tmp.b * lum;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("aRadius", new BufferAttribute(radii, 1));
    geo.setAttribute("aAngle", new BufferAttribute(angles, 1));
    geo.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geo.setAttribute("aColor", new BufferAttribute(colors, 3));
    return geo;
  }, [count, arms, radius, core, inner, outer]);

  const uniforms = useMemo(() => ({ uTime: shared.uTime, uBoost: shared.uBoost, uPixel: { value: dpr }, uSpeed: { value: speed } }), [dpr, speed]);

  return (
    <group rotation={[tilt, 0, 0.35]}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial vertexShader={galaxyVertex} fragmentShader={pointFragment} uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  );
}

/** Soft additive glow billboard (galactic nucleus, engine core). */
export function Glow({ color, size, position = [0, 0, 0], intensity = 1, pulse = 0 }: { color: string; size: number; position?: [number, number, number]; intensity?: number; pulse?: number }) {
  const tint = useColor(color);
  const uniforms = useMemo(() => ({ uTime: shared.uTime, uBoost: shared.uBoost, uColor: { value: tint }, uIntensity: { value: intensity }, uPulse: { value: pulse } }), [tint, intensity, pulse]);
  return (
    <mesh position={position} renderOrder={2}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            vec2 scale = vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
            mv.xy += position.xy * scale;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform float uBoost; uniform vec3 uColor; uniform float uIntensity; uniform float uPulse;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float g = exp(-d * d * 5.0) + exp(-d * 14.0) * 0.8;
            float p = 1.0 + uPulse * 0.12 * sin(uTime * 1.3);
            float a = g * uIntensity * p * (1.0 + uBoost * 0.3) * smoothstep(1.0, 0.7, d);
            gl_FragColor = vec4(uColor * (1.0 + exp(-d * 18.0)), a);
          }
        `}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

/** Thin ring with a bright arc that travels around it. */
export function EnergyRing({ radius, width = 0.012, color, speed = 0.08, arc = 0.18, rotation = [0, 0, 0], opacity = 1 }: { radius: number; width?: number; color: string; speed?: number; arc?: number; rotation?: [number, number, number]; opacity?: number }) {
  const tint = useColor(color);
  const uniforms = useMemo(() => ({ uTime: shared.uTime, uBoost: shared.uBoost, uColor: { value: tint }, uSpeed: { value: speed }, uArc: { value: arc }, uOpacity: { value: opacity } }), [tint, speed, arc, opacity]);
  return (
    <mesh rotation={rotation}>
      <ringGeometry args={[radius, radius + width, 256, 1]} />
      <shaderMaterial
        vertexShader={/* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform float uBoost; uniform vec3 uColor; uniform float uSpeed; uniform float uArc; uniform float uOpacity;
          varying vec2 vP;
          void main() {
            float a = atan(vP.y, vP.x) / 6.2831853 + 0.5;
            float head = fract(a - uTime * uSpeed);
            float trail = smoothstep(1.0 - uArc, 1.0, head) + smoothstep(0.012, 0.0, head) ;
            float dash = step(0.5, fract(a * 96.0)) * 0.10;
            float alpha = (0.12 + dash + trail * (0.9 + uBoost * 0.4)) * uOpacity;
            gl_FragColor = vec4(uColor * (1.0 + trail), alpha);
          }
        `}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
      />
    </mesh>
  );
}