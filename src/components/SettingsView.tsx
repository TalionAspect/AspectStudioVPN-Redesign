import { useEffect, useState, type CSSProperties } from "react";
import Button from "./Button";
import { SettingsIcon, LockIcon, CpuIcon, CheckIcon } from "./icons";
import type { AppState } from "../state/types";
import type { ThemeId } from "../state/theme";
import ThemePicker from "./ThemePicker";
import type { Quality } from "../state/motion";
import { musicTracks, unlockMusicPlayback, type MusicTrackId } from "./BackgroundMusic";
import styles from "./SettingsView.module.css";

interface Props {
  state: AppState;
  onCheckUpdates: () => Promise<{ok: boolean; detail: string}>;
  onInstallUpdate: () => Promise<{ok: boolean; detail: string}>;
  onUpdate: (patch: Partial<Pick<AppState, "authUrl" | "enginePath" | "autoReconnect" | "autoInstallUpdates" | "vpnEngine">>) => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  animatedBg: boolean;
  onAnimatedBgChange: (value: boolean) => void;
  quality: Quality;
  onQualityChange: (value: Quality) => void;
  pauseUnfocused: boolean;
  onPauseUnfocusedChange: (value: boolean) => void;
  musicOn: boolean;
  onMusicChange: (value: boolean) => void;
  musicTrack: MusicTrackId;
  onMusicTrackChange: (track: MusicTrackId) => void;
  musicVolume: number;
  onMusicVolumeChange: (volume: number) => void;
}

