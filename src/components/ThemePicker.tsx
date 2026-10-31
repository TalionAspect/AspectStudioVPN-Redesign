import type { CSSProperties } from "react";
import { themes, type ThemeId } from "../state/theme";
import { qualityIds, qualityProfiles, type Quality } from "../state/motion";
import styles from "./ThemePicker.module.css";

interface Props {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  animatedBg: boolean;
  onAnimatedBgChange: (value: boolean) => void;
  quality: Quality;
  onQualityChange: (value: Quality) => void;
  pauseUnfocused: boolean;
  onPauseUnfocusedChange: (value: boolean) => void;
}

const groups: { id: "cosmic" | "classic"; title: string; caption: string }[] = [
  { id: "cosmic", title: "Animated environments", caption: "Real-time WebGL scenes" },
  { id: "classic", title: "Classic", caption: "Static, lowest power" },
];

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint: string }) {
  return (
    <label className={styles.switchRow}>
      <span className={styles.switchText}>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className={styles.switchInput} />
      <span className={styles.switchTrack} aria-hidden="true"><span /></span>
    </label>
  );
}

export default function ThemePicker({ theme, onThemeChange, animatedBg, onAnimatedBgChange, quality, onQualityChange, pauseUnfocused, onPauseUnfocusedChange }: Props) {
  return (
    <div className={styles.picker}>
      {groups.map((group) => (
        <div key={group.id} className={styles.group}>
          <div className={styles.groupHead}>
            <span>{group.title}</span>
            <small>{group.caption}</small>
          </div>
          <div className={styles.grid} role="radiogroup" aria-label={`${group.title} themes`}>
            {themes
              .filter((option) => option.group === group.id)
              .map((option) => {
                const selected = option.id === theme;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.card} ${selected ? styles.selected : ""}`}
                    onClick={() => onThemeChange(option.id)}
                    style={{ "--swatch-accent": option.accent, "--swatch-bg": option.background } as CSSProperties}
                  >
                    <span className={styles.preview} data-scene={option.scene ?? "classic"} data-live={animatedBg ? "on" : "off"} aria-hidden="true">
                      <i />
                    </span>
                    <span className={styles.meta}>
                      <strong>{option.name}</strong>
                      <small>{option.description}</small>
                    </span>
                    {selected && <span className={styles.check} aria-hidden="true" />}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className={styles.controls}>
        <Switch checked={animatedBg} onChange={onAnimatedBgChange} label="Animated environments" hint="Turn off to render no background animation at all." />
        <div className={styles.qualityBlock} aria-disabled={!animatedBg}>
          <div className={styles.groupHead}>
            <span>Visual quality</span>
            <small>{qualityProfiles[quality].hint}</small>
          </div>
          <div className={styles.segmented} role="radiogroup" aria-label="Visual quality">
            {qualityIds.map((id) => (
              <button key={id} type="button" role="radio" aria-checked={quality === id} disabled={!animatedBg} className={quality === id ? styles.segmentActive : undefined} onClick={() => onQualityChange(id)}>
                {qualityProfiles[id].label}
              </button>
            ))}
          </div>
        </div>
        <Switch checked={pauseUnfocused} onChange={onPauseUnfocusedChange} label="Pause while gaming" hint="Freeze effects when this window loses focus. Always paused when minimised." />
      </div>
    </div>
  );
}