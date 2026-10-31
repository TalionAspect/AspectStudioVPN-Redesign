# Aspect Studio VPN native UI integration (v0.8.9)

**This ZIP is a frontend-only copy intended for visual redesign.** It is not a complete Windows desktop app and cannot operate a VPN from Bolt's browser preview.

## Read these source files first

- `src/App.tsx` wires the full screen navigation, theming, login, and state.
- `src/state/types.ts` declares `AppState`, `VpnState`, `VpnStats`, and diagnostic types.
- `src/state/useAppState.ts` owns WebView2 messages, state events, and the actual commands; **keep this code working**.
- `src/components/` contains complete screens (SignIn, ConnectView, ProfileView, DiagnosticsView, SettingsView, OwnerView, CreditsView, Sidebar, TitleBar and others).
- `src/state/theme.ts` describes current UI presets; extend rather than replacing semantics.

## Desktop messaging contract

The Windows host is implemented separately and communicates through `window.chrome.webview.postMessage(...)` and `window.chrome.webview.addEventListener("message", ...)`.

Existing action strings called by the frontend: `ready`, `signIn`, `signOut`, `connect`, `disconnect`, `importProfile`, `fetchProfile`, `clearProfile`, `probe`, `networkDoctor`, `repairDnsCache`, `exportDoctor`, `updateSettings`, `checkForUpdates`, `installUpdate`, `ownerList`, `ownerCreate`, `ownerApprove`, `ownerRevoke`, `ownerEnable`, `ownerRole`, `ownerAudit`. Never invent alternate commands.

Existing native message event types in the UI: `command.result`, `native.ready`, `auth.pending`, `auth.signedIn`, `recovery.status`, `auth.restoreUnavailable`, `auth.signedOut`, `vpn.state`, `vpn.traffic`, `update.status`, `profile.accepted`, `profile.provisioning`, `profile.cleared`, `doctor.result`, `network.changed`, `probe.result`. Preserve payload handling and error states.

**State truth:** A VPN connection exists only when the backend reports it. Bolt browser previews must be identified as previews, not functioning VPN sessions.

**Owner security:** Hide owner navigation unless the real role allows it. UI hiding isn't authorization; the native/server permission enforcement remains mandatory.

## Separated sensitive functionality

The real .NET host, Oracle server, certificates, auth data, signed-update private key, SSH credentials, profile secrets, and user-specific settings are deliberately excluded. Do not create dummy credentials or change/update their implementation in the frontend.

Original offline MP3 tracks are also excluded from the designer pack; the playback references remain intact but audio is supplied in the complete release source.

## Integration after Bolt

Copy reviewed *frontend* changes back into the **original full v0.8.9 project**, preserve native `.cs` and server files, install approved npm dependencies, run `npm run build`, then perform a real Windows WebView2 smoke test before publishing any new signed release. Do not deploy directly from Bolt.