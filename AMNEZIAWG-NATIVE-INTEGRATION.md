# Aspect Studio VPN — AmneziaWG native integration handoff

**Status:** The React frontend on this branch supports engine selection and restores all 17 existing themes. The Windows .NET/WPF host is **not present in this repository** and has **not** been modified. The frontend must not advertise AmneziaWG as usable unless the native host explicitly reports capability.

## Verified test environment (2026-11-02)

- Oracle Ubuntu ARM64 in Marseille: public IPv4 `84.235.229.141`.
- Working AmneziaWG-Go 3.1 userspace interface `awg0` on **UDP 51820**.
- Tunnel address: server `10.66.67.1/24`, first test client `10.66.67.2/32`.
- Windows AmneziaWG 3.1 client successfully handshakes, routes public IPv4 through Oracle, and reaches Roblox.
- OpenVPN **TCP 8444** remains working fallback.
- Oracle automatic-start unit `aspect-amneziawg.service` has been enabled but not confirmed by a reboot test.
- Never commit private client/server keys, header-protection keys, .conf profiles, SSH keys, credentials, or access tokens.

## Native message contract

Preserve the existing `window.chrome.webview.postMessage` and `command.result` requestId contract. No browser-only simulation is permitted to claim a real VPN connection.

The host should include fields in its existing `native.ready` event:

```json
{
  "type": "native.ready",
  "payload": {
    "supportedEngines": ["openvpn", "amneziawg"],
    "vpnEngine": "openvpn"
  }
}
```

Only advertise `"amneziawg"` after its Windows runtime/service is actually installed, usable, and approved for this app. Older hosts that omit this field remain **OpenVPN-only** in the UI.

The UI requests engine selection through the **existing** `updateSettings` action using `{"vpnEngine":"amneziawg"}` or `{"vpnEngine":"openvpn"}`. The native host MUST:

1. Validate requested enum and host capability.
2. Reject engine changes while any VPN session is connected, connecting, or disconnecting.
3. Persist the selection atomically, clear engine-incompatible profiles, and return the existing `command.result` response.
4. Return native `vpn.state` events containing `payload.engine`, alongside the real connection state.
5. Implement the existing `importProfile` and `fetchProfile` actions with optional `vpnEngine` request field; enforce format and server allowlist server-side, not merely from file extension.
6. Preserve `signIn`, TPM-backed device approval, `ownerRole`, and the rest of the current authorization model.

## Provisioning and client security

- Issue a **different AmneziaWG key pair per approved device**. The current manual test profile is not suitable to redistribute.
- Store private keys and header protection material in protected app storage; never embed a reusable .conf into the installer or public frontend assets.
- Use the existing signed/authorized control plane to provision or revoke device-specific peers on the Oracle `awg0` server. A revoked device must no longer be accepted by the server; UI hiding is insufficient.
- Validate the approved endpoint/port, interface address, peer keys, tunnel routes, DNS configuration, and Amnezia obfuscation parameters.
- Do not run plain WireGuard concurrently with AmneziaWG, and handle stale Wintun adapters with explicit user-visible errors and safe recovery. Avoid deleting unrelated adapters.
- Report Connected only after validated tunnel handshake and usable networking; do not infer connection from a process start.
- Return truthful connection stats for the selected engine. OpenVPN TCP probe times are not in-game Roblox latency.
- Preserve DNS and IPv6 leak protections (IPv6 is not currently routed on this Oracle server), while avoiding unintentional internet blackholes.
- Have an isolated OpenVPN TCP/8444 fallback that the user may select manually when AmneziaWG UDP fails.

## Windows installer and build

Update the **separate original .NET 8 WPF/WebView2 host**. Verify the exact AmneziaWG Windows service interface and licensing for redistribution before bundling runtime binaries. Ship compatible signed drivers/runtime, and never require a second separately launched VPN program for the integrated engine. Keep the current UI/assets (themes, music, title bar, owner console, branding) untouched.

Integration tests on Windows 10 22H2:

1. Fresh install; app launches with runtime and virtual adapter available.
2. Rejected/pending devices cannot obtain functional tunnel profiles.
3. Approved devices provision distinct AmneziaWG peers and connect over UDP/51820.
4. Disconnect cleans routes and DNS; engine switching works only when disconnected.
5. Network interruptions recover without duplicate credential prompts or orphaned Wintun devices.
6. Current OpenVPN TCP/8444 still connects with correct authentication.
7. Themes and music settings persist, animations pause while gaming.
8. A 20+ minute Roblox session remains stable; test actual in-game ping/packet loss.
9. Oracle reboot test validates dedicated userspace service and retained firewall rules before release.

**This branch is only a frontend integration and host-side implementation contract; it is not a new distributable Windows installer.**
