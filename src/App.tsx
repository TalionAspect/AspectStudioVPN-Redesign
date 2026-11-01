import { useEffect, useState, type ReactNode } from "react";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import SignIn from "./components/SignIn";
import ConnectView from "./components/ConnectView";
import ProfileView from "./components/ProfileView";
import DiagnosticsView from "./components/DiagnosticsView";
import SettingsView from "./components/SettingsView";
import CreditsView from "./components/CreditsView";
import OwnerView from "./components/OwnerView";
import SpaceBackground from "./space/SpaceBackground";
import { MotionProvider, resolveQuality, type Quality } from "./state/motion";
import BackgroundMusic, { musicTracks, type MusicTrackId } from "./components/BackgroundMusic";
import { useAppState } from "./state/useAppState";
import type { ViewId } from "./state/types";
import { themes, resolveThemeId, type ThemeId } from "./state/theme";
import styles from "./App.module.css";

export default function App() {
  const vpn = useAppState();
  const [view, setView] = useState<ViewId>("connect");
  useEffect(() => { if (view === "owner" && !vpn.state.isOwner) setView("connect"); }, [view, vpn.state.isOwner]);
  const [theme, setTheme] = useState<ThemeId>(() => {
    const saved = window.localStorage.getItem("aspect-vpn-theme");
    return resolveThemeId(saved);
  });
  const [animatedBg, setAnimatedBg] = useState(() => window.localStorage.getItem("aspect-vpn-animated-bg") !== "off");
  const [quality, setQuality] = useState<Quality>(() => resolveQuality(window.localStorage.getItem("aspect-vpn-quality")));
  const [pauseUnfocused, setPauseUnfocused] = useState(() => window.localStorage.getItem("aspect-vpn-pause-unfocused") !== "off");
  const [musicOn, setMusicOn] = useState(() => window.localStorage.getItem("aspect-vpn-music") === "on");
  const [musicTrack, setMusicTrack] = useState<MusicTrackId>(() => {
    const saved = window.localStorage.getItem("aspect-vpn-music-track");
    return musicTracks.some((track) => track.id === saved) ? (saved as MusicTrackId) : musicTracks[0].id;
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = Number(window.localStorage.getItem("aspect-vpn-music-volume") ?? "30");
    return Number.isFinite(saved) ? Math.max(0, Math.min(100, Math.round(saved))) : 30;
  });

  const themeOption = themes.find((option) => option.id === theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("aspect-vpn-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("aspect-vpn-animated-bg", animatedBg ? "on" : "off");
  }, [animatedBg]);

  useEffect(() => { window.localStorage.setItem("aspect-vpn-quality", quality); }, [quality]);
  useEffect(() => { window.localStorage.setItem("aspect-vpn-pause-unfocused", pauseUnfocused ? "on" : "off"); }, [pauseUnfocused]);

  useEffect(() => {
    window.localStorage.setItem("aspect-vpn-music", musicOn ? "on" : "off");
  }, [musicOn]);

  useEffect(() => {
    window.localStorage.setItem("aspect-vpn-music-track", musicTrack);
  }, [musicTrack]);

  useEffect(() => {
    window.localStorage.setItem("aspect-vpn-music-volume", String(musicVolume));
  }, [musicVolume]);

  const frame = (content: ReactNode) => (
    <>
      <MotionProvider enabled={animatedBg} quality={quality} pauseUnfocused={pauseUnfocused}>
      <div className={styles.window} data-theme={theme}>
        <SpaceBackground scene={themeOption?.scene} />
        <div className={styles.content}>
          <TitleBar designDemo={!vpn.nativeAvailable} musicPlaying={musicOn} musicVolume={musicVolume} />
          {content}
        </div>
      </div>
      </MotionProvider>
      <BackgroundMusic enabled={musicOn} track={musicTrack} volume={musicVolume} />
    </>
  );

  if (!vpn.state.signedIn) {
    return frame(
      <SignIn
        state={vpn.state}
        onSignIn={vpn.signIn}
        onApprove={vpn.approveDevice}
        nativeAvailable={vpn.nativeAvailable}
      />
    );
  }

  return frame(
    <div className={styles.body}>
      <Sidebar
        current={view}
        onNavigate={setView}
        state={vpn.state}
        onSignOut={vpn.signOut}
        compact={false}
      />
      <main className={styles.main}>
        {view === "connect" && (
          <ConnectView
            state={vpn.state}
            onToggle={vpn.toggleConnection}
            onNavigateProfile={() => setView("profile")}
          />
        )}
        {view === "profile" && (
          <ProfileView
            state={vpn.state}
            nativeAvailable={vpn.nativeAvailable}
            onImport={vpn.importProfile}
            onClear={vpn.clearProfile}
            onFetch={vpn.fetchProfile}
          />
        )}
        {view === "diagnostics" && (
          <DiagnosticsView state={vpn.state} onProbe={vpn.runProbe}
            onDoctor={vpn.runNetworkDoctor} onRepairDns={vpn.repairDnsCache} onExport={vpn.exportDoctor}
            nativeAvailable={vpn.nativeAvailable} />
        )}
        {view === "settings" && (
          <SettingsView
            state={vpn.state}
            onUpdate={vpn.updateSettings}
            onCheckUpdates={vpn.checkUpdates}
            onInstallUpdate={vpn.installUpdate}
            theme={theme}
            onThemeChange={setTheme}
            animatedBg={animatedBg}
            onAnimatedBgChange={setAnimatedBg}
            quality={quality}
            onQualityChange={setQuality}
            pauseUnfocused={pauseUnfocused}
            onPauseUnfocusedChange={setPauseUnfocused}
            musicOn={musicOn}
            onMusicChange={setMusicOn}
            musicTrack={musicTrack}
            onMusicTrackChange={setMusicTrack}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
          />
        )}
        {view === "credits" && <CreditsView />}
        {view === "owner" && vpn.state.isOwner && (
          <OwnerView onList={vpn.ownerList} onAudit={vpn.ownerAudit} onCreate={vpn.ownerCreate}
            onApprove={vpn.ownerApprove} onRevoke={vpn.ownerRevoke} onEnable={vpn.ownerEnable} onRoleChange={vpn.ownerRole} role={vpn.state.role} />
        )}
      </main>
    </div>
  );
}