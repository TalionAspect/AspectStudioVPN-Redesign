# Aspect Studio VPN — Cinematic UI Redesign

This is the private **frontend-only** React + TypeScript + Vite project for Aspect Studio VPN, prepared for further design work in Bolt.

## Import / development

1. Import this **private GitHub repository** into Bolt after authorizing access.
2. Inspect `src/App.tsx`, `src/state/useAppState.ts`, `src/state/types.ts`, `src/space/`, and `src/components/ThemePicker.tsx`.
3. Restore dependencies with `npm install`; run `npm run build`.
4. Preserve all existing WebView2 message names and native actions. Browser preview is not proof of real VPN connectivity.
5. Continue integrating the unfinished 3D/cinematic scenes with the current app. Do **not** discard existing components or replace real VPN functions with dummy simulations.

Design goal: ten high-quality animated cosmic themes (nebulae, orbiting planets, meteors, starfields, aurora, solar flare, black hole, and more), with configurable animation intensity and low-performance overhead.

See `NATIVE-BRIDGE-INTEGRATION.md` and the `src/space/` components for implementation details.

**Security:** This repo deliberately excludes the Windows VPN host, Oracle credentials, private SSH keys, .ovpn profiles, update-signing material and server databases. Do not commit any of those.
