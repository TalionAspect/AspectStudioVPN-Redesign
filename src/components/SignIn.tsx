import { useState } from "react";
import Button from "./Button";
import {
  ShieldIcon,
  KeyIcon,
  LockIcon,
  CpuIcon,
  ClockIcon,
} from "./icons";
import styles from "./SignIn.module.css";
import type { AppState } from "../state/types";

interface Props {
  state: AppState;
  onSignIn: (
    username: string,
    password: string,
    authUrl: string,
    requireApproval: boolean,
    rememberMe: boolean
  ) => Promise<{ ok: boolean; detail: string; pending?: boolean }>;
  onApprove: () => void;
  nativeAvailable: boolean;
}

export default function SignIn({ state, onSignIn, onApprove, nativeAvailable }: Props) {
  const [authUrl, setAuthUrl] = useState(state.authUrl);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await onSignIn(
      username.trim(),
      password,
      authUrl.trim(),
      true,
      rememberMe
    );
    setPassword("");
    setBusy(false);
    if (res.ok) return;
    if (res.pending) {
      setPending(true);
      return;
    }
    setError(res.detail);
  };

  return (
    <div className={styles.gate}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="/aspect-logo.svg" alt="Aspect Studio" />
        </div>
        <h1 className={styles.title}>Sign in to Aspect Studio</h1>
        <p className={styles.subtitle}>
          Hardware-key authenticated access to the private VPN
        </p>

        {pending ? (
          <div className={styles.pendingBox}>
            <div className={styles.pendingIcon}>
              <ClockIcon size={22} />
            </div>
            <h2 className={styles.title} style={{ fontSize: 16 }}>
              Awaiting owner approval
            </h2>
            <p
              className={styles.subtitle}
              style={{ marginBottom: 12, marginTop: 6 }}
            >
              Your device fingerprint was registered. Talion must approve it
              before the VPN tunnel can be opened.
            </p>
            <div className={styles.deviceRow} style={{ marginTop: 8 }}>
              <CpuIcon size={18} style={{ color: "var(--text-secondary)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  {state.deviceId.slice(0, 12)}…
                </div>
                <div className={styles.deviceInfo}>
                  {state.hardwareBacked ? "TPM 2.0" : "Software"} · ECDSA P-256
                </div>
              </div>
              <span
                className={`${styles.chip} ${
                  state.hardwareBacked ? styles.chipTpm : styles.chipSoft
                }`}
              >
                <KeyIcon size={11} />
                {state.hardwareBacked ? "TPM" : "Soft"}
              </span>
            </div>
            {!nativeAvailable && (
              <div style={{ marginTop: 16 }}>
                <Button variant="secondary" fullWidth onClick={onApprove}>
                  Simulate owner approval
                </Button>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setPending(false);
                  setError(null);
                }}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Authorization server</label>
                <input
                  className={styles.input}
                  value={authUrl}
                  onChange={(e) => setAuthUrl(e.target.value)}
                  placeholder="https://auth.aspect.studio"
                  spellCheck={false}
                />
                <div className={styles.hint}>
                  <LockIcon size={12} />
                  HTTPS endpoint provided by the owner
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                  className={styles.input}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="talion"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <div className={styles.hint}>
                  Passwords are never saved. Remember Me stores an encrypted device-bound token.
                </div>
              </div>

              <div className={styles.deviceRow}>
                <CpuIcon size={18} style={{ color: "var(--text-secondary)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    Device identity
                  </div>
                  <div className={styles.deviceInfo}>
                    {state.deviceId.slice(0, 23)}…
                  </div>
                </div>
                <span
                  className={`${styles.chip} ${
                    state.hardwareBacked ? styles.chipTpm : styles.chipSoft
                  }`}
                >
                  <KeyIcon size={11} />
                  {state.hardwareBacked ? "TPM 2.0" : "Software"}
                </span>
              </div>

              <label className={styles.rememberRow}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me on this approved device (30 days)</span>
              </label>

              {error && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                  <ShieldIcon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              <Button
                fullWidth
                onClick={submit}
                disabled={busy || !username || !password}
              >
                {busy ? (
                  <>
                    <span className={styles.spinner} />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <KeyIcon size={16} />
                    Sign in &amp; authorize device
                  </>
                )}
              </Button>
            </div>
            <div className={styles.secureNote}>
              <span className={styles.secureLine} />
              Protected by device-bound authentication
              <span className={styles.secureLine} />
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <span className={styles.hint}>
                {nativeAvailable ? "Your credentials are verified by the Aspect Studio authorization server." : "DESIGN DEMO: browser preview only; no server session is created."}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}