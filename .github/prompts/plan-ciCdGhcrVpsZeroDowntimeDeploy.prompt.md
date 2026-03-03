# Plan: Full CI/CD — Build → GHCR → VPS Zero-Downtime Deploy

**TL;DR:** Replace the current "SSH git pull + build on server" approach with a proper pipeline. GitHub Actions builds optimized Docker images, pushes to GHCR using the automatic `GITHUB_TOKEN`, then SSHes into the VPS to pull pre-built images and restart with `--remove-orphans` for zero-downtime. Four files change: the old workflow is replaced, compose file switches from `build:` to `image:`, backend Dockerfile gains multi-stage, frontend Dockerfile gets a minor `PORT` fix. Four GitHub Secrets must be configured.

---

## Steps

### 1. Delete `.github/workflows/deploy.yml`
Replaced entirely by the new file below.

---

### 2. Create `.github/workflows/production-deploy.yml`

Workflow structure:

- `on: push: branches: [master]`
- `permissions: contents: read, packages: write` — grants GITHUB_TOKEN the right to push to GHCR
- **Step 1**: `actions/checkout@v4`
- **Step 2**: `docker/login-action@v3` — `registry: ghcr.io`, `username: ${{ github.actor }}`, `password: ${{ secrets.GITHUB_TOKEN }}`
- **Step 3**: Build backend image from `./cslogbook/backend` — tags:
  - `ghcr.io/${{ github.repository_owner }}/cslogbook-backend:latest`
  - `ghcr.io/${{ github.repository_owner }}/cslogbook-backend:${{ github.sha }}`
- **Step 4**: Build frontend image from `./cslogbook/frontend-next` — same dual-tag pattern, pass `--build-arg NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}`
- **Step 5**: Push both images (both tags) via `docker push`
- **Step 6**: `appleboy/ssh-action@v1.0.3` with `script_stop: true`; secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`; `ssh_extra_args: -o StrictHostKeyChecking=accept-new`
- **Step 7 (on server)**:
  ```bash
  cd /home/deploy/app/cslogbook
  git pull
  docker compose --env-file .env.production -f docker-compose.production.yml pull
  docker compose --env-file .env.production -f docker-compose.production.yml up -d --remove-orphans
  docker image prune -f
  ```

---

### 3. Update `cslogbook/docker-compose.production.yml`

- `backend` service: remove the `build: context: ./backend` block → add `image: ghcr.io/${GHCR_OWNER}/cslogbook-backend:latest`
- `frontend` service: remove the entire `build:` block (including `args: NEXT_PUBLIC_API_URL`) → add `image: ghcr.io/${GHCR_OWNER}/cslogbook-frontend:latest`
- `mysql` service: **untouched**
- All `volumes:`, `ports:`, `depends_on:`, `env_file:`, `environment:`, `deploy.resources` blocks: **untouched**

---

### 4. Refactor `cslogbook/backend/Dockerfile` — add multi-stage build

Current file is single-stage. New structure:

- **Stage 1 `deps`** (`node:18-alpine`): copy `package*.json`, run `npm ci --omit=dev` — produces clean `node_modules` with no npm cache
- **Stage 2 `runner`** (`node:18-alpine`): copy `node_modules` from `deps`, copy all source, copy and `chmod +x docker-entrypoint.sh`, `mkdir -p uploads logs`, `EXPOSE 5000`, existing `ENTRYPOINT`/`CMD` unchanged

Net effect: no npm cache in final image; build cache layer for `node_modules` is separate from source code layer (faster rebuilds on source-only changes).

---

### 5. Minor fix to `cslogbook/frontend-next/Dockerfile`

Already multi-stage and correct. One addition to the `runner` stage:

- Add `ENV PORT=3000` and `ENV HOSTNAME=0.0.0.0` — Next.js standalone server uses these; prevents silent bind-to-127.0.0.1-only issue in some Alpine environments.

---

### 6. Add `GHCR_OWNER=manchinn` to `.env.production` on server

This variable is consumed by the updated compose `image:` references. Must be lowercase (GHCR requirement).

---

## Required GitHub Secrets

Settings → Secrets and variables → Actions → New repository secret

| Secret name | Value | Why secret? |
|---|---|---|
| `VPS_HOST` | `168.144.38.167` | Prevents IP enumeration from public YAML |
| `VPS_USER` | `deploy` | Deploy account name |
| `VPS_SSH_KEY` | Private SSH key (PEM, `-----BEGIN...`) | Credentials |
| `NEXT_PUBLIC_API_URL` | `https://168.144.38.167/api` | Baked into frontend bundle at build time — keep out of YAML |

`GITHUB_TOKEN` is **automatic** — no setup required.

---

## Security Decisions

| Decision | Rationale |
|---|---|
| `GITHUB_TOKEN` instead of PAT for GHCR | Auto-rotates, scoped to this repo only, zero maintenance |
| `StrictHostKeyChecking=accept-new` | Trusts host on first connect, rejects key changes — protects against MITM without needing a `VPS_KNOWN_HOSTS` setup step |
| Dual image tags (`:latest` + `:<sha>`) | Rollback is `docker pull ghcr.io/manchinn/cslogbook-backend:<old-sha>` then edit compose and `up -d` |
| `--remove-orphans` in `up -d` | Ensures any removed services are cleaned up on each deploy |
| `NEXT_PUBLIC_API_URL` stored as Secret | Keeps server URL out of public workflow YAML even though the value is technically public |
| `docker image prune -f` (not `--all`) | Removes only dangling layers; preserves the two newest image versions for quick rollback |
| Containers bound to `127.0.0.1` only | Nginx is the sole ingress point; no direct public access to ports 3000 or 5000 |
| `script_stop: true` in ssh-action | Server-side errors propagate back to GitHub Actions as workflow failures |

---

## Verification

1. Push any commit to `master` → watch Actions tab for all 7 steps to go green
2. On server: `docker ps` should show 3 containers (`cslogbook-mysql`, `cslogbook-backend`, `cslogbook-frontend`) with fresh `Up X seconds` timestamps
3. `curl http://168.144.38.167/api/health` → should return `200`
4. `docker images | grep ghcr.io` should show both `:latest` and `:<sha>` tags pulled
5. `docker image prune -f` output should list removed dangling layers
