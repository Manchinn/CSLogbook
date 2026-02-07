"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import styles from "./page.module.css";
import { AppRole, MOCK_ROLE_KEY } from "@/lib/auth/mockSession";

export function LoginForm() {
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const role = String(formData.get("role") ?? "student") as AppRole;

    window.localStorage.setItem(MOCK_ROLE_KEY, role);
    router.push("/app");
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

      <label className={styles.label} htmlFor="role">
        Role (Mock)
      </label>
      <select id="role" name="role" defaultValue="student" className={styles.select}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>

      <button className={styles.submitButton} type="submit">
        Sign in
      </button>
    </form>
  );
}
