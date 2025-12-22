# syntax=docker/dockerfile:1.6

# ใช้ Alpine เพื่อลดขนาด image พร้อมติดตั้ง build tools ที่จำเป็นสำหรับ native modules
FROM node:18-alpine AS base

# ติดตั้งแพ็กเกจที่จำเป็นสำหรับการคอมไพล์ไลบรารี (เช่น bcrypt)
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install -g npm@10 \
    && corepack enable

WORKDIR /app

# ติดตั้ง dependencies โดยไม่รวม devDependencies
COPY package*.json ./
RUN npm ci --omit=dev

# คัดลอกซอร์สโค้ดที่เหลือ
COPY . .

# กำหนดค่า environment พื้นฐาน (สามารถ override ได้ภายนอก)
ENV NODE_ENV=production \
    PORT=5000

# เปิดพอร์ต API
EXPOSE 5000

# ลบ build dependency เพื่อให้ image เล็กลงหลังติดตั้ง
RUN apk del .build-deps

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# คำสั่งเริ่มต้น
CMD ["node", "server.js"]
