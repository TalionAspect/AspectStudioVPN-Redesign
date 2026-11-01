import { useRef, useState } from "react";
import Button from "./Button";
import {
  UploadIcon,
  FileIcon,
  CheckIcon,
  ShieldIcon,
  TrashIcon,
  XIcon,
} from "./icons";
import type { AppState } from "../state/types";
import styles from "./ProfileView.module.css";

interface Props {
  state: AppState;
  nativeAvailable: boolean;
  onImport: (fileName: string, valid: boolean) => Promise<{ ok: boolean; detail: string }>;
  onClear: () => void;
  onFetch: () => Promise<{ ok: boolean; detail: string }>;
}

const directives = [
  "client", "dev tun", "proto tcp-client", "remote 84.235.229.141 8444",
  "verify-x509-name", "auth SHA256", "data-ciphers AES-256-GCM",
  "tls-crypt", "<ca>", "<cert>", "<key>", "resolv-retry 5", "nobind",
  "persist-key", "persist-tun",
];

export default function ProfileView({ state, nativeAvailable, onImport, onClear, onFetch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isAmnezia = state.vpnEngine === "amneziawg";
  const profileExtension = isAmnezia ? ".conf" : ".ovpn";
  const [result, setResult] = useState<{ ok: boolean; detail: string } | null>(null);

  const handleImport = async (name: string, valid: boolean) => {
    setBusy(true);
    setResult(null);
    const res = await onImport(name, valid);
    setResult(res);
    setBusy(false);
  };

  const openPicker = () => {
    if (nativeAvailable) {
      void handleImport("", true);
      return;
    }
    inputRef.current?.click();
  };

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invite Profile</h1>
        <p className={styles.subtitle}>
          Import a private <code>{profileExtension}</code> invitation file. The profile is
          validated locally — only allowlisted directives are accepted.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={isAmnezia ? ".conf" : ".ovpn"}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImport(f.name, true);
          e.target.value = "";
        }}
      />

      {nativeAvailable && (
        <div className={styles.actions} style={{ marginBottom: 16 }}>
          <Button variant="primary" onClick={() => {
            setBusy(true);
            void onFetch().then(setResult).finally(() => setBusy(false));
          }} disabled={busy}>
            <ShieldIcon size={15} /> {busy ? "Checking profile…" : "Get my private profile automatically"}
          </Button>
          <span style={{ color: "var(--text-secondary)", fontSize: 12, alignSelf: "center" }}>
            After your device is approved, the native host can provision your engine-specific profile.
          </span>
        </div>
      )}

      {!state.profileValid ? (
        <div className={styles.dropZone} onClick={openPicker}>
          <div className={styles.dropIcon}>
            {busy ? (
              <span
                style={{
                  width: 24,
                  height: 24,
                  border: "2.5px solid var(--accent)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <UploadIcon size={24} />
            )}
          </div>
          <div className={styles.dropTitle}>
            {busy ? "Validating profile…" : "Drop your {profileExtension} file here"}
          </div>
          <div className={styles.dropHint}>
            or click to browse — {isAmnezia ? "AmneziaWG UDP 51820" : "OpenVPN TCP 8444"}; native validation is required
          </div>
          {!nativeAvailable && (
            <div className={styles.sampleRow}>
              <button
                className={styles.sample}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleImport(isAmnezia ? "aspect-invite.conf" : "aspect-invite.ovpn", true);
                }}
              >
                Load demo invite
              </button>
              <button
                className={styles.sample}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleImport("bad-profile.ovpn", false);
                }}
              >
                Load demo rejection
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <FileIcon size={17} style={{ color: "var(--success)" }} />
            Active profile
            <span className={`${styles.statusChip} ${styles.statusOk}`} style={{ marginLeft: "auto" }}>
              <CheckIcon size={12} />
              Validated
            </span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowKey}>File</span>
            <span className={styles.rowVal}>{state.profilePath}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowKey}>Server</span>
            <span className={styles.rowVal}>84.235.229.141</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowKey}>Protocol</span>
            <span className={styles.rowVal}>{isAmnezia ? "AmneziaWG / UDP 51820" : "OpenVPN / TCP 8444"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowKey}>Cipher</span>
            <span className={styles.rowVal}>{isAmnezia ? "ChaCha20-Poly1305" : "AES-256-GCM"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowKey}>Cert chain</span>
            <span className={styles.rowVal}>CA + client cert + key embedded</span>
          </div>

          <div className={styles.directives}>
            {directives.map((d) => (
              <span key={d} className={styles.directive}>
                {d}
              </span>
            ))}
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={openPicker}>
              <UploadIcon size={15} />
              Replace profile
            </Button>
            <Button variant="danger" onClick={onClear}>
              <TrashIcon size={15} />
              Remove
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className={`${styles.alert} ${result.ok ? styles.alertOk : styles.alertErr}`}>
          {result.ok ? (
            <CheckIcon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <XIcon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <span>{result.detail}</span>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <ShieldIcon size={17} style={{ color: "var(--accent)" }} />
          Validation policy
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          The validator rejects profiles that reference unapproved servers,
          include external script calls, or use unsupported inline blocks. Only
          directives needed by the private server are accepted. The file must
          embed its CA, client certificate, and key directly — external password
          files are not supported.
        </p>
      </div>
    </div>
  );
}