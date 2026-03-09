import { test as setup } from '@playwright/test';
import { loginViaUI } from '../helpers/login';
import dotenv from 'dotenv';

dotenv.config();

const roles = [
  {
    name: 'officer',
    file: 'auth/officer.json',
    usernameEnv: 'OFFICER_USERNAME',
    passwordEnv: 'OFFICER_PASSWORD',
  },
  {
    name: 'advisor',
    file: 'auth/advisor.json',
    usernameEnv: 'ADVISOR_USERNAME',
    passwordEnv: 'ADVISOR_PASSWORD',
  },
  {
    name: 'student',
    file: 'auth/student.json',
    usernameEnv: 'STUDENT_USERNAME',
    passwordEnv: 'STUDENT_PASSWORD',
  },
];

for (const role of roles) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    const username = process.env[role.usernameEnv];
    const password = process.env[role.passwordEnv];

    if (!username || !password) {
      throw new Error(
        `Missing env vars: ${role.usernameEnv} and ${role.passwordEnv} are required`
      );
    }

    await loginViaUI(page, username, password);
    await page.context().storageState({ path: role.file });
    console.log(`Authenticated as ${role.name} -> ${role.file}`);
  });
}
