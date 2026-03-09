import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.API_URL || 'http://localhost:5000/api';

  try {
    const res = await fetch(`${apiUrl}/health`);
    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }
    console.log('Backend is healthy');
  } catch (error) {
    throw new Error(
      `Backend health check failed (${apiUrl}/health). ` +
      'Make sure the backend is running on port 5000.\n' +
      `Error: ${error}`
    );
  }
}

export default globalSetup;
