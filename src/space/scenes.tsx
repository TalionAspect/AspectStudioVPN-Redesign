import type { SceneId } from "../state/theme";
import type { QualityProfile } from "../state/motion";
import Backdrop from "./layers/Backdrop";
import Starfield from "./layers/Starfield";
import Sparks from "./layers/Sparks";
import Meteors from "./layers/Meteors";
import { Moon, Planet } from "./layers/Planet";
import { EnergyRing, GalaxySpiral, Glow } from "./layers/Galaxy";

interface SceneProps {
  q: QualityProfile;
}

const n = (q: QualityProfile, full: number) => Math.max(8, Math.round(full * q.density));

const palettes = {
  coolStars: ["#ffffff", "#cfe0ff", "#a9c4ff", "#fff1d6"],
  warmStars: ["#fff3e0", "#ffd4a3", "#ffb36b", "#ffffff"],
  auroraStars: ["#e9fff8", "#c8f3ff", "#ffffff"],
  violetStars: ["#ffffff", "#e3d6ff", "#c4b5fd", "#ffe7c7"],
  cyanStars: ["#e0fbff", "#9be7ff", "#ffffff"],
  dust: ["#6d7bb8", "#8a6cc9", "#4f7fb0"],
};

const emberSparkSpread: [number, number, number] = [18, 11, 6];
const solarSparkSpread: [number, number, number] = [14, 10, 5];
const nebulaDustSpread: [number, number, number] = [22, 14, 8];
const shellNear: [number, number] = [14, 30];
const shellFar: [number, number] = [30, 70];

function Ember({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="nebula" colors={["#0b0603", "#ff6a10", "#ffb347"]} intensity={0.75} speed={0.045} scale={1.6} octaves={q.octaves} />
      <Starfield count={n(q, 900)} colors={palettes.warmStars} radius={shellFar} size={0.9} />
      <group position={[2.6, 0.35, -1.5]}>
        <Glow color="#ff7a1a" size={4.2} intensity={0.9} pulse={1} />
        <EnergyRing radius={1.35} color="#ff8a2a" speed={0.07} rotation={[1.2, 0.2, 0]} />
        <EnergyRing radius={1.75} color="#ffb347" speed={-0.045} arc={0.26} rotation={[1.35, -0.35, 0.4]} opacity={0.8} />
        <EnergyRing radius={2.25} width={0.008} color="#ff6a10" speed={0.03} rotation={[1.05, 0.5, -0.3]} opacity={0.65} />
        {q.layers >= 3 && <EnergyRing radius={2.8} width={0.006} color="#ffd29a" speed={-0.02} arc={0.1} rotation={[1.5, 0, 0.9]} opacity={0.45} />}
      </group>
      <Sparks count={n(q, 260)} color="#ff9a3c" speed={0.35} sway={0.35} size={1.1} spread={emberSparkSpread} />
    </>
  );
}

function DeepSpace({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="nebula" colors={["#02030a", "#1b2a5e", "#5b3a8c"]} intensity={0.32} speed={0.02} scale={1.3} octaves={q.octaves} />
      <Starfield count={n(q, 1400)} colors={palettes.coolStars} radius={shellFar} size={0.8} spin={0.002} seed={3} />
      <Starfield count={n(q, 700)} colors={palettes.coolStars} drift={0.9} depth={55} size={1.2} twinkle={0.2} spin={0} seed={5} />
      <Starfield count={n(q, 220)} colors={palettes.dust} drift={0.35} depth={40} size={3.2} twinkle={0} spin={0} seed={9} brightness={0.18} />
    </>
  );
}

function Nebula({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="nebula" colors={["#041016", "#14b8a6", "#c026d3"]} intensity={1.05} speed={0.03} scale={2.1} octaves={q.octaves} />
      <Starfield count={n(q, 1100)} colors={palettes.coolStars} radius={shellNear} size={0.85} spin={0.003} seed={13} />
      <Sparks count={n(q, 140)} color="#7ee8d8" speed={0.08} sway={0.6} size={1.4} spread={nebulaDustSpread} />
    </>
  );
}

function MeteorStorm({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="nebula" colors={["#07040c", "#5b1f4a", "#ff7a45"]} intensity={0.48} speed={0.025} scale={1.4} octaves={q.octaves} />
      <Starfield count={n(q, 1200)} colors={palettes.warmStars} radius={shellFar} size={0.8} spin={0.0015} seed={17} />
      <Meteors count={n(q, 30)} head="#fff3d6" tail="#ff6a3c" />
    </>
  );
}

