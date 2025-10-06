# syntax=docker/dockerfile:1.6

###########
# Build stage
###########
FROM node:18-alpine AS build
WORKDIR /app

# ติดตั้ง dependencies ที่จำเป็นสำหรับ alpine
RUN apk add --no-cache python3 make g++

# คัดลอกเฉพาะ package files ก่อน
COPY package*.json ./

# ติดตั้ง dependencies และลบ cache
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# คัดลอก source code
COPY . .

# กำหนดค่า build-time vars (override ผ่าน --build-arg)
ARG REACT_APP_API_URL
ARG REACT_APP_UPLOAD_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_UPLOAD_URL=${REACT_APP_UPLOAD_URL}
ENV NODE_ENV=production

# สร้าง production build และลบ node_modules (ปรับ memory limit สำหรับ 1GB RAM)
ENV NODE_OPTIONS="--max-old-space-size=768"
RUN npm run build && \
    rm -rf node_modules

###########
# Runtime stage
###########
FROM nginx:1.27-alpine AS runtime

# ตั้งค่า timezone/locale ตามที่ระบบใช้งาน (ตัวเลือก)
ENV TZ=Asia/Bangkok

# ลบ default config แล้วใช้ไฟล์ของเราเอง
RUN rm /etc/nginx/conf.d/default.conf
COPY config/docker/nginx.conf /etc/nginx/conf.d/default.conf

# คัดลอกไฟล์ build ที่สร้างไว้
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
