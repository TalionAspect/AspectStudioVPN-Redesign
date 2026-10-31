import { useCallback, useEffect, useState } from "react";
import Button from "./Button";
import type { OwnerData } from "../state/useAppState";
import styles from "./OwnerView.module.css";

type Result = { ok: boolean; detail: string; data?: OwnerData };
interface Props {
  onList: () => Promise<Result>;
  onAudit: () => Promise<{ok: boolean; detail: string; data?: unknown}>;
  onCreate: (username: string, password: string) => Promise<Result>;
  onApprove: (username: string, deviceId: string) => Promise<Result>;
  onRevoke: (username: string, deviceId: string) => Promise<Result>;
  onEnable: (username: string, enabled: boolean) => Promise<Result>;
  onRoleChange: (username: string, role: "admin" | "member") => Promise<Result>;
  role: "owner" | "admin" | "member";
}

export default function OwnerView({ onList, onAudit, onCreate, onApprove, onRevoke, onEnable, onRoleChange, role }: Props) {
  const [data, setData] = useState<OwnerData>({ accounts: [], devices: [] });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  type Audit = { summary: Record<string, number>; events: {actor: string; action: string; target: string; createdAt: number}[] };
  const [audit, setAudit] = useState<Audit | null>(null);
  const loadAudit = useCallback(async () => {
    if (role !== "owner") return;
    const response = await onAudit();
    if (response.ok && response.data && typeof response.data === "object") setAudit(response.data as Audit);
  }, [onAudit, role]);
  useEffect(() => { void loadAudit(); }, [loadAudit]);
  const refresh = useCallback(async () => {
    const result = await onList();
    if (result.ok && result.data) setData(result.data);
    else { setMessage(result.detail); setError(true); }
  }, [onList]);
  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (task: () => Promise<Result>) => {
    setBusy(true);
    try {
      const result = await task();
      setMessage(result.detail);
      setError(!result.ok);
      if (result.ok) { await refresh(); await loadAudit(); }
    } finally { setBusy(false); }
  };

  return <section className={styles.view}>
    <div className={styles.header}>
      <div>
        <span className={styles.eyebrow}>PRIVATE ADMINISTRATION</span>
        <h1>{role === "owner" ? "Owner Console" : "Admin Console"}</h1>
        <p>Manage user accounts, devices, and provisioning through an approved device session. Only the owner can assign admin roles.</p>
      </div>
      <Button variant="secondary" onClick={() => void refresh()} disabled={busy}>Refresh</Button>
    </div>

    <div className={styles.panel}>
      <h2>Create a friend’s account</h2>
      <p>Create a separate account and private profile for every person. Give them their credentials privately.</p>
      <form onSubmit={(e) => { e.preventDefault(); void run(async () => {
        const result = await onCreate(username.trim(), password);
        if (result.ok) { setUsername(""); setPassword(""); }
        return result;
      }); }} className={styles.create}>
        <label>Username <input value={username} onChange={e => setUsername(e.target.value)}
          required minLength={3} maxLength={32} pattern="[A-Za-z][A-Za-z0-9_-]{2,31}" placeholder="FriendUsername" /></label>
        <label>Initial password <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          required minLength={14} maxLength={256} autoComplete="new-password" placeholder="At least 14 characters" /></label>
        <Button type="submit" disabled={busy || password.length < 14}>Create account</Button>
      </form>
    </div>

    {message && <p className={`${styles.notice} ${error ? styles.error : ""}`} role="status">{message}</p>}

    <div className={styles.panel}>
      <h2>Accounts</h2>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Account</th><th>Role</th><th>Profile</th><th>Access</th><th>Actions</th></tr></thead><tbody>
      {data.accounts.map(account => <tr key={account.username}>
        <td>{account.username}</td><td>{account.role}</td>
        <td><span className={styles.pill}>{account.profileState}</span></td>
        <td>{account.enabled ? "Enabled" : "Disabled"}</td>
        <td><div className={styles.actions}>
          <Button variant="secondary" disabled={busy || account.role === "owner" || (role !== "owner" && account.role !== "member")}
            onClick={() => void run(() => onEnable(account.username, !account.enabled))}>
            {account.enabled ? "Disable" : "Enable"}</Button>
          {role === "owner" && account.role === "member" && <Button disabled={busy}
            variant="secondary" onClick={() => {
              if (window.confirm(`Promote ${account.username} to Admin? They will be able to manage users and devices.`))
                void run(() => onRoleChange(account.username, "admin"));
            }}>Make Admin</Button>}
          {role === "owner" && account.role === "admin" && <Button disabled={busy}
            variant="danger" onClick={() => {
              if (window.confirm(`Remove admin access from ${account.username}? Their sessions will be revoked.`))
                void run(() => onRoleChange(account.username, "member"));
            }}>Remove Admin</Button>}
        </div></td>
      </tr>)}</tbody></table></div>
    </div>

    <div className={styles.panel}>
      <h2>Device approvals</h2>
      <p>Friends sign in once, then you approve their registered device. Only one approved device per user.</p>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Account</th><th>Device fingerprint</th><th>Key</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {data.devices.map(device => <tr key={device.deviceId}>
        <td>{device.username}</td>
        <td className={styles.mono} title={device.deviceId}>{device.deviceId.slice(0, 20)}…</td>
        <td>{device.hardwareBacked ? "TPM" : "Software"}</td>
        <td>{device.approved ? "Approved" : "Pending"}</td>
        <td>{(data.accounts.find(a => a.username === device.username)?.role === "owner" ||
           (role !== "owner" && data.accounts.find(a => a.username === device.username)?.role !== "member"))
          ? "Owner only"
          : device.approved
          ? <Button variant="danger" disabled={busy} onClick={() => {
            if (window.confirm(`Revoke ${device.username}'s device?`)) void run(() => onRevoke(device.username, device.deviceId));
          }}>Revoke</Button>
          : <Button disabled={busy} onClick={() => void run(() => onApprove(device.username, device.deviceId))}>Approve</Button>}
        </td>
      </tr>)}</tbody></table></div>
    </div>
    {role === "owner" && <div className={styles.panel}>
      <div className={styles.header}><h2>Owner audit and analytics</h2>
        <Button variant="secondary" onClick={() => void loadAudit()}>Refresh activity</Button></div>
      {audit ? <>
        <div className={styles.actions}>
          {Object.entries(audit.summary).map(([key, val]) =>
            <span key={key} className={styles.pill}>{key.replace(/([A-Z])/g, " $1")}: {val}</span>)}
        </div>
        <p>Active app sessions are not live VPN sessions. Entries are restricted to the owner.</p>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Account</th></tr></thead>
          <tbody>{audit.events.map((event, index) => <tr key={index}>
            <td>{new Date(event.createdAt * 1000).toLocaleString()}</td>
            <td>{event.actor}</td><td>{event.action}</td><td>{event.target}</td>
          </tr>)}</tbody>
        </table></div>
      </> : <p>Audit requires the v0.8.6 server extension. No data available yet.</p>}
    </div>}
    <p className={styles.footnote}>Profile jobs run on your Oracle server. New profiles become available automatically after account creation and device approval.</p>
  </section>;
}