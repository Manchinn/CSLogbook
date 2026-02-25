"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./page.module.css";
import { AppRole, getDashboardPathByRole } from "@/lib/auth/mockSession";
import { useAuth } from "@/contexts/AuthContext";
import { getSsoAuthorizeUrl } from "@/lib/api/authService";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const username = String(formData.get("username") ?? "");
      const password = String(formData.get("password") ?? "");
      const role = String(formData.get("role") ?? "student") as AppRole;

      const profile = await signIn({ username, password, role });
      const target = getDashboardPathByRole(profile.role, profile.teacherType, profile.isSystemAdmin);
      router.replace(target);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.form}>
      <a className={styles.ssoPrimaryButton} href={getSsoAuthorizeUrl("/app")}>
        เข้าสู่ระบบด้วย SSO KMUTNB
      </a>

      <p className={styles.divider}>หรือ</p>

      {showCredentialForm ? (
        <form onSubmit={handleSubmit} className={styles.credentialForm}>
          <label className={styles.label} htmlFor="username">
            Username / Email
          </label>
          <input id="username" name="username" required className={styles.input} />

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

          {false ? (
            <>
              <label className={styles.label} htmlFor="role">
                Role (Mock)
              </label>
              <select id="role" name="role" defaultValue="student" className={styles.select}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </>
          ) : null}

          {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}

          <button className={styles.secondaryButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          className={styles.ctaSecondary}
          onClick={() => setShowCredentialForm(true)}
        >
          ลงชื่อด้วยบัญชี Username/Password
        </button>
      )}
    </div>
  );
}
