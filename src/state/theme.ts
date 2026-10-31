export type SceneId =
  | "ember"
  | "deep-space"
  | "nebula"
  | "meteor-storm"
  | "planet-orbit"
  | "galaxy-core"
  | "solar-flare"
  | "aurora"
  | "black-hole"
  | "cosmic-grid";

export type ThemeId =
  | SceneId
  | "obsidian"
  | "pitch-black"
  | "graphite"
  | "ocean"
  | "forest"
  | "arctic"
  | "gold";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  accent: string;
  background: string;
  group: "cosmic" | "classic";
  scene?: SceneId;
}

export const themes: ThemeOption[] = [
  { id: "ember", name: "Aspect Ember", description: "Obsidian black, amber engine core, orbital plasma rings", accent: "#ff7a1a", background: "#0b0704", group: "cosmic", scene: "ember" },
  { id: "deep-space", name: "Deep Space", description: "Layered starfield with parallax depth and cosmic dust", accent: "#7aa7ff", background: "#03050c", group: "cosmic", scene: "deep-space" },
  { id: "nebula", name: "Nebula", description: "Teal, violet and rose clouds in slow organic motion", accent: "#2dd4bf", background: "#060d12", group: "cosmic", scene: "nebula" },
  { id: "meteor-storm", name: "Meteor Storm", description: "Randomised meteor streaks with glowing trails", accent: "#ff8f5a", background: "#0a0610", group: "cosmic", scene: "meteor-storm" },
  { id: "planet-orbit", name: "Planet Orbit", description: "Ringed gas giant, orbiting moons and orbital paths", accent: "#f2b46d", background: "#05070d", group: "cosmic", scene: "planet-orbit" },
  { id: "galaxy-core", name: "Galaxy Core", description: "Rotating spiral arms around a luminous nucleus", accent: "#a78bfa", background: "#06040f", group: "cosmic", scene: "galaxy-core" },
  { id: "solar-flare", name: "Solar Flare", description: "Living sun corona with soft plasma currents", accent: "#ffb020", background: "#0d0603", group: "cosmic", scene: "solar-flare" },
  { id: "aurora", name: "Aurora", description: "Rippling northern-light curtains over the horizon", accent: "#34d399", background: "#04121a", group: "cosmic", scene: "aurora" },
  { id: "black-hole", name: "Black Hole", description: "Gravity well with a fine glowing accretion ring", accent: "#f4c27a", background: "#020203", group: "cosmic", scene: "black-hole" },
  { id: "cosmic-grid", name: "Cosmic Grid", description: "Holographic linework with travelling data pulses", accent: "#22d3ee", background: "#030812", group: "cosmic", scene: "cosmic-grid" },
  { id: "obsidian", name: "Obsidian", description: "Focused blue security workspace", accent: "#2f6df6", background: "#0a0e14", group: "classic" },
  { id: "pitch-black", name: "Pitch Black", description: "OLED black with sharp contrast", accent: "#f5f5f5", background: "#000000", group: "classic" },
  { id: "graphite", name: "Graphite", description: "Neutral charcoal with silver detail", accent: "#a9b5c4", background: "#17191d", group: "classic" },
  { id: "ocean", name: "Ocean", description: "Deep blue with cyan signal", accent: "#22b8cf", background: "#07151d", group: "classic" },
  { id: "forest", name: "Forest", description: "Grounded green security theme", accent: "#4fbd82", background: "#09130f", group: "classic" },
  { id: "gold", name: "Gold Leaf", description: "Premium black with gilded accents", accent: "#d4a646", background: "#0c0a06", group: "classic" },
  { id: "arctic", name: "Arctic", description: "Bright, calm daytime workspace", accent: "#0f6f8f", background: "#edf4f7", group: "classic" },
];

const legacyThemeIds: Record<string, ThemeId> = { galaxy: "galaxy-core" };

export const defaultTheme: ThemeId = "ember";

export function resolveThemeId(saved: string | null): ThemeId {
  if (!saved) return defaultTheme;
  const migrated = legacyThemeIds[saved] ?? saved;
  return themes.some((option) => option.id === migrated) ? (migrated as ThemeId) : defaultTheme;
}