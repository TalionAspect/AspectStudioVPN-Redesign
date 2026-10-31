# Aspect Studio VPN — Bolt continuation brief

## Start here

This is the **latest unfinished React + TypeScript + Vite redesign**, uploaded as real source files. It is NOT a starter template and does not require reconstructing a text bundle. Preserve all existing source files and unfinished features.

**Do not start from scratch.** Audit the current source, then implement the remaining work.

## First priority — make the existing project build

- Inspect `package.json`, `src/App.tsx`, `src/components/`, `src/space/`, `src/state/`.
- Run `npm install`, `npm run build` and resolve build/runtime errors. If package dependencies are missing, add only those actually required.
- Integrate `src/space/SpaceBackground.tsx`, `src/space/ConnectionCore.tsx` and `src/components/ThemePicker.tsx` with `src/App.tsx` and the settings page; preserve completed effects.
- Keep `public/aspect-logo.svg` and `public/aspect-app-icon.svg` as the current bundled logo assets.
- Preserve the native WebView2 bridge and all real application message names; see `NATIVE-BRIDGE-INTEGRATION.md` and `src/state/useAppState.ts`.

## Cinematic 3D design vision

The UI should feel like a professional space observatory / futuristic gaming workstation, with genuine animated depth and interactions rather than a static website or flat dashboard.

Implement 10 distinctive animated theme presets:
1. Aspect Ember — orange/obsidian plasma engine, orange orbital rings
2. Deep Space — multilayer starfield and drifting cosmic dust
3. Nebula — volumetric-style soft cosmic clouds, slow organic motion
4. Meteor Storm — moving meteors with real trails and varied timing
5. Planet Orbit — detailed original rotating planets, rings, orbital motion
6. Galaxy Core — swirling luminous spiral stars
7. Solar Flare — tasteful sun corona and plasma arcs
8. Aurora — flowing light curtains and colors
9. Black Hole — accretion ring around a dark center
10. Cosmic Grid — holographic data grid, glowing pulses

Three.js / React Three Fiber / shaders may be used when appropriate, but prefer optimized effects compatible with an embedded Windows WebView2 runtime. The original Star Walk 2 comparison is a request for astronomical ambience, not permission to reproduce copyrighted assets.

## Real VPN state drives effects

Disconnected: dim idle core. Connecting: rings accelerate and energy builds. Connected: confirmed animation and subtle traffic reactivity. Reconnecting: pulsed recovery state. Error: visible warning state. Connect/disconnect UI actions must invoke the original native bridge; NEVER fake a successful connection or generate fabricated server statistics.

Keep all essential pages and interactions: Sign In and Remember Me, device approval, Connect, Profiles, Diagnostics/Network Doctor, Owner Console, role management, music player, Settings, secure automatic updates, title-bar controls, notifications, logs.

## Performance and desktop polish

Add selectable Eco / Balanced / Cinematic quality modes; stop/throttle effects when minimized, reduced-motion support, proper cleanup of animation frames, capped particle counts, no tracking, no external script injection. Ensure controls fit desktop windows, handle 960x600 up to maximized displays, Windows DPI scaling, fingerprints in one truncated line with Copy, consistent margins/typography/button spacing.

## Do not change security-sensitive interfaces

Never modify the Windows .NET backend, passwords, TPM keys, VPN profiles, Oracle setup, update verification or cryptographic keys. This repository is a frontend redesign, not the full VPN engine.

## Output requirements

1. Review what is already complete and what's unfinished.
2. Build on the existing project rather than replacing it.
3. Finish theme engine, animated backgrounds, page redesign, responsive layout and native integration.
4. Verify build and report actual tests performed, without claiming Windows/Oracle runtime testing from browser preview.
5. Commit progress in GitHub to preserve work across AI usage limits.
