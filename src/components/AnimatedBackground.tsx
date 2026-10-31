import { useEffect, useRef } from "react";
import styles from "./AnimatedBackground.module.css";

interface Props {
  kind: "stars" | "nebula";
}

const STAR_COUNT = 125;
const WARP_SPEED = 0.0035;

interface Star {
  x: number;
  y: number;
  z: number;
}

function spawnStar(): Star {
  return { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() };
}

export default function AnimatedBackground({ kind }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = Array.from({ length: STAR_COUNT }, spawnStar);
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastDraw = 0;
    let isVisible = !document.hidden;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (!reduceMotion) {
          star.z -= WARP_SPEED;
          if (star.z <= 0.02) stars[i] = spawnStar();
        }
        const current = stars[i];
        const k = 1 / current.z;
        const sx = width / 2 + current.x * k * width * 0.25;
        const sy = height / 2 + current.y * k * height * 0.25;
        if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) {
          if (!reduceMotion) stars[i] = spawnStar();
          continue;
        }
        const depth = 1 - current.z;
        const radius = Math.max(0.3, depth * 2.2);
        const alpha = Math.min(1, depth * 1.4 + 0.2);
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 232, 255, ${alpha})`;
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Cap decorative particles to 30 FPS and pause while the desktop window
    // is hidden; VPN latency/gaming performance is more important than flair.
    const loop = (now: number) => {
      if (isVisible && now - lastDraw >= 33) {
        draw();
        lastDraw = now;
      }
      frame = requestAnimationFrame(loop);
    };
    const onVisibility = () => { isVisible = !document.hidden; };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (reduceMotion) draw();
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [kind]);

  if (kind === "nebula") {
    return (
      <div className={styles.layer} aria-hidden="true">
        <span className={`${styles.blob} ${styles.blobTeal}`} />
        <span className={`${styles.blob} ${styles.blobRose}`} />
      </div>
    );
  }

  return (
    <div className={styles.layer} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}