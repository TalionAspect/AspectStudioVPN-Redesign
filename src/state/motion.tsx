import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Quality = "eco" | "balanced" | "cinematic";

export interface QualityProfile {
  label: string;
  hint: string;
  fps: number;
  dpr: number;
  density: number;
  octaves: number;
  layers: number;
}

export const qualityProfiles: Record<Quality, QualityProfile> = {
  eco: { label: "Eco", hint: "15 FPS · half resolution · minimal particles", fps: 15, dpr: 0.5, density: 0.35, octaves: 3, layers: 2 },
  balanced: { label: "Balanced", hint: "30 FPS · reduced resolution · recommended while gaming", fps: 30, dpr: 0.75, density: 0.65, octaves: 4, layers: 3 },
  cinematic: { label: "Cinematic", hint: "60 FPS · full detail · glass blur", fps: 60, dpr: 1.25, density: 1, octaves: 5, layers: 4 },
};

export const qualityIds = Object.keys(qualityProfiles) as Quality[];

export function resolveQuality(saved: string | null): Quality {
  return qualityIds.includes(saved as Quality) ? (saved as Quality) : "balanced";
}

export interface MotionState {
  enabled: boolean;
  quality: Quality;
  profile: QualityProfile;
  reducedMotion: boolean;
  /** False while the window is hidden/minimized, or unfocused when pause-on-blur is on. */
  running: boolean;
  webgl: boolean;
}

const MotionContext = createContext<MotionState | null>(null);

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useWindowRunning(pauseUnfocused: boolean): boolean {
  const read = () => document.visibilityState === "visible" && (!pauseUnfocused || document.hasFocus());
  const [running, setRunning] = useState(read);
  useEffect(() => {
    const update = () => setRunning(document.visibilityState === "visible" && (!pauseUnfocused || document.hasFocus()));
    update();
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
    };
  }, [pauseUnfocused]);
  return running;
}

interface ProviderProps {
  enabled: boolean;
  quality: Quality;
  pauseUnfocused: boolean;
  children: ReactNode;
}

export function MotionProvider({ enabled, quality, pauseUnfocused, children }: ProviderProps) {
  const reducedMotion = useReducedMotion();
  const running = useWindowRunning(pauseUnfocused);
  const [webgl] = useState(detectWebGL);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.quality = quality;
    root.dataset.motion = enabled ? "on" : "off";
  }, [quality, enabled]);

  const value: MotionState = { enabled, quality, profile: qualityProfiles[quality], reducedMotion, running, webgl };
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionState {
  const value = useContext(MotionContext);
  if (!value) throw new Error("useMotion must be used inside MotionProvider");
  return value;
}

export interface ThemeTokens {
  accent: string;
  success: string;
  warning: string;
  error: string;
}

function readTokens(): ThemeTokens {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    accent: get("--accent", "#ff7a1a"),
    success: get("--success", "#22c55e"),
    warning: get("--warning", "#f59e0b"),
    error: get("--error", "#ef4444"),
  };
}

/** Live CSS colour tokens; updates whenever the root data-theme attribute changes. */
export function useThemeTokens(): ThemeTokens {
  const [tokens, setTokens] = useState(readTokens);
  useEffect(() => {
    const observer = new MutationObserver(() => setTokens(readTokens()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return tokens;
}