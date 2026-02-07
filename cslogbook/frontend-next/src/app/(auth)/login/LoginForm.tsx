"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./page.module.css";
import { AppRole } from "@/lib/auth/mockSession";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const role = String(formData.get("role") ?? "student") as AppRole;

      await signIn({ email, password, role });
      router.push("/app");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
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

      {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
