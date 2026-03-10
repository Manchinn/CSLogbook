# Debugging Guide — CSLogbook

| Symptom | Check |
|---|---|
| CORS errors | `FRONTEND_URL` + `ALLOWED_ORIGINS` in `.env`, `app.js` |
| 401 Unauthorized | `JWT_SECRET` ≥ 32 chars, token expiry |
| DB failure | DB env vars, MySQL running, `npm run db:check` |
| Missing columns | `npm run migrate` |
| Agents not running | `ENABLE_AGENTS=true` |
| Logs | `backend/logs/error.log`, `app.log` |
