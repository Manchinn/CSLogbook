import styles from "./StatCard.module.css";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <article className={styles.card}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
