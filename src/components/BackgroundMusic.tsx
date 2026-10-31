import { useEffect, useRef } from "react";
import styles from "./BackgroundMusic.module.css";

/** Bundled original audio only. No remote YouTube iframe, third-party content
 * or IP address disclosure before connecting the VPN. */
export type MusicTrackId = "track-1" | "track-2";
export const musicTracks: { id: MusicTrackId; label: string }[] = [
  { id: "track-1", label: "Ad Infinitum" },
  { id: "track-2", label: "Reflections Of Reality" },
];

interface Props { enabled: boolean; track: MusicTrackId; volume: number }
const offlineSource = (track: MusicTrackId): string => `/audio/${track}.mp3`;
let gestureAudio: HTMLAudioElement | null = null;

export function unlockMusicPlayback(track?: MusicTrackId): void {
  const player = gestureAudio;
  if (!player) return;
  if (track && !player.currentSrc.endsWith(offlineSource(track))) {
    player.src = offlineSource(track);
    player.load();
  }
  void player.play().catch(() => { /* User gesture or bundled file may be required. */ });
}

export default function BackgroundMusic({ enabled, track, volume }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const player = audioRef.current;
    gestureAudio = player;
    return () => { if (gestureAudio === player) gestureAudio = null; };
  }, []);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) return;
    player.volume = Math.max(0, Math.min(1, volume / 100));
    player.muted = volume === 0;
  }, [volume]);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) return;
    player.pause();
    player.src = offlineSource(track);
    player.loop = true;
    player.load();
    if (enabled) void player.play().catch(() => { /* Retry with user gesture. */ });
  }, [enabled, track]);

  useEffect(() => {
    if (enabled) return;
    audioRef.current?.pause();
  }, [enabled]);

  return (
    <audio ref={audioRef} className={styles.player} preload="auto" loop aria-hidden="true" />
  );
}