function PlanetOrbit({ q }: SceneProps) {
  const segments = q.layers >= 4 ? 96 : q.layers >= 3 ? 64 : 40;
  return (
    <>
      <Backdrop kind="nebula" colors={["#03040a", "#1d2f55", "#7a4a2a"]} intensity={0.35} speed={0.015} scale={1.2} octaves={Math.min(q.octaves, 4)} />
      <Starfield count={n(q, 1300)} colors={palettes.coolStars} radius={shellFar} size={0.8} spin={0.0015} seed={21} />
      <Planet radius={1.55} position={[2.8, -0.5, -1.8]} colors={["#c98a4b", "#f3d3a0", "#7a4a2a"]} atmosphere="#ffb878" bands={16} turbulence={5} spin={0.025} tilt={0.42} ring={{ inner: 2.0, outer: 3.3, color: "#e9c28f" }} segments={segments} octaves={q.octaves}>
        <Moon orbit={4.1} size={0.22} speed={0.12} tilt={0.3} color="#9fb7d9" octaves={q.octaves} />
        {q.layers >= 3 && <Moon orbit={5.2} size={0.13} speed={-0.07} tilt={-0.18} color="#d6c3a6" phase={2.2} octaves={q.octaves} />}
      </Planet>
      <Planet radius={0.45} position={[-5.2, 2.4, -7]} colors={["#2b5d8a", "#6fb1d6", "#e5f4ff"]} atmosphere="#8fd3ff" bands={6} turbulence={8} spin={0.05} tilt={0.1} segments={40} octaves={Math.min(q.octaves, 4)} />
    </>
  );
}

function GalaxyCore({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="nebula" colors={["#04020a", "#3b1d6e", "#1e3a8a"]} intensity={0.4} speed={0.02} scale={1.5} octaves={q.octaves} />
      <Starfield count={n(q, 900)} colors={palettes.violetStars} radius={shellFar} size={0.8} spin={0.001} seed={25} />
      <group position={[1.6, 0.2, -1]}>
        <GalaxySpiral count={n(q, 26000)} core="#fff1d0" inner="#f0abfc" outer="#60a5fa" speed={0.05} />
        <Glow color="#ffd9a8" size={2.6} intensity={1.1} pulse={0.5} />
        <Glow color="#a78bfa" size={7} intensity={0.35} />
      </group>
    </>
  );
}

function SolarFlare({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="sun" colors={["#ff8a00", "#ffd27a", "#ff3d00"]} intensity={1} speed={0.12} center={[0.88, 0.8]} radius={0.2} octaves={q.octaves} />
      <Starfield count={n(q, 400)} colors={palettes.warmStars} radius={shellFar} size={0.7} seed={29} brightness={0.6} />
      <Sparks count={n(q, 200)} color="#ffb347" speed={0.22} sway={0.5} size={1} spread={solarSparkSpread} origin={[1.5, 0, 0]} />
    </>
  );
}

function Aurora({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="aurora" colors={["#22f5a0", "#8b5cf6", "#0b3b4a"]} intensity={1} speed={0.6} octaves={Math.min(q.octaves, 4)} layers={q.layers} />
      <Starfield count={n(q, 900)} colors={palettes.auroraStars} radius={shellNear} size={0.75} spin={0.0012} seed={31} />
    </>
  );
}

function BlackHole({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="blackhole" colors={["#ff9a3c", "#ffe2b0", "#3b2a5e"]} intensity={1} speed={0.5} center={[0.7, 0.55]} radius={0.1} octaves={q.octaves} />
      <Starfield count={n(q, 500)} colors={palettes.warmStars} radius={shellNear} size={0.7} spin={0.0008} seed={37} brightness={0.7} />
    </>
  );
}

function CosmicGrid({ q }: SceneProps) {
  return (
    <>
      <Backdrop kind="grid" colors={["#22d3ee", "#e0f2fe", "#1e3a8a"]} intensity={1} speed={0.6} octaves={3} />
      <Starfield count={n(q, 700)} colors={palettes.cyanStars} radius={shellFar} size={0.7} spin={0.001} seed={41} brightness={0.8} />
    </>
  );
}

export const sceneComponents: Record<SceneId, (props: SceneProps) => JSX.Element> = {
  ember: Ember,
  "deep-space": DeepSpace,
  nebula: Nebula,
  "meteor-storm": MeteorStorm,
  "planet-orbit": PlanetOrbit,
  "galaxy-core": GalaxyCore,
  "solar-flare": SolarFlare,
  aurora: Aurora,
  "black-hole": BlackHole,
  "cosmic-grid": CosmicGrid,
};