import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Points } from "three";
import { seededRandom, shared } from "../engine";

export interface StarfieldProps {
  count: number;
  colors: string[];
  /** Shell radius range for static stars. */
  radius?: [number, number];
  size?: number;
  twinkle?: number;
  /** Units/sec toward the camera; 0 for a static shell. */
  drift?: number;
  depth?: number;
  spin?: number;
  seed?: number;
  brightness?: number;
}

const vertexShader = /* glsl */ `
  attribute float aSize; attribute float aPhase; attribute vec3 aColor;
  uniform float uTime; uniform float uPixel; uniform float uDrift; uniform float uDepth; uniform float uTwinkle; uniform float uBoost;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec3 p = position;
    float fade = 1.0;
    if (uDrift > 0.0) {
      p.z = mod(p.z + uTime * uDrift, uDepth) - uDepth + 3.5;
      fade = smoothstep(3.5, 1.5, p.z) * smoothstep(3.5 - uDepth, 3.5 - uDepth + 6.0, p.z);
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float tw = 1.0 - uTwinkle + uTwinkle * (0.5 + 0.5 * sin(uTime * (0.8 + aPhase * 2.2) + aPhase * 40.0));
    gl_PointSize = clamp(aSize * uPixel * (12.0 / -mv.z), 1.0, 28.0 * uPixel);
    vColor = aColor * (1.0 + uBoost * 0.25);
    vAlpha = tw * fade;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uBrightness;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.14, 0.0, d);
    float a = (glow * glow * 0.55 + core) * vAlpha * uBrightness;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

export default function Starfield({ count, colors, radius = [18, 60], size = 1, twinkle = 0.45, drift = 0, depth = 60, spin = 0.004, seed = 1, brightness = 1 }: StarfieldProps) {
  const ref = useRef<Points>(null);
  const dpr = useThree((state) => state.viewport.dpr);

  const geometry = useMemo(() => {
    const random = seededRandom(seed);
    const palette = colors.map((hex) => new Color(hex));
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const tints = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      if (drift > 0) {
        positions[i * 3] = (random() - 0.5) * 40;
        positions[i * 3 + 1] = (random() - 0.5) * 26;
        positions[i * 3 + 2] = random() * depth;
      } else {
        const u = random() * 2 - 1;
        const theta = random() * Math.PI * 2;
        const r = radius[0] + random() * (radius[1] - radius[0]);
        const s = Math.sqrt(1 - u * u);
        positions[i * 3] = r * s * Math.cos(theta);
        positions[i * 3 + 1] = r * u;
        positions[i * 3 + 2] = r * s * Math.sin(theta);
      }
      const big = random() > 0.965;
      sizes[i] = size * (big ? 2.2 + random() * 1.6 : 0.55 + random() * 1.1);
      phases[i] = random();
      const tint = palette[Math.floor(random() * palette.length)];
      const lum = 0.55 + random() * 0.45;
      tints[i * 3] = tint.r * lum;
      tints[i * 3 + 1] = tint.g * lum;
      tints[i * 3 + 2] = tint.b * lum;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new BufferAttribute(phases, 1));
    geo.setAttribute("aColor", new BufferAttribute(tints, 3));
    return geo;
  }, [count, colors, radius, size, drift, depth, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: shared.uTime,
      uBoost: shared.uBoost,
      uPixel: { value: dpr },
      uDrift: { value: drift },
      uDepth: { value: depth },
      uTwinkle: { value: twinkle },
      uBrightness: { value: brightness },
    }),
    [dpr, drift, depth, twinkle, brightness],
  );

  useFrame((_, delta) => {
    if (ref.current && spin) ref.current.rotation.y += spin * Math.min(delta, 0.1);
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}