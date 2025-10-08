# ใช้ภาพ Node.js อย่างเป็นทางการเป็น base image
FROM node:18-alpine AS build

# ตั้งค่า working directory
WORKDIR /app

# คัดลอก package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกโค้ดที่เหลือ
COPY . .

# สร้างแอปพลิเคชัน
RUN npm run build

# ใช้ Nginx เพื่อ serve ไฟล์ที่สร้าง
FROM nginx:alpine

# คัดลอกไฟล์ที่สร้างจากขั้นตอนก่อนหน้า
COPY --from=build /app/build /usr/share/nginx/html

# คัดลอกไฟล์การตั้งค่า Nginx
COPY config/docker/nginx.conf /etc/nginx/conf.d/default.conf

# เปิดพอร์ต 80
EXPOSE 80

# เริ่มต้น Nginx
CMD ["nginx", "-g", "daemon off;"]
