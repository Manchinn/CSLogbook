"use client";

import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = "100%", height = "1rem", borderRadius = "6px", className = "" }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`${styles.textGroup} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  // Return only tbody content - parent already has thead
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton
                width={colIndex === 0 ? "60%" : "90%"}
                height="0.875rem"
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 4 }: CardSkeletonProps) {
  return (
    <div className={styles.cardGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardHeader}>
            <Skeleton width="40%" height="0.75rem" />
            <Skeleton width="30%" height="1.25rem" />
          </div>
          <SkeletonText lines={2} />
        </div>
      ))}
    </div>
  );
}

interface StatSkeletonProps {
  count?: number;
}

export function StatSkeleton({ count = 4 }: StatSkeletonProps) {
  return (
    <div className={styles.statsGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton width="50%" height="0.75rem" />
          <Skeleton width="30%" height="1.5rem" />
        </div>
      ))}
    </div>
  );
}
