"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import styles from "./page.module.css";

export function LoginForm() {
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <input id="email" name="email" type="email" required className={styles.input} />

      <label className={styles.label} htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        className={styles.input}
      />

      <button className={styles.submitButton} type="submit">
        Sign in
      </button>
    </form>
  );
}
