import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute, Vector3, type Group } from "three";
import { glsl, shared, useColor } from "../engine";

const lightDirection = new Vector3(-0.75, 0.35, 0.55).normalize();

const planetVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vObj; varying vec3 vView;
  void main() {
    vObj = position;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const planetFragment = /* glsl */ `
  uniform float uTime; uniform float uSpin; uniform float uBands; uniform float uTurbulence;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC; uniform vec3 uAtmo; uniform vec3 uLight;
  varying vec3 vN; varying vec3 vObj; varying vec3 vView;
  ${glsl.noise3}
  void main() {
    vec3 o = normalize(vObj);
    float a = uTime * uSpin; float c = cos(a); float s = sin(a);
    o.xz = mat2(c, -s, s, c) * o.xz;
    float n = fbm3(o * 2.6 + vec3(0.0, 0.0, uTime * 0.015));
    float bands = 0.5 + 0.5 * sin(o.y * uBands + n * uTurbulence);
    vec3 col = mix(uColorA, uColorB, bands);
    col = mix(col, uColorC, smoothstep(0.58, 0.82, n));
    vec3 normal = normalize(vN);
    float diffuse = max(dot(normal, uLight), 0.0);
    float terminator = smoothstep(-0.05, 0.25, dot(normal, uLight));
    float rim = pow(1.0 - max(dot(normal, normalize(vView)), 0.0), 3.0);
    vec3 lit = col * (0.025 + diffuse * 1.15) + uAtmo * rim * (0.08 + terminator * 1.1);
    gl_FragColor = vec4(lit, 1.0);
  }
`;

const ringVertex = /* glsl */ `
  varying float vR; varying vec3 vWorld;
  void main() {
    vR = length(position.xy);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const ringFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uInner; uniform float uOuter; uniform vec3 uPlanet; uniform float uPlanetRadius; uniform vec3 uLight;
  varying float vR; varying vec3 vWorld;
  float hash1(float x) { return fract(sin(x * 91.3) * 43758.5453); }
  float noise1(float x) { float i = floor(x); float f = fract(x); return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
  void main() {
    float t = (vR - uInner) / (uOuter - uInner);
    float bands = noise1(t * 38.0) * 0.6 + noise1(t * 110.0) * 0.4;
    float gap = smoothstep(0.52, 0.55, t) * smoothstep(0.6, 0.57, t);
    float alpha = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.9, t) * (0.25 + bands * 0.75) * (1.0 - gap * 0.85);
    vec3 toPlanet = vWorld - uPlanet;
    float along = dot(toPlanet, -uLight);
    float perp = length(toPlanet + uLight * along);
    float shadow = along > 0.0 ? smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.04, perp) : 1.0;
    gl_FragColor = vec4(uColor * (0.35 + bands * 0.9) * (0.15 + shadow * 0.85), alpha * 0.85);
  }
`;

export interface PlanetProps {
  radius: number;
  position: [number, number, number];
  colors: [string, string, string];
  atmosphere: string;
  bands?: number;
  turbulence?: number;
  spin?: number;
  tilt?: number;
  ring?: { inner: number; outer: number; color: string };
  segments?: number;
  octaves: number;
  children?: ReactNode;
}

export function Planet({ radius, position, colors, atmosphere, bands = 14, turbulence = 4, spin = 0.03, tilt = 0.35, ring, segments = 64, octaves, children }: PlanetProps) {
  const colorA = useColor(colors[0]);
  const colorB = useColor(colors[1]);
  const colorC = useColor(colors[2]);
  const atmo = useColor(atmosphere);
  const ringColor = useColor(ring?.color ?? "#ffffff");
  const planetWorld = useMemo(() => new Vector3(...position), [position]);

  const uniforms = useMemo(
    () => ({
      uTime: shared.uTime,
      uSpin: { value: spin },
      uBands: { value: bands },
      uTurbulence: { value: turbulence },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uColorC: { value: colorC },
      uAtmo: { value: atmo },
      uLight: { value: lightDirection },
    }),
    [spin, bands, turbulence, colorA, colorB, colorC, atmo],
  );

  const ringUniforms = useMemo(
    () => ({
      uColor: { value: ringColor },
      uInner: { value: ring?.inner ?? 1 },
      uOuter: { value: ring?.outer ?? 2 },
      uPlanet: { value: planetWorld },
      uPlanetRadius: { value: radius },
      uLight: { value: lightDirection },
    }),
    [ringColor, ring?.inner, ring?.outer, planetWorld, radius],
  );

  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh>
        <sphereGeometry args={[radius, segments, Math.round(segments * 0.75)]} />
        <shaderMaterial key={octaves} vertexShader={planetVertex} fragmentShader={planetFragment} uniforms={uniforms} defines={{ OCTAVES: octaves }} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 32, 24]} />
        <shaderMaterial
          vertexShader={planetVertex}
          fragmentShader={/* glsl */ `
            uniform vec3 uAtmo; uniform vec3 uLight;
            varying vec3 vN; varying vec3 vObj; varying vec3 vView;
            void main() {
              vec3 n = normalize(vN);
              float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 2.4);
              float lit = smoothstep(-0.3, 0.6, dot(n, uLight));
              gl_FragColor = vec4(uAtmo, rim * lit * 0.75);
            }
          `}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      {ring && (
        <mesh rotation={[-Math.PI / 2 + 0.12, 0, 0]}>
          <ringGeometry args={[ring.inner, ring.outer, 160, 1]} />
          <shaderMaterial vertexShader={ringVertex} fragmentShader={ringFragment} uniforms={ringUniforms} transparent depthWrite={false} side={DoubleSide} />
        </mesh>
      )}
      {children}
    </group>
  );
}

/** A moon travelling along a visible tilted orbit path. */
export function Moon({ orbit, size, speed, tilt, color, phase = 0, octaves }: { orbit: number; size: number; speed: number; tilt: number; color: string; phase?: number; octaves: number }) {
  const pivot = useRef<Group>(null);
  const pathGeometry = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      points.push(Math.cos(a) * orbit, 0, Math.sin(a) * orbit);
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(points, 3));
    return geo;
  }, [orbit]);

  useFrame(() => {
    if (pivot.current) pivot.current.rotation.y = phase + shared.uTime.value * speed;
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <lineLoop geometry={pathGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
      </lineLoop>
      <group ref={pivot}>
        <Planet radius={size} position={[orbit, 0, 0]} colors={[color, "#3a3f4a", "#d9dde6"]} atmosphere={color} bands={4} turbulence={9} spin={0.1} tilt={0} segments={28} octaves={Math.min(octaves, 4)} />
      </group>
    </group>
  );
}