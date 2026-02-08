import styles from "./StatCard.module.css";

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;
  return (
    <article className={styles.card}>
      <p>{label}</p>
      <strong>{displayValue}</strong>
    </article>
  );
}
