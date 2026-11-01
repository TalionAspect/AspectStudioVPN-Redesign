import { useCallback, useEffect, useRef, useState } from "react";
import { initialState, type AppState, type DoctorReport, type LogEntry, type VpnEngine, type VpnState } from "./types";

export type OwnerAccount = { username: string; enabled: boolean; role: string; profileState: string };
export type OwnerDevice = { username: string; deviceId: string; approved: boolean; hardwareBacked: boolean; created: number };
export type OwnerData = { actorRole?: "owner" | "admin"; accounts: OwnerAccount[]; devices: OwnerDevice[] };
type CommandResult = { ok: boolean; detail: string; pending?: boolean; data?: OwnerData };
type NativeMessage = { type: string; payload: Record<string, unknown> };
type PendingCommand = (result: CommandResult) => void;

function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function isNativeBridgeAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.chrome?.webview?.postMessage === "function";
}

function pushLog(
  set: React.Dispatch<React.SetStateAction<AppState>>,
  level: LogEntry["level"],
  source: string,
  message: string
) {
  set((s) => ({
    ...s,
    logs: [...s.logs, { time: nowTime(), level, source, message }].slice(-400),
  }));
}

export function useAppState() {
  const nativeAvailable = isNativeBridgeAvailable();
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useRef(state);
  const pending = useRef(new Map<string, PendingCommand>());
  const trafficSample = useRef<{ at: number; inBytes: number; outBytes: number } | null>(null);
  const probeSamples = useRef<boolean[]>([]);
  const latencySamples = useRef<number[]>([]);
  stateRef.current = state;

  const setVpnState = useCallback((next: VpnState, detail: string) => {
    setState((s) => ({ ...s, vpnState: next, stateDetail: detail }));
  }, []);

  const sendNative = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    return new Promise<CommandResult>((resolve) => {
      if (!window.chrome?.webview?.postMessage) {
        resolve({ ok: false, detail: "Native Windows controls are unavailable in this preview." });
        return;
      }
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timer = window.setTimeout(() => {
        if (pending.current.delete(requestId)) {
          resolve({ ok: false, detail: "The Windows host did not respond. Try again." });
        }
      }, action === "checkForUpdates" ? 20 * 60 * 1000 : 45000);
      pending.current.set(requestId, (result) => {
        window.clearTimeout(timer);
        resolve(result);
      });
      window.chrome.webview.postMessage({ action, requestId, ...payload });
    });
  }, []);

  useEffect(() => {
    if (!nativeAvailable || !window.chrome?.webview) return;
    const receive = (event: MessageEvent<NativeMessage>) => {
      const message = typeof event.data === "string" ? JSON.parse(event.data) as NativeMessage : event.data;
      const payload = message.payload ?? {};
      if (message.type === "command.result") {
        const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
        pending.current.get(requestId)?.({
          ok: payload.ok === true,
          detail: String(payload.detail ?? ""),
          pending: payload.pending === true,
          data: payload.data as OwnerData | undefined,
        });
        pending.current.delete(requestId);
        return;
      }
      if (message.type === "native.ready") {
        // Only the native host can advertise a working engine; older hosts remain OpenVPN-only.
        const supportedEngines: VpnEngine[] = ["openvpn"];
        if (Array.isArray(payload.supportedEngines) && payload.supportedEngines.includes("amneziawg")) supportedEngines.push("amneziawg");
        const vpnEngine: VpnEngine = payload.vpnEngine === "amneziawg" && supportedEngines.includes("amneziawg") ? "amneziawg" : "openvpn";
        setState((s) => ({
          ...s,
          supportedEngines,
          vpnEngine,
          deviceId: String(payload.deviceId ?? s.deviceId),
          hardwareBacked: payload.hardwareBacked === true,
          autoReconnect: payload.autoReconnect === true,
          autoInstallUpdates: payload.autoInstallUpdates !== false,
          profilePath: typeof payload.profilePath === "string" ? payload.profilePath : null,
          profileValid: typeof payload.profilePath === "string",
        }));
        pushLog(setState, "info", "device", "Native device identity loaded.");
      } else if (message.type === "auth.pending") {
        setState((s) => ({ ...s, deviceApproved: false }));
        pushLog(setState, "warn", "auth", String(payload.detail ?? "Device approval is pending."));
      } else if (message.type === "auth.signedIn") {
        setState((s) => ({ ...s, signedIn: true, username: String(payload.username ?? ""), isOwner: payload.isOwner === true, role: payload.role === "owner" || payload.role === "admin" ? payload.role : "member", deviceApproved: true }));
        pushLog(setState, "info", "auth", "Challenge signed with device key. Session approved.");
      } else if (message.type === "recovery.status") {
        pushLog(setState, "warn", "recovery", String(payload.detail ?? "VPN reconnection status"));
      } else if (message.type === "auth.restoreUnavailable") {
        pushLog(setState, "warn", "auth", String(payload.detail ?? "Could not restore remembered login."));
      } else if (message.type === "auth.signedOut") {
        setState((s) => ({ ...s, signedIn: false, isOwner: false, role: "member", username: null, vpnState: "Disconnected", stateDetail: "Not connected" }));
      } else if (message.type === "vpn.state") {
        const next = String(payload.state) as VpnState;
        if (payload.engine === "amneziawg" || payload.engine === "openvpn") {
          setState((s) => s.supportedEngines.includes(payload.engine as VpnEngine) ? { ...s, vpnEngine: payload.engine as VpnEngine } : s);
        }
        if (["Disconnected", "Connecting", "Connected", "Reconnecting", "Error"].includes(next)) {
          setVpnState(next, String(payload.detail ?? ""));
          pushLog(setState, next === "Error" ? "error" : "info", "engine", String(payload.detail ?? next));
        }
      } else if (message.type === "vpn.traffic") {
        const measure = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
        const inbound = measure(payload.inBytes);
        const outbound = measure(payload.outBytes);
        const at = Date.now();
        const last = trafficSample.current;
        const seconds = last ? Math.max((at - last.at) / 1000, 0.1) : 0;
        const downloadBps = seconds > 0 && inbound >= (last?.inBytes ?? Infinity)
          ? Math.round((inbound - last!.inBytes) / seconds) : 0;
        const uploadBps = seconds > 0 && outbound >= (last?.outBytes ?? Infinity)
          ? Math.round((outbound - last!.outBytes) / seconds) : 0;
        trafficSample.current = { at, inBytes: inbound, outBytes: outbound };
        setState((s) => ({ ...s, stats: {
          ...s.stats, inBytes: inbound, outBytes: outbound,
          durationSec: measure(payload.durationSec), downloadBps, uploadBps,
        } }));
      } else if (message.type === "update.status") {
        setState(s => ({ ...s, update: {
          version: String(payload.version ?? ""),
          detail: String(payload.detail ?? ""),
          available: payload.available === true,
          staged: payload.staged === true
        }}));
      } else if (message.type === "profile.accepted") {
        setState((s) => ({ ...s, profilePath: String(payload.fileName ?? "profile.ovpn"), profileValid: true }));
        pushLog(setState, "info", "profile", "Profile accepted and validated locally.");
      } else if (message.type === "profile.provisioning") {
        pushLog(setState, "info", "profile", String(payload.detail ?? "Profile provisioning pending."));
      } else if (message.type === "profile.cleared") {
        setState((s) => ({ ...s, profilePath: null, profileValid: false }));
      } else if (message.type === "doctor.result") {
        if (typeof payload.generatedUtc === "string" && Array.isArray(payload.checks)) {
          setState((s) => ({ ...s, doctor: payload as unknown as DoctorReport }));
        }
      } else if (message.type === "network.changed") {
        pushLog(setState, "info", "network", String(payload.detail ?? "Network changed."));
      } else if (message.type === "probe.result") {
        const milliseconds = typeof payload.milliseconds === "number" && Number.isFinite(payload.milliseconds)
          ? Math.round(payload.milliseconds) : null;
        probeSamples.current = [...probeSamples.current.slice(-19), payload.succeeded === true];
        if (milliseconds !== null) latencySamples.current = [...latencySamples.current.slice(-19), milliseconds];
        const history = latencySamples.current;
        const diffs = history.slice(1).map((n, i) => Math.abs(n - history[i]));
        const jitterMs = diffs.length ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null;
        const sorted = [...history].sort((a, b) => a - b);
        const p95LatencyMs = sorted.length >= 3 ? sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] : null;
        const probeLossPercent = Math.round(100 * probeSamples.current.filter((good) => !good).length / probeSamples.current.length);
        setState((s) => ({ ...s, stats: { ...s.stats, latencyMs: milliseconds, probeLossPercent, jitterMs, p95LatencyMs } }));
      }
    };
    window.chrome.webview.addEventListener("message", receive);
    window.chrome.webview.postMessage({ action: "ready" });
    return () => window.chrome?.webview?.removeEventListener("message", receive);
  }, [nativeAvailable, setVpnState]);

  const connect = useCallback(async () => {
    if (nativeAvailable) {
      const result = await sendNative("connect");
      if (!result.ok) pushLog(setState, "error", "engine", result.detail);
      return;
    }
    const s = stateRef.current;
    if (s.vpnState === "Connected" || s.vpnState === "Connecting") return;
    if (!s.profileValid) {
      pushLog(setState, "error", "profile", "No validated invite profile. Import one first.");
      return;
    }
    setVpnState("Connecting", "Starting secure tunnel...");
    for (const [, label] of [["WAIT", "Connecting: wait"], ["AUTH", "Connecting: auth"], ["GET_CONFIG", "Connecting: get config"], ["ASSIGN_IP", "Connecting: assign ip"], ["ADD_ROUTES", "Connecting: add routes"]] as const) {
      await wait(520);
      setVpnState("Connecting", label);
    }
    setVpnState("Connected", "Encrypted connection active");
    pushLog(setState, "info", "engine", "DESIGN DEMO: simulated tunnel state; no VPN was opened.");
  }, [nativeAvailable, sendNative, setVpnState]);

  // Passive connection monitoring. Probes never restart or alter an active VPN.
  useEffect(() => {
    if (!nativeAvailable || state.vpnState !== "Connected") {
      trafficSample.current = null;
      probeSamples.current = [];
      latencySamples.current = [];
      return;
    }
    let live = true;
    const measure = async () => {
      if (live) await sendNative("probe");
    };
    void measure();
    const handle = window.setInterval(() => { void measure(); }, 10000);
    return () => { live = false; window.clearInterval(handle); };
  }, [nativeAvailable, state.vpnState, sendNative]);

  const disconnect = useCallback(async () => {
    if (nativeAvailable) {
      const result = await sendNative("disconnect");
      if (!result.ok) pushLog(setState, "error", "engine", result.detail);
      return;
    }
    if (stateRef.current.vpnState === "Disconnected") return;
    await wait(450);
    setVpnState("Disconnected", "Disconnected");
    pushLog(setState, "info", "engine", "DESIGN DEMO: simulated disconnect; no VPN was opened.");
  }, [nativeAvailable, sendNative, setVpnState]);

  const toggleConnection = useCallback(() => {
    if (stateRef.current.vpnState === "Connected") void disconnect();
    else if (stateRef.current.vpnState === "Disconnected") void connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (nativeAvailable || state.vpnState !== "Connected") return;
    const id = setInterval(() => setState((s) => ({
      ...s,
      stats: { ...s.stats, inBytes: s.stats.inBytes + Math.round(Math.random() * 240000), outBytes: s.stats.outBytes + Math.round(Math.random() * 90000), durationSec: s.stats.durationSec + 1, latencyMs: 28 + Math.round(Math.random() * 22) },
    })), 1000);
    return () => clearInterval(id);
  }, [nativeAvailable, state.vpnState]);

  const signIn = useCallback(async (username: string, password: string, authUrl: string, requireApproval: boolean, rememberMe = true) => {
    setState((s) => ({ ...s, authUrl }));
    if (nativeAvailable) {
      const result = await sendNative("signIn", { username, password, authUrl, rememberMe });
      if (!result.ok) pushLog(setState, result.pending ? "warn" : "error", "auth", result.detail);
      return result;
    }
    await wait(700);
    if (requireApproval && !stateRef.current.deviceApproved) return { ok: false, detail: "DESIGN DEMO: device approval is simulated in the browser preview.", pending: true } as const;
    setState((s) => ({ ...s, signedIn: true, isOwner: false, role: "member", username, deviceApproved: true, authUrl }));
    return { ok: true, detail: `DESIGN DEMO: signed in as ${username}; no server session was created.` } as const;
  }, [nativeAvailable, sendNative]);

  const approveDevice = useCallback(() => {
    if (nativeAvailable) return;
    setState((s) => ({ ...s, deviceApproved: true }));
    pushLog(setState, "info", "auth", "DESIGN DEMO: owner approval simulated in preview.");
  }, [nativeAvailable]);

  const signOut = useCallback(() => {
    if (nativeAvailable) {
      void sendNative("signOut").then((result) => {
        if (!result.ok) pushLog(setState, "error", "auth", result.detail);
      });
      return;
    }
    setState((s) => ({ ...s, signedIn: false, isOwner: false, role: "member", username: null, vpnState: "Disconnected", stateDetail: "Not connected", stats: { inBytes: 0, outBytes: 0, durationSec: 0, latencyMs: null, downloadBps: 0, uploadBps: 0, probeLossPercent: null, jitterMs: null, p95LatencyMs: null } }));
  }, [nativeAvailable, sendNative]);

  const importProfile = useCallback(async (fileName: string, valid: boolean) => {
    if (nativeAvailable) return sendNative("importProfile", { vpnEngine: stateRef.current.vpnEngine });
    await wait(550);
    const extension = stateRef.current.vpnEngine === "amneziawg" ? ".conf" : ".ovpn";
    if (!fileName.toLowerCase().endsWith(extension) || !valid) return { ok: false, detail: "DESIGN DEMO: the preview rejected this profile." };
    setState((s) => ({ ...s, profilePath: fileName, profileValid: true }));
    return { ok: true, detail: "DESIGN DEMO: profile accepted; no file was sent to a VPN engine." };
  }, [nativeAvailable, sendNative]);

  const fetchProfile = useCallback(async () => {
    if (!nativeAvailable) return { ok: false, detail: "Auto-provisioning requires the Windows application." };
    const result = await sendNative("fetchProfile", { vpnEngine: stateRef.current.vpnEngine });
    if (!result.ok) pushLog(setState, "warn", "profile", result.detail);
    return result;
  }, [nativeAvailable, sendNative]);

  const ownerList = useCallback(async () => {
    if (!nativeAvailable) return { ok: false, detail: "Owner management requires the Windows app." } as CommandResult;
    return await sendNative("ownerList");
  }, [nativeAvailable, sendNative]);
  const ownerCreate = useCallback((username: string, password: string) => sendNative("ownerCreate", { username, password }), [sendNative]);
  const ownerApprove = useCallback((username: string, deviceId: string) => sendNative("ownerApprove", { username, deviceId }), [sendNative]);
  const ownerRevoke = useCallback((username: string, deviceId: string) => sendNative("ownerRevoke", { username, deviceId }), [sendNative]);
  const ownerEnable = useCallback((username: string, enabled: boolean) => sendNative("ownerEnable", { username, enabled }), [sendNative]);
  const ownerRole = useCallback((username: string, role: "admin" | "member") => sendNative("ownerRole", { username, role }), [sendNative]);

  const checkUpdates = useCallback(() => sendNative("checkForUpdates"), [sendNative]);
  const installUpdate = useCallback(() => sendNative("installUpdate"), [sendNative]);
  const ownerAudit = useCallback(() => sendNative("ownerAudit"), [sendNative]);

  const clearProfile = useCallback(() => {
    if (nativeAvailable) { void sendNative("clearProfile"); return; }
    setState((s) => ({ ...s, profilePath: null, profileValid: false }));
  }, [nativeAvailable, sendNative]);

  const updateSettings = useCallback((patch: Partial<Pick<AppState, "authUrl" | "enginePath" | "autoReconnect" | "autoInstallUpdates" | "vpnEngine">>) => {
    const requested = patch.vpnEngine;
    if (requested && (stateRef.current.vpnState !== "Disconnected" || !stateRef.current.supportedEngines.includes(requested))) {
      pushLog(setState, "warn", "engine", "Engine unavailable or VPN must be disconnected before switching.");
      return;
    }
    setState((s) => requested && requested !== s.vpnEngine
      ? { ...s, ...patch, profilePath: null, profileValid: false }
      : { ...s, ...patch });
    if (nativeAvailable) void sendNative("updateSettings", patch).then((result) => {
      if (!result.ok) pushLog(setState, "error", "engine", result.detail);
    });
  }, [nativeAvailable, sendNative]);

  const runProbe = useCallback(async () => {
    if (nativeAvailable) {
      const result = await sendNative("probe");
      if (!result.ok) pushLog(setState, "error", "latency", result.detail);
      return;
    }
    await wait(600);
    const ms = 32 + Math.round(Math.random() * 18);
    setState((s) => ({ ...s, stats: { ...s.stats, latencyMs: ms } }));
    pushLog(setState, "info", "latency", `DESIGN DEMO: simulated probe — ${ms} ms.`);
  }, [nativeAvailable, sendNative]);

  const runNetworkDoctor = useCallback(async () => {
    if (!nativeAvailable) return { ok: false, detail: "Windows network diagnostics require the installed app." };
    const result = await sendNative("networkDoctor");
    if (!result.ok) pushLog(setState, "warn", "doctor", result.detail);
    return result;
  }, [nativeAvailable, sendNative]);

  const repairDnsCache = useCallback(async () => {
    if (!nativeAvailable) return { ok: false, detail: "Windows DNS repair requires the installed app." };
    const result = await sendNative("repairDnsCache");
    pushLog(setState, result.ok ? "info" : "warn", "dns", result.detail);
    return result;
  }, [nativeAvailable, sendNative]);

  const exportDoctor = useCallback(async () => {
    if (!nativeAvailable) return { ok: false, detail: "Windows report export requires the installed app." };
    return await sendNative("exportDoctor");
  }, [nativeAvailable, sendNative]);

  return { state, nativeAvailable, signIn, approveDevice, signOut, toggleConnection, connect, disconnect,
    importProfile, fetchProfile, clearProfile, ownerList, ownerAudit, checkUpdates, installUpdate, ownerCreate, ownerApprove, ownerRevoke, ownerEnable, ownerRole,
    updateSettings, runProbe, runNetworkDoctor, repairDnsCache, exportDoctor };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}