import Button from "./Button";
import {
  KeyIcon,
  CpuIcon,
  ActivityIcon,
  RefreshIcon,
  GaugeIcon,
} from "./icons";
import type { AppState } from "../state/types";
import styles from "./DiagnosticsView.module.css";

interface Props {
  state: AppState;
  onProbe: () => void;
  onDoctor: () => void;
  onRepairDns: () => void;
  onExport: () => void;
  nativeAvailable: boolean;
}

export default function DiagnosticsView({ state, onProbe, onDoctor, onRepairDns, onExport, nativeAvailable }: Props) {
  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <h1 className={styles.title}>Diagnostics</h1>
        <p className={styles.subtitle}>
          Network Doctor, DNS recovery, safe routing checks, and server-probe quality. Live Roblox ping is measured inside Roblox.
        </p>
      </div>

      <div className={styles.topRow}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <KeyIcon size={16} style={{ color: "var(--accent)" }} />
            Device identity
          </div>
          <div className={styles.idGrid}>
            <div className={styles.idRow}>
              <span className={styles.idKey}>Fingerprint</span>
              <span className={styles.fingerprintWrap}>
                <span className={styles.fingerprintText} title={state.deviceId}>{state.deviceId}</span>
                <button type="button" className={styles.copyId} aria-label="Copy device fingerprint"
                  title="Copy full fingerprint" onClick={() => void navigator.clipboard?.writeText(state.deviceId)}>Copy</button>
              </span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idKey}>Algorithm</span>
              <span className={styles.idVal}>ECDSA P-256</span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idKey}>Key storage</span>
              <span
                className={`${styles.chip} ${
                  state.hardwareBacked ? styles.chipTpm : styles.chipSoft
                }`}
              >
                <CpuIcon size={11} />
                {state.hardwareBacked ? "TPM 2.0" : "Software"}
              </span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idKey}>Approval</span>
              <span className={styles.idVal}>
                {state.deviceApproved ? "Approved" : "Pending"}
              </span>
            </div>
            <div className={styles.idRow}>
              <span className={styles.idKey}>Signed in</span>
              <span className={styles.idVal}>
                {state.username ?? "No session"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <GaugeIcon size={16} style={{ color: "var(--success)" }} />
            Latency probe
          </div>
          <div className={styles.probeTarget}>84.235.229.141 : 8444 (TCP)</div>
          <div className={styles.probeBox}>
            <div>
              <span className={styles.probeVal}>
                {state.stats.latencyMs ?? "—"}
              </span>
              {state.stats.latencyMs != null && (
                <span className={styles.probeUnit}> ms</span>
              )}
            </div>
            <Button variant="secondary" onClick={onProbe}>
              <RefreshIcon size={15} />
              Probe now
            </Button>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
            Measures the TCP handshake to Marseille, not game ping. Changes in
            network routing, not just this number, affect Roblox latency.
            Probe failures do not directly measure in-game packet loss.
          </div>
        </div>
      </div>

      <div className={styles.doctorCard}>
        <div className={styles.doctorHead}>
          <div>
            <div className={styles.cardTitle}><ActivityIcon size={16} /> Network Doctor</div>
            <div className={styles.smallNote}>Read-only checks. DNS cache repair only works while disconnected; active VPN routes are never changed.</div>
          </div>
          <div className={styles.doctorActions}>
            <Button variant="secondary" onClick={onDoctor} disabled={!nativeAvailable}>Run checks</Button>
            <Button variant="secondary" onClick={onRepairDns} disabled={!nativeAvailable || state.vpnState !== "Disconnected"}>Repair DNS cache</Button>
            <Button variant="secondary" onClick={onExport} disabled={!nativeAvailable || !state.doctor}>Export report</Button>
          </div>
        </div>
        {state.doctor ? (
          <>
            <div className={styles.smallNote}>Report: {new Date(state.doctor.generatedUtc).toLocaleString()} · VPN: {state.doctor.vpnState}</div>
            <div className={styles.checksGrid}>
              {state.doctor.checks.map((check) => (
                <div className={styles.checkRow} key={check.id}>
                  <span className={styles.checkName}>{check.id.toUpperCase()}</span>
                  <span className={`${styles.checkBadge} ${styles[check.status]}`}>{check.status}</span>
                  <span className={styles.checkDetail}>{check.detail}</span>
                </div>
              ))}
            </div>
            <div className={styles.smallNote}>{state.doctor.guidance}</div>
          </>
        ) : <div className={styles.smallNote}>Run checks to see DNS, gateway, API, profile, OpenVPN adapter, and route health.</div>}
      </div>
      <div className={styles.qualityCard}>
        <div className={styles.cardTitle}><GaugeIcon size={16} /> Gaming connection quality</div>
        <div className={styles.qualityGrid}>
          <div><strong>{state.stats.latencyMs ?? "—"} ms</strong><span>Latest TCP probe</span></div>
          <div><strong>{state.stats.jitterMs ?? "—"} ms</strong><span>Probe jitter (mean delta)</span></div>
          <div><strong>{state.stats.p95LatencyMs ?? "—"} ms</strong><span>95th-percentile probe latency</span></div>
          <div><strong>{state.stats.probeLossPercent ?? "—"}%</strong><span>Failed server TCP probes</span></div>
        </div>
        <div className={styles.smallNote}>These are TCP/8444 probe metrics, not Roblox packets. Compare Roblox Performance Stats in the same server and experience. UDP gaming is not enabled until a separate authenticated UDP server passes tests.</div>
      </div>

      <div className={styles.logWrap}>
        <div className={styles.logHead}>
          <div className={styles.logHeadTitle}>
            <ActivityIcon size={16} style={{ color: "var(--accent)" }} />
            Management log
            <span className={styles.logMeta}>
              {state.logs.length} entries
            </span>
          </div>
          <span className={styles.logMeta}>
            openvpn-management · live stream
          </span>
        </div>
        <div className={styles.logBody}>
          {state.logs.map((log, i) => (
            <div key={i} className={styles.logLine}>
              <span className={styles.logTime}>{log.time}</span>
              <span
                className={`${styles.logSrc} ${
                  styles[`src${log.level[0].toUpperCase()}${log.level.slice(1)}`]
                }`}
              >
                {log.source}
              </span>
              <span className={styles.logMsg}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}