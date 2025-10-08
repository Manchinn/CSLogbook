# syntax=docker/dockerfile:1.6

###########
# Dependencies stage - แยกการติดตั้ง dependencies
###########
FROM node:18-alpine AS deps
WORKDIR /app

# คัดลอกเฉพาะ package files
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm ci --no-audit --no-fund --prefer-offline

###########
# Build stage - สร้าง production build
###########
FROM node:18-alpine AS build
WORKDIR /app

# คัดลอก dependencies จาก deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# คัดลอก source code
COPY . .

# กำหนดค่า build-time variables
ARG REACT_APP_API_URL
ARG REACT_APP_UPLOAD_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_UPLOAD_URL=${REACT_APP_UPLOAD_URL}
ENV NODE_ENV=production

# ปรับ memory limit สำหรับ 2GB RAM server และปิด source maps
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV GENERATE_SOURCEMAP=false

# สร้าง production build
RUN npm run build

###########
# Runtime stage - เฉพาะไฟล์ที่จำเป็น
###########
FROM nginx:1.27-alpine AS runtime

# ตั้งค่า timezone
ENV TZ=Asia/Bangkok
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Bangkok /etc/localtime && \
    apk del tzdata

# ลบ default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# คัดลอก nginx config
COPY config/docker/nginx.conf /etc/nginx/conf.d/default.conf

# คัดลอกเฉพาะ build files จาก build stage
COPY --from=build /app/build /usr/share/nginx/html

# สร้าง non-root user สำหรับ security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# ตั้งค่า permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

USER nextjs

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
