import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { MinusIcon, SquareIcon, XIcon } from "./icons";
import styles from "./TitleBar.module.css";

interface Props {
  designDemo: boolean;
  musicPlaying: boolean;
  musicVolume: number;
}

type WindowAction = "windowMinimize" | "windowMaximize" | "windowClose" |
  "windowDragStart" | "windowDragMove" | "windowDragEnd";

function sendWindowAction(action: WindowAction) {
  window.chrome?.webview?.postMessage?.({ action });
}

type DragPointer = { pointerId: number; startX: number; startY: number; started: boolean };

export default function TitleBar({ designDemo, musicPlaying, musicVolume }: Props) {
  const desktop = !designDemo;
  const pendingDrag = useRef<DragPointer | null>(null);
  const [dragging, setDragging] = useState(false);

  const stopDrag = (event?: ReactPointerEvent<HTMLElement>) => {
    const active = pendingDrag.current;
    if (!active || (event && event.pointerId !== active.pointerId)) return;
    pendingDrag.current = null;
    if (active.started) sendWindowAction("windowDragEnd");
    setDragging(false);
    if (event?.currentTarget.hasPointerCapture(active.pointerId)) {
      event.currentTarget.releasePointerCapture(active.pointerId);
    }
  };

  return (
    <header
      className={`${styles.bar} ${dragging ? styles.barDragging : ""}`}
      onPointerDown={(event) => {
        if (!desktop || event.button !== 0 || !event.isPrimary || event.detail > 1 ||
          (event.target as HTMLElement).closest("button, input, a, [data-no-window-drag]")) return;
        pendingDrag.current = {
          pointerId: event.pointerId,
          startX: event.screenX,
          startY: event.screenY,
          started: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const pending = pendingDrag.current;
        if (!pending || pending.pointerId !== event.pointerId) return;
        if ((event.buttons & 1) === 0) { stopDrag(event); return; }
        if (!pending.started) {
          const distance = Math.hypot(event.screenX - pending.startX, event.screenY - pending.startY);
          if (distance < 4) return; // Clicks and double-clicks aren't drags.
          pending.started = true;
          setDragging(true);
          sendWindowAction("windowDragStart");
        }
        sendWindowAction("windowDragMove");
        event.preventDefault();
      }}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
      onDoubleClick={(event) => {
        if (desktop && !(event.target as HTMLElement).closest("button, input, a, [data-no-window-drag]")) {
          stopDrag();
          sendWindowAction("windowMaximize");
        }
      }}
    >
      <div className={styles.brand}>
        <span className={styles.brandMark}><img src="/aspect-logo.svg" alt="Aspect Studio" draggable={false} /></span>
        Aspect Studio VPN
        <span className={styles.brandSub}>Desktop Client <span className={styles.statusDot} /> {designDemo ? "DESIGN DEMO" : "Secure workspace"}</span>
      </div>
      <div className={styles.controls} data-no-window-drag>
        {musicPlaying && (
          <span className={styles.nowPlaying} title={`Background music ${musicVolume}%`}>
            <span className={styles.pulse} aria-hidden="true" />
            Music · {musicVolume}%
          </span>
        )}
        <button className={styles.ctrl} title="Minimize to system tray" aria-label="Minimize to system tray" disabled={!desktop}
          onClick={() => sendWindowAction("windowMinimize") }>
          <MinusIcon size={15} />
        </button>
        <button className={styles.ctrl} title="Maximize / restore" aria-label="Maximize or restore" disabled={!desktop}
          onClick={() => sendWindowAction("windowMaximize")}>
          <SquareIcon size={13} />
        </button>
        <button className={`${styles.ctrl} ${styles.close}`} title="Close" aria-label="Close window" disabled={!desktop}
          onClick={() => sendWindowAction("windowClose")}>
          <XIcon size={15} />
        </button>
      </div>
    </header>
  );
}