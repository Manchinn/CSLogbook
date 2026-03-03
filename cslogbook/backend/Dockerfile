# Stage 1: Install production dependencies only (keeps npm cache out of final image)
FROM node:18-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production runner image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy application source first
COPY . .

# Override node_modules with clean production-only install from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Create runtime directories
RUN mkdir -p uploads logs

# Place entrypoint at root path to match ENTRYPOINT reference
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/docker-entrypoint.sh"]
# NODE_ENV ถูกส่งจาก docker-compose แล้ว ไม่ต้องใช้ cross-env
CMD ["node", "server.js"]
