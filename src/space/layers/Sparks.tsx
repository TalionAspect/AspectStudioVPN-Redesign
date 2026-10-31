import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry } from "three";
import { seededRandom, shared, useColor } from "../engine";

interface Props {
  count: number;
  color: string;
  /** Rise speed in units/sec. Negative values fall. */
  speed?: number;
  sway?: number;
  size?: number;
  spread?: [number, number, number];
  origin?: [number, number, number];
  seed?: number;
}

const vertexShader = /* glsl */ `
  attribute float aSpeed; attribute float aPhase;
  uniform float uTime; uniform float uPixel; uniform float uRise; uniform float uSway; uniform float uHeight; uniform float uSize;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float travel = mod(p.y + uTime * uRise * aSpeed + uHeight * 0.5, uHeight);
    p.y = travel - uHeight * 0.5;
    p.x += sin(uTime * 0.6 + aPhase * 6.283) * uSway;
    p.z += cos(uTime * 0.45 + aPhase * 6.283) * uSway * 0.5;
    float life = travel / uHeight;
    vAlpha = smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.65, life) * (0.45 + 0.55 * sin(uTime * 3.0 + aPhase * 30.0) * 0.5 + 0.275);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(uSize * (0.6 + aSpeed) * uPixel * (10.0 / -mv.z), 1.0, 18.0 * uPixel);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * (1.0 + smoothstep(0.15, 0.0, d)), a);
  }
`;

export default function Sparks({ count, color, speed = 0.5, sway = 0.25, size = 1, spread = [16, 10, 6], origin = [0, 0, 0], seed = 7 }: Props) {
  const dpr = useThree((state) => state.viewport.dpr);
  const tint = useColor(color);

  const geometry = useMemo(() => {
    const random = seededRandom(seed);
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * spread[0];
      positions[i * 3 + 1] = (random() - 0.5) * spread[1];
      positions[i * 3 + 2] = (random() - 0.5) * spread[2];
      speeds[i] = 0.4 + random() * 0.9;
      phases[i] = random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("aSpeed", new BufferAttribute(speeds, 1));
    geo.setAttribute("aPhase", new BufferAttribute(phases, 1));
    return geo;
  }, [count, spread, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: shared.uTime,
      uPixel: { value: dpr },
      uRise: { value: speed },
      uSway: { value: sway },
      uHeight: { value: spread[1] },
      uSize: { value: size },
      uColor: { value: tint },
    }),
    [dpr, speed, sway, spread, size, tint],
  );

  return (
    <points geometry={geometry} position={origin} frustumCulled={false}>
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending} />
    </points>
  );
}