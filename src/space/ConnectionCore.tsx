import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, type Group } from "three";
import { useMotion, useThemeTokens } from "../state/motion";
import { FrameDriver, SceneClock, glsl, seededRandom, setSceneBoost, shared } from "./engine";

export type CoreStage = "idle" | "working" | "connected" | "error";

interface StageTuning {
  energy: number;
  spin: number;
  inflow: number;
  pulse: number;
}

const tuning: Record<CoreStage, StageTuning> = {
  idle: { energy: 0.35, spin: 0.25, inflow: 0, pulse: 0.15 },
  working: { energy: 0.7, spin: 1.6, inflow: 1, pulse: 1 },
  connected: { energy: 1, spin: 0.55, inflow: 0, pulse: 0.35 },
  error: { energy: 0.5, spin: 0.12, inflow: 0, pulse: 0.6 },
};

const live = { energy: 0.35, spin: 0.25, inflow: 0, pulse: 0.15, color: new Color("#ff7a1a") };
const coreUniforms = {
  uColor: { value: live.color },
  uEnergy: { value: live.energy },
  uInflow: { value: 0 },
  uPulse: { value: 0 },
  uPhase: { value: 0 },
};

function CoreSphere({ octaves }: { octaves: number }) {
  const uniforms = useMemo(() => ({ uTime: shared.uTime, ...coreUniforms }), []);
  return (
    <mesh>
      <sphereGeometry args={[0.95, 64, 48]} />
      <shaderMaterial
        key={octaves}
        defines={{ OCTAVES: octaves }}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        vertexShader={/* glsl */ `
          varying vec3 vN; varying vec3 vView; varying vec3 vObj;
          void main() {
            vObj = position; vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0); vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform vec3 uColor; uniform float uEnergy; uniform float uPulse;
          varying vec3 vN; varying vec3 vView; varying vec3 vObj;
          ${glsl.noise3}
          void main() {
            float facing = max(dot(normalize(vN), normalize(vView)), 0.0);
            float rim = pow(1.0 - facing, 2.2);
            float swirl = fbm3(normalize(vObj) * 2.4 + vec3(0.0, uTime * 0.25, uTime * 0.12));
            float plasma = smoothstep(0.38, 0.85, swirl);
            float beat = 1.0 + uPulse * 0.22 * sin(uTime * 3.2);
            float a = (rim * 0.95 + plasma * 0.42 * facing + pow(facing, 6.0) * 0.35) * uEnergy * beat;
            gl_FragColor = vec4(uColor * (0.7 + plasma * 0.8 + rim * 0.6), a);
          }
        `}
      />
    </mesh>
  );
}

function CoreRing({ radius, tilt, speed, width = 0.018 }: { radius: number; tilt: [number, number, number]; speed: number; width?: number }) {
  const ref = useRef<Group>(null);
  const uniforms = useMemo(() => ({ uTime: shared.uTime, ...coreUniforms }), []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += speed * live.spin * Math.min(delta, 0.1);
  });
  return (
    <group rotation={tilt}>
      <group ref={ref}>
        <mesh>
          <ringGeometry args={[radius, radius + width, 192, 1]} />
          <shaderMaterial
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            side={DoubleSide}
            vertexShader={/* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
            fragmentShader={/* glsl */ `
              uniform vec3 uColor; uniform float uEnergy;
              varying vec2 vP;
              void main() {
                float a = atan(vP.y, vP.x) / 6.2831853 + 0.5;
                float arc = smoothstep(0.62, 1.0, a) ;
                float ticks = step(0.6, fract(a * 72.0)) * 0.12;
                gl_FragColor = vec4(uColor * (1.0 + arc), (0.1 + ticks + arc * 0.9) * (0.35 + uEnergy * 0.65));
              }
            `}
          />
        </mesh>
      </group>
    </group>
  );
}

