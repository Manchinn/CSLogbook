FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create directories for uploads and logs
RUN mkdir -p uploads logs

# Use entrypoint to run migrations before start
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/docker-entrypoint.sh"]
# NODE_ENV ถูกส่งจาก docker-compose แล้ว ไม่ต้องใช้ cross-env
CMD ["node", "server.js"]
