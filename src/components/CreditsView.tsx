import { ShieldIcon, UserIcon } from "./icons";
import styles from "./CreditsView.module.css";

export default function CreditsView() {
  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Aspect Studio VPN</div>
        <h1 className={styles.title}>Credits</h1>
        <p className={styles.subtitle}>Built with care for a safer, quieter connection.</p>
      </div>

      <section className={styles.hero}>
        <div className={styles.logo}><img src="/logo_2_.png" alt="Aspect Studio" /></div>
        <div>
          <div className={styles.name}>TalionAspect</div>
          <div className={styles.role}>Creator and owner</div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardIcon}><UserIcon size={18} /></div>
        <div>
          <div className={styles.label}>Discord</div>
          <a className={styles.valueLink} href="https://discord.gg/ujqprPcAp" target="_blank" rel="noreferrer">
            talionaspect
          </a>
          <a className={styles.serverLink} href="https://discord.gg/ujqprPcAp" target="_blank" rel="noreferrer">
            Join my Discord server
          </a>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardIcon}><ShieldIcon size={18} /></div>
        <div>
          <div className={styles.label}>Project</div>
          <div className={styles.value}>Aspect Studio VPN</div>
          <div className={styles.detail}>Private, device-bound connectivity with a focus on secure access.</div>
        </div>
      </section>

      <div className={styles.footer}>Designed for the Aspect Studio desktop client · v0.7.0</div>
    </div>
  );
}