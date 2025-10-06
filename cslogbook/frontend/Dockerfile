# syntax=docker/dockerfile:1.6

###########
# Build stage
###########
FROM node:18-alpine AS build
WORKDIR /app

# ติดตั้ง dependencies สำหรับการ build
COPY package*.json ./
RUN npm ci

# คัดลอก source
COPY . .

# กำหนดค่า build-time vars (override ผ่าน --build-arg)
ARG REACT_APP_API_URL
ARG REACT_APP_UPLOAD_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_UPLOAD_URL=${REACT_APP_UPLOAD_URL}

# สร้าง production build (เพิ่ม memory limit 1GB สำหรับ Node.js)
RUN NODE_OPTIONS="--max-old-space-size=1024" npm run build

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