export default function SettingsView({ state, onUpdate, onCheckUpdates, onInstallUpdate, theme, onThemeChange, animatedBg, onAnimatedBgChange, quality, onQualityChange, pauseUnfocused, onPauseUnfocusedChange, musicOn, onMusicChange, musicTrack, onMusicTrackChange, musicVolume, onMusicVolumeChange }: Props) {
  const [authUrl, setAuthUrl] = useState(state.authUrl);
  const [enginePath, setEnginePath] = useState(state.enginePath);
  const autoConnect = false;
  const [autoReconnect, setAutoReconnect] = useState(state.autoReconnect);
  const [autoInstallUpdates, setAutoInstallUpdates] = useState(state.autoInstallUpdates);
  const killSwitch = false;
  const [saved, setSaved] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const updateAction = async (action: () => Promise<{ok: boolean; detail: string}>) => {
    setUpdateBusy(true);
    try { const result = await action(); setUpdateMessage(result.detail); }
    finally { setUpdateBusy(false); }
  };

  useEffect(() => {
    setAuthUrl(state.authUrl);
    setEnginePath(state.enginePath);
  }, [state.authUrl, state.enginePath]);

  useEffect(() => setAutoInstallUpdates(state.autoInstallUpdates), [state.autoInstallUpdates]);

  const save = () => {
    onUpdate({ authUrl, enginePath, autoReconnect, autoInstallUpdates });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Configure the VPN engine, authorization endpoint, and tunnel
          behavior.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}><SettingsIcon size={16} />Secure automatic updates</div>
        <p className={styles.hint}>Checks and downloads signed releases in the background. Installations can be queued when you exit while disconnected. No update will close an active VPN session; Windows may request administrator approval.</p>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Install verified updates when I exit</div>
            <div className={styles.toggleHint}>Applies only on normal app exit while VPN is already disconnected.</div>
          </div>
          <button className={`${styles.switch} ${autoInstallUpdates ? styles.switchOn : ""}`}
            onClick={() => { const next = !autoInstallUpdates; setAutoInstallUpdates(next); onUpdate({ autoInstallUpdates: next }); }}
            aria-label="Install verified updates on exit" aria-pressed={autoInstallUpdates} />
        </div>
        <p className={styles.hint}>{state.update.detail}</p>
        {state.update.version && <p className={styles.hint}>Latest signed release: {state.update.version}</p>}
        <div className={styles.updateActions}>
          <Button variant="secondary" disabled={updateBusy} onClick={() => void updateAction(onCheckUpdates)}>Check updates</Button>
          <Button disabled={updateBusy || !state.update.staged || state.vpnState !== "Disconnected"}
            onClick={() => void updateAction(onInstallUpdate)}>Install verified update</Button>
        </div>
        {updateMessage && <p className={styles.hint} role="status">{updateMessage}</p>}
        {state.vpnState !== "Disconnected" && state.update.staged && <p className={styles.hint}>Update queued; disconnect when Roblox is finished.</p>}
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}><SettingsIcon size={16} />Split tunneling</div>
        <p className={styles.hint}>Per-app routing is unavailable in this build. It requires a signed Windows Filtering Platform routing component. Until that component is installed and tested, ALL applications follow the VPN's existing full-tunnel policy. No traffic is silently excluded.</p>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <CpuIcon size={16} style={{ color: "var(--accent)" }} />
          Engine
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Connection engine</label>
          <div className={styles.segments} role="group" aria-label="VPN transport engine">
            {([
              { id: "amneziawg", title: "AmneziaWG · UDP 51820" },
              { id: "openvpn", title: "OpenVPN · TCP 8444" },
            ] as const).map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.segment} ${state.vpnEngine === option.id ? styles.segmentActive : ""}`}
                disabled={state.vpnState !== "Disconnected" || !state.supportedEngines.includes(option.id)}
                onClick={() => onUpdate({ vpnEngine: option.id })}
                aria-pressed={state.vpnEngine === option.id}
                title={!state.supportedEngines.includes(option.id) ? "Requires an updated native Windows VPN host" : undefined}
              >
                {option.title}
              </button>
            ))}
          </div>
          {!state.supportedEngines.includes("amneziawg") && (
            <p className={styles.hint} role="status">
              AmneziaWG works as a standalone client. This Windows host has not advertised
              support for running it inside Aspect Studio VPN yet, so the option is locked
              until the native host has been upgraded.
            </p>
          )}
          <p className={styles.hint}>Switch engines only while disconnected. Only the native host can establish a VPN tunnel.</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>OpenVPN core path</label>
          <input
            className={styles.input}
            value={enginePath}
            onChange={(e) => setEnginePath(e.target.value)}
            spellCheck={false}
          />
          <div className={styles.hint}>
            Path to <code>openvpn.exe</code>. The app starts it with
            <code> runas</code> for driver access — Windows shows a UAC prompt.
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Data directory</label>
          <input
            className={styles.input}
            value="%LOCALAPPDATA%\\AspectStudio\\VPN"
            readOnly
            style={{ opacity: 0.7 }}
          />
          <div className={styles.hint}>
            Session secrets and logs are written here and deleted on disconnect.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <LockIcon size={16} style={{ color: "var(--accent)" }} />
          Authorization
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Authorization server URL</label>
          <input
            className={styles.input}
            value={authUrl}
            onChange={(e) => setAuthUrl(e.target.value)}
            spellCheck={false}
          />
          <div className={styles.hint}>
            HTTPS endpoint provided by the owner. Must not contain query
            parameters or fragments.
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <SettingsIcon size={16} style={{ color: "var(--accent)" }} />
          Appearance
        </div>
        <ThemePicker
          theme={theme}
          onThemeChange={onThemeChange}
          animatedBg={animatedBg}
          onAnimatedBgChange={onAnimatedBgChange}
          quality={quality}
          onQualityChange={onQualityChange}
          pauseUnfocused={pauseUnfocused}
          onPauseUnfocusedChange={onPauseUnfocusedChange}
        />
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Background music</div>
            <div className={styles.toggleHint}>
              Ad Infinitum and Reflections Of Reality play from bundled MP3 files, so playback does not depend on the VPN connection.
            </div>
          </div>
          <button
            className={`${styles.switch} ${musicOn ? styles.switchOn : ""}`}
            onClick={() => { if (!musicOn) unlockMusicPlayback(musicTrack); onMusicChange(!musicOn); }}
            aria-label="Background music"
          >
            <span className={styles.switchKnob} />
          </button>
        </div>
        {musicOn && (
          <div className={styles.volumeControl}>
            <label className={styles.volumeLabel} htmlFor="music-volume">Music volume <strong>{musicVolume}%</strong></label>
            <input id="music-volume" type="range" min="0" max="100" step="1"
              className={styles.volumeSlider} value={musicVolume}
              style={{ "--music-fill": `${musicVolume}%` } as CSSProperties}
              onChange={(event) => onMusicVolumeChange(Number(event.target.value))}
              aria-label="Music volume" aria-valuetext={`${musicVolume}%`} />
          </div>
        )}
        {musicOn && (
          <div className={styles.segments} role="group" aria-label="Music track">
            {musicTracks.map((track) => (
              <button
                key={track.id}
                className={`${styles.segment} ${musicTrack === track.id ? styles.segmentActive : ""}`}
                onClick={() => { unlockMusicPlayback(track.id); onMusicTrackChange(track.id); }}
                aria-pressed={musicTrack === track.id}
              >
                {track.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <SettingsIcon size={16} style={{ color: "var(--accent)" }} />
          Tunnel behavior
        </div>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Automatic recovery</div>
            <div className={styles.toggleHint}>
              If the VPN core exits unexpectedly, retry up to 3 times. OpenVPN handles ordinary network reconnections itself. Recovery may prompt for Windows administrator approval.
            </div>
          </div>
          <button className={`${styles.switch} ${autoReconnect ? styles.switchOn : ""}`}
            onClick={() => setAutoReconnect(!autoReconnect)} aria-label="Automatic recovery" aria-pressed={autoReconnect}>
            <span className={styles.switchKnob} />
          </button>
        </div>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Auto-connect on launch</div>
            <div className={styles.toggleHint}>
              Not available in this test build. Start a connection manually.
            </div>
          </div>
          <button
            className={`${styles.switch} ${autoConnect ? styles.switchOn : ""}`}
            disabled
            aria-label="Auto connect"
          >
            <span className={styles.switchKnob} />
          </button>
        </div>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Kill switch</div>
            <div className={styles.toggleHint}>
              Not implemented in this build. Do not treat this control as a working kill switch.
            </div>
          </div>
          <button
            className={`${styles.switch} ${killSwitch ? styles.switchOn : ""}`}
            disabled
            aria-label="Kill switch"
          >
            <span className={styles.switchKnob} />
          </button>
        </div>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Require TPM key</div>
            <div className={styles.toggleHint}>
              Refuse to run if the device identity is not hardware-backed.
            </div>
          </div>
          <button
            className={`${styles.switch} ${state.hardwareBacked ? styles.switchOn : ""}`}
            disabled
            aria-label="Require TPM"
          >
            <span className={styles.switchKnob} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Button onClick={save}>
          <CheckIcon size={16} />
          Save settings
        </Button>
        {saved && (
          <span className={styles.saved}>
            <CheckIcon size={13} />
            Saved
          </span>
        )}
      </div>

      <div className={styles.about}>
        <div className={styles.aboutName}>Aspect Studio VPN</div>
        Frontend v0.8.9 · OpenVPN fallback (TCP 8444) · AmneziaWG support requires updated Windows host<br />
        ECDSA P-256 device identity · TPM 2.0 key storage<br />
        Session tickets are single-use and never replayed.
      </div>
    </div>
  );
}