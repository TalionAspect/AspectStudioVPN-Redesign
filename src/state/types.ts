export type VpnEngine = "openvpn" | "amneziawg";

export type VpnState =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | "Reconnecting"
  | "Error";

export interface DoctorCheck {
  id: string;
  status: "ok" | "warn" | "fail" | "info";
  detail: string;
}
export interface DoctorReport {
  generatedUtc: string;
  vpnState: string;
  checks: DoctorCheck[];
  serverTcpMs: number | null;
  guidance: string;
}

export interface VpnStats {
  inBytes: number;
  outBytes: number;
  durationSec: number;
  latencyMs: number | null;
  downloadBps: number;
  uploadBps: number;
  probeLossPercent: number | null;
  jitterMs: number | null;
  p95LatencyMs: number | null;
}

export type ViewId = "connect" | "profile" | "diagnostics" | "settings" | "credits" | "owner";

export interface AppState {
  signedIn: boolean;
  isOwner: boolean;
  role: "owner" | "admin" | "member";
  username: string | null;
  deviceApproved: boolean;
  hardwareBacked: boolean;
  deviceId: string;
  vpnState: VpnState;
  stateDetail: string;
  stats: VpnStats;
  profilePath: string | null;
  profileValid: boolean;
  authUrl: string;
  enginePath: string;
  vpnEngine: VpnEngine;
  supportedEngines: VpnEngine[];
  autoReconnect: boolean;
  autoInstallUpdates: boolean;
  update: { detail: string; version: string; available: boolean; staged: boolean };
  logs: LogEntry[];
  doctor: DoctorReport | null;
}

export interface LogEntry {
  time: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
}

export const initialState: AppState = {
  signedIn: false,
  isOwner: false,
  role: "member",
  username: null,
  deviceApproved: false,
  hardwareBacked: true,
  deviceId: "A4F2-91C8-3D7B-0E5A-6F1C-2B9D-8A4E",
  vpnState: "Disconnected",
  stateDetail: "Not connected",
  stats: { inBytes: 0, outBytes: 0, durationSec: 0, latencyMs: null, downloadBps: 0, uploadBps: 0, probeLossPercent: null, jitterMs: null, p95LatencyMs: null },
  profilePath: null,
  profileValid: false,
  authUrl: "https://api.aspectstudio.devs.surf:8443",
  enginePath: "C:\\Program Files\\OpenVPN\\bin\\openvpn.exe",
  vpnEngine: "openvpn",
  supportedEngines: ["openvpn"],
  autoReconnect: true,
  autoInstallUpdates: true,
  update: { detail: "Checking for releases…", version: "", available: false, staged: false },
  doctor: null,
  logs: [
    {
      time: "09:41:02",
      level: "info",
      source: "device",
      message: "Device identity loaded (TPM-backed, ECDSA P-256).",
    },
  ],
};