import type { ReactNode } from "react";
import {
  PowerIcon,
  FileIcon,
  ActivityIcon,
  SettingsIcon,
  UserIcon,
  ShieldIcon,
} from "./icons";
import type { ViewId } from "../state/types";
import type { AppState } from "../state/types";
import styles from "./Sidebar.module.css";

interface Props {
  current: ViewId;
  onNavigate: (v: ViewId) => void;
  state: AppState;
  onSignOut: () => void;
  compact: boolean;
}

const items: { id: ViewId; label: string; icon: ReactNode }[] = [
  { id: "connect", label: "Connect", icon: <PowerIcon size={19} /> },
  { id: "profile", label: "Invite Profile", icon: <FileIcon size={19} /> },
  { id: "diagnostics", label: "Diagnostics", icon: <ActivityIcon size={19} /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon size={19} /> },
  { id: "credits", label: "Credits", icon: <ShieldIcon size={19} /> },
];

export default function Sidebar({ current, onNavigate, state, onSignOut, compact }: Props) {
  return (
    <nav className={`${styles.nav} ${compact ? styles.compact : ""}`}>
      <div className={styles.section}>Workspace</div>
      {items.map((it) => (
        <button
          key={it.id}
          className={`${styles.item} ${current === it.id ? styles.active : ""}`}
          onClick={() => onNavigate(it.id)}
        >
          {it.icon}
          {it.label}
          {it.id === "profile" && state.profileValid && (
            <span className={styles.badge}>Ready</span>
          )}
        </button>
      ))}

      {state.isOwner && <button className={`${styles.item} ${current === "owner" ? styles.active : ""}`} onClick={() => onNavigate("owner")}>
        <ShieldIcon size={19} /> {state.role === "owner" ? "Owner Console" : "Admin Console"}
      </button>}

      <div className={styles.spacer} />

      <div className={styles.identity}>
        <div className={styles.identityLabel}>
          {state.signedIn ? "Signed in" : "Not signed in"}
        </div>
        <div className={styles.identityName}>
          <UserIcon size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          {state.username ?? "—"}
        </div>
        <div className={styles.identityId}>{state.deviceId}</div>
        {state.signedIn && (
          <button className={styles.signOut} onClick={onSignOut}>
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}