function CoreParticles({ count }: { count: number }) {
  const dpr = useThree((state) => state.viewport.dpr);
  const geometry = useMemo(() => {
    const random = seededRandom(77);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const heights = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      radii[i] = 1.25 + random() * 1.4;
      angles[i] = random() * Math.PI * 2;
      heights[i] = (random() - 0.5) * 0.5;
      phases[i] = random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aRadius", new BufferAttribute(radii, 1));
    geo.setAttribute("aAngle", new BufferAttribute(angles, 1));
    geo.setAttribute("aHeight", new BufferAttribute(heights, 1));
    geo.setAttribute("aPhase", new BufferAttribute(phases, 1));
    return geo;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: shared.uTime, uPixel: { value: dpr }, ...coreUniforms }), [dpr]);
  return (
    <points geometry={geometry} frustumCulled={false} rotation={[0.42, 0, 0.18]}>
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        vertexShader={/* glsl */ `
          attribute float aRadius; attribute float aAngle; attribute float aHeight; attribute float aPhase;
          uniform float uTime; uniform float uPixel; uniform float uInflow; uniform float uPhase; uniform float uEnergy;
          varying float vAlpha;
          void main() {
            float cycle = fract(uTime * 0.32 * (0.6 + aPhase) + aPhase);
            float r = mix(aRadius, aRadius * (1.0 - cycle * 0.72), uInflow);
            float angle = aAngle + uPhase * (0.5 + 1.2 / aRadius);
            vec3 p = vec3(cos(angle) * r, aHeight * (r / aRadius), sin(angle) * r);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp((1.4 + aPhase * 2.0) * uPixel * (6.0 / -mv.z), 1.0, 10.0 * uPixel);
            vAlpha = (0.25 + uEnergy * 0.75) * mix(1.0, sin(cycle * 3.14159), uInflow);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d); a *= a * vAlpha;
            if (a < 0.004) discard;
            gl_FragColor = vec4(uColor * 1.4, a);
          }
        `}
      />
    </points>
  );
}

function CoreDriver({ stage, color }: { stage: CoreStage; color: string }) {
  const target = useMemo(() => new Color(color), [color]);
  useFrame((_, delta) => {
    const goal = tuning[stage];
    const k = Math.min(1, delta * 2.2);
    live.energy += (goal.energy - live.energy) * k;
    live.spin += (goal.spin - live.spin) * k;
    live.inflow += (goal.inflow - live.inflow) * k;
    live.pulse += (goal.pulse - live.pulse) * k;
    live.color.lerp(target, k);
    coreUniforms.uEnergy.value = live.energy * (stage === "error" ? 0.85 + 0.15 * Math.sin(shared.uTime.value * 9) : 1);
    coreUniforms.uInflow.value = live.inflow;
    coreUniforms.uPulse.value = live.pulse;
    coreUniforms.uPhase.value += Math.min(delta, 0.1) * live.spin;
  });
  return null;
}

interface Props {
  stage: CoreStage;
}

export default function ConnectionCore({ stage }: Props) {
  const { profile, running, reducedMotion } = useMotion();
  const tokens = useThemeTokens();
  const color = stage === "connected" ? tokens.success : stage === "working" ? tokens.warning : stage === "error" ? tokens.error : tokens.accent;

  useEffect(() => {
    setSceneBoost(stage === "connected" ? 1 : stage === "working" ? 0.5 : 0);
  }, [stage]);
  useEffect(() => () => setSceneBoost(0), []);

  return (
    <Canvas
      frameloop="demand"
      dpr={Math.min(window.devicePixelRatio || 1, profile.fps >= 60 ? 2 : 1.25)}
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <FrameDriver fps={Math.min(profile.fps, stage === "working" ? 60 : 30)} paused={!running || reducedMotion} />
      <SceneClock parallax={0} />
      <CoreDriver stage={stage} color={color} />
      <CoreSphere octaves={Math.min(profile.octaves, 4)} />
      <CoreRing radius={1.3} tilt={[1.15, 0.1, 0]} speed={0.9} />
      <CoreRing radius={1.55} tilt={[1.3, -0.45, 0.3]} speed={-0.6} width={0.012} />
      <CoreRing radius={1.85} tilt={[0.95, 0.5, -0.2]} speed={0.35} width={0.008} />
      <CoreParticles count={Math.round(420 * Math.max(0.4, profile.density))} />
    </Canvas>
  );
}