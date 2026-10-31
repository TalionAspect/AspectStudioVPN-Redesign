import Button from "./Button";
import {
  PowerIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  GaugeIcon,
  SignalIcon,
  ShieldIcon,
  FileIcon,
} from "./icons";
import type { AppState, VpnState } from "../state/types";
import styles from "./ConnectView.module.css";

interface Props {
  state: AppState;
  onToggle: () => void;
  onNavigateProfile: () => void;
}

const stateLabel: Record<VpnState, string> = {
  Disconnected: "Ready to connect",
  Connecting: "Establishing tunnel",
  Connected: "Tunnel protected",
  Reconnecting: "Restoring tunnel",
  Error: "Connection issue",
};

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  return [h, m, s].map((item) => String(item).padStart(2, "0")).join(":");
}

export default function ConnectView({ state, onToggle, onNavigateProfile }: Props) {
  const mode = state.vpnState;
  const busy = mode === "Connecting" || mode === "Reconnecting";
  const connected = mode === "Connected";
  const hasProfile = state.profileValid;
  const stage = mode === "Connected" ? "connected" : busy ? "working" : mode === "Error" ? "error" : "idle";

  const counters = [
    { title: "DOWNLOADED", value: formatBytes(state.stats.inBytes), icon: <ArrowDownIcon size={17} /> },
    { title: "UPLOADED", value: formatBytes(state.stats.outBytes), icon: <ArrowUpIcon size={17} /> },
    { title: "SESSION TIME", value: formatDuration(state.stats.durationSec), icon: <ClockIcon size={17} /> },
    { title: "SERVER PROBE", value: state.stats.latencyMs == null ? "—" : `${state.stats.latencyMs} ms`, icon: <GaugeIcon size={17} /> },
  ];

  return (
    <section className={styles.view} data-tunnel={stage} aria-label="VPN connection workspace">
      <div className={styles.intro}>
        <div>
          <div className={styles.eyebrow}><span className={styles.diamond} /> ASPECT STUDIO / PRIVATE NETWORK</div>
          <h1 className={styles.pageTitle}>Connection <span>control.</span></h1>
          <p className={styles.pageSub}>One secure session. Your device, your private tunnel.</p>
        </div>
        <div className={styles.topStatus} aria-live="polite"><span className={styles.statusLamp} /> {stateLabel[mode]}</div>
      </div>

      {!hasProfile && (
        <div className={styles.banner} role="status">
          <ShieldIcon size={19} />
          <span className={styles.bannerText}>No validated private profile is available for this account. Import your <code>.ovpn</code> profile to connect.</span>
          <Button variant="secondary" onClick={onNavigateProfile}><FileIcon size={15} /> Invite profile</Button>
        </div>
      )}

      <div className={styles.commandDeck}>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.visualGrid} />
          <div className={styles.ambientAura} />
          <div className={styles.orbitOuter} />
          <div className={styles.orbitMiddle} />
          <div className={styles.orbitInner} />
          <div className={styles.orbitArc} />
          <div className={styles.orbitNode} />
          <div className={styles.orb}>
            <div className={styles.orbRing} />
            <div className={styles.orbHighlight} />
            <div className={styles.orbCenter}><PowerIcon size={47} /></div>
          </div>
          <div className={styles.visualLabel}>AS / 01 <span>SECURE NETWORK</span></div>
          <div className={styles.visualCorner}>ENCRYPTED TUNNEL<br />DESKTOP CLIENT</div>
        </div>
        <div className={styles.commandPanel}>
          <div className={styles.commandKicker}><span className={styles.miniBar} /> TUNNEL STATUS <span className={styles.panelIndex}>01 — CONNECTION</span></div>
          <div className={styles.headline} aria-live="polite">{connected ? "You're protected." : busy ? "Securing the link." : mode === "Error" ? "Connection interrupted." : "Your network. Your rules."}</div>
          <p className={styles.detail}>{state.stateDetail || stateLabel[mode]}</p>
          <div className={styles.route}>
            <div className={styles.routeNode}><span className={styles.routeDot} /><div><strong>YOUR DEVICE</strong><small>{state.username ?? "Private client"}</small></div></div>
            <div className={`${styles.routeLine} ${connected ? styles.routeLineActive : ""}`}><i /><i /><i /></div>
            <div className={styles.routeNode}><span className={styles.serverDot} /><div><strong>MARSEILLE / FR</strong><small>84.235.229.141 · TCP 8444</small></div></div>
          </div>
          <button type="button" className={`${styles.connectButton} ${connected ? styles.disconnectButton : ""}`} onClick={onToggle} disabled={busy} aria-label={connected ? "Disconnect VPN" : busy ? "VPN connection in progress" : "Connect VPN"}>
            <PowerIcon size={19} />
            <span>{busy ? "Connecting…" : connected ? "Disconnect tunnel" : "Establish connection"}</span>
            <span aria-hidden="true" className={styles.btnArrow}>{busy ? "· · ·" : "↗"}</span>
          </button>
          <div className={styles.connectionFoot}>
            <span><ShieldIcon size={13} /> {state.deviceApproved ? "Approved device" : "Awaiting approval"}</span>
            <span><SignalIcon size={13} /> {connected ? "VPN active" : "VPN inactive"}</span>
          </div>
        </div>
      </div>

      <div className={styles.sectionTitle}><div><span className={styles.sectionIndex}>02 /</span> LIVE TELEMETRY</div><span className={styles.sectionCaption}>Reported by your VPN client</span></div>
      <div className={styles.statsGrid}>
        {counters.map((counter) => (
          <div className={styles.stat} key={counter.title}>
            <div className={styles.statHead}><span>{counter.title}</span>{counter.icon}</div>
            <div className={styles.statValue}>{counter.value}</div>
            <div className={styles.statRule} />
          </div>
        ))}
      </div>
      <div className={styles.footerTelemetry}>
        <div><span>DOWNLOAD RATE</span><strong>{connected ? `${formatBytes(state.stats.downloadBps)}/s` : "—"}</strong></div>
        <div><span>UPLOAD RATE</span><strong>{connected ? `${formatBytes(state.stats.uploadBps)}/s` : "—"}</strong></div>
        <div><span>TCP PROBE FAILURES</span><strong>{state.stats.probeLossPercent == null ? "—" : `${state.stats.probeLossPercent}%`}</strong></div>
        <p>Latency is the TCP handshake to your VPN server, not Roblox in-game ping.</p>
      </div>
    </section>
  );
}