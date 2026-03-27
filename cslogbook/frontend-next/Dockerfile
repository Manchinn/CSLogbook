# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time env (ฝังลงใน client bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Internal backend URL สำหรับ server-side rewrites (ชี้ตรงไป backend container)
ARG INTERNAL_BACKEND_URL=http://backend:5000
ENV INTERNAL_BACKEND_URL=$INTERNAL_BACKEND_URL

RUN npm run build

# Production stage - standalone output
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone build (standalone ไม่รวม public และ static)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
