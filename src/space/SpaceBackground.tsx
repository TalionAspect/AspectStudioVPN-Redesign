import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import type { SceneId } from "../state/theme";
import { useMotion } from "../state/motion";
import AnimatedBackground from "../components/AnimatedBackground";
import { FrameDriver, SceneClock, usePointerTracking } from "./engine";
import { sceneComponents } from "./scenes";
import styles from "./SpaceBackground.module.css";

const FADE_MS = 1100;

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneCanvas({ scene }: { scene: SceneId }) {
  const { profile, running, reducedMotion } = useMotion();
  const Scene = sceneComponents[scene];
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * profile.dpr;
  return (
    <Canvas
      className={styles.canvas}
      frameloop="demand"
      dpr={Math.max(0.35, dpr)}
      camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 200 }}
      gl={{ antialias: false, alpha: false, depth: true, stencil: false, powerPreference: profile.fps >= 60 ? "high-performance" : "low-power" }}
      aria-hidden="true"
    >
      <FrameDriver fps={profile.fps} paused={!running || reducedMotion} />
      <SceneClock parallax={reducedMotion ? 0 : 1} />
      <Scene q={profile} />
    </Canvas>
  );
}

interface LayerEntry {
  key: number;
  scene: SceneId;
  leaving: boolean;
}

/**
 * Full-window WebGL environment. Theme changes cross-fade between two canvases for
 * ~1s, after which only the active scene remains mounted.
 */
export default function SpaceBackground({ scene }: { scene?: SceneId }) {
  const { enabled, webgl } = useMotion();
  const active = enabled && webgl ? scene : undefined;
  const counter = useRef(0);
  const [layers, setLayers] = useState<LayerEntry[]>(() => (active ? [{ key: 0, scene: active, leaving: false }] : []));
  usePointerTracking();

  useEffect(() => {
    setLayers((current) => {
      const live = current.find((layer) => !layer.leaving);
      if (live?.scene === active) return current;
      const next = current.map((layer) => ({ ...layer, leaving: true }));
      if (active) next.push({ key: ++counter.current, scene: active, leaving: false });
      return next;
    });
    const timer = window.setTimeout(() => setLayers((current) => current.filter((layer) => !layer.leaving)), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  const fallback = enabled && scene ? <AnimatedBackground kind={scene === "nebula" || scene === "aurora" ? "nebula" : "stars"} /> : null;

  if (enabled && scene && !webgl) return <div className={styles.root}>{fallback}</div>;

  return (
    <div className={styles.root} aria-hidden="true">
      {layers.map((layer) => (
        <div key={layer.key} className={`${styles.layer} ${layer.leaving ? styles.leaving : ""}`}>
          <SceneBoundary fallback={fallback}>
            <SceneCanvas scene={layer.scene} />
          </SceneBoundary>
        </div>
      ))}
      {layers.length > 0 && <div className={styles.scrim} />}
    </div>
  );